# frozen_string_literal: true

class DiscussionSessionsController < ApplicationController
  include Authenticatable
  include IdeaFromRoute
  include ActionController::Live
  include ChatMessageJson

  before_action :require_authentication!
  before_action :set_idea, only: %i[index create show create_message pin]
  before_action :set_session, only: %i[show create_message pin]
  before_action :require_editable!, only: %i[create create_message pin]

  def index
    sessions = @idea.chat_sessions.order(created_at: :desc)
    render json: { sessions: sessions.map { |s| discussion_session_json(s) } }
  end

  def create
    @idea.chat_sessions.where(archived_at: nil).update_all(archived_at: Time.current)
    session = @idea.chat_sessions.create!(messages: [], archived_at: nil)
    render json: discussion_session_json(session), status: :created
  end

  def show
    render json: discussion_session_json(@session)
  end

  def create_message
    content = params[:content].to_s.strip
    return render json: { errors: ["Content is required"] }, status: :unprocessable_entity if content.blank?

    user_message = build_message("user", content, current_user.id)
    @session.messages = (@session.messages || []) + [user_message]
    @session.save!

    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    assistant_content = +""
    stream_success = false
    begin
      ClaudeChatService.new.stream_chat(
        system_prompt: build_discussion_system_prompt,
        messages: @session.messages
      ) do |chunk|
        assistant_content << chunk
        response.stream.write("data: #{escape_sse(chunk)}\n\n")
      end
      stream_success = true
    rescue StandardError => e
      Rails.logger.error("[DiscussionSessions] stream error: #{e.message}")
    ensure
      response.stream.close
    end

    if stream_success && assistant_content.present?
      assistant_message = build_message("assistant", assistant_content, nil)
      @session.messages = (@session.messages || []) + [assistant_message]
      @session.save!
    end
  end

  def pin
    message_id = params[:message_id].to_s
    msg = (@session.messages || []).find { |m| m["id"] == message_id }
    return render json: { errors: ["Message not found"] }, status: :unprocessable_entity unless msg

    @idea.update!(
      pinned_message_id: message_id,
      pinned_message_content: msg["content"].to_s.truncate(500)
    )
    render json: { pinned_message_id: message_id, pinned_message_content: @idea.pinned_message_content }
  end

  private

  def set_session
    if params[:id] == "current" || params[:id].nil?
      @session = @idea.chat_sessions.find_by(archived_at: nil)
    else
      @session = @idea.chat_sessions.find_by(id: params[:id])
    end
    return head :not_found if @session.nil?
  end

  def build_message(role, content, user_id)
    {
      "id" => SecureRandom.uuid,
      "role" => role,
      "user_id" => user_id,
      "content" => content
    }
  end

  def build_discussion_system_prompt
    parts = [
      "You are a critical thinking partner in IdeaMode. The user is refining an idea and wants you to pressure-test it.",
      "Challenge assumptions, ask hard questions, and help them articulate the problem and target customer clearly.",
      "Do not be a cheerleader; be constructive but rigorous. If something is unclear or underdeveloped, say so."
    ]
    parts << "\n\nIdea: #{@idea.title}"
    parts << "\nDescription: #{@idea.description}" if @idea.description.present?

    if @idea.brainstorm_id.present?
      brainstorm = @idea.brainstorm
      parts << "\n\n--- Context from linked brainstorm \"#{brainstorm.title}\" ---"
      bs_session = brainstorm.chat_session
      if bs_session&.messages&.any?
        parts << "\n\nBrainstorm chat history:"
        bs_session.messages.each do |m|
          role_label = m["role"] == "assistant" ? "Ideabot" : "User"
          parts << "\n#{role_label}: #{m['content'].to_s.truncate(800)}"
        end
      end
      note = brainstorm.brainstorm_note
      if note&.content.present?
        note_text = tiptap_content_to_plain(note.content)
        parts << "\n\nBrainstorm notes: #{note_text.truncate(2000)}" if note_text.present?
      end
    end

    parts.join(" ")
  end

  def tiptap_content_to_plain(content)
    return "" if content.blank?
    return content.to_s if content.is_a?(String)
    return "" unless content.is_a?(Hash)

    nodes = content["content"]
    return "" unless nodes.is_a?(Array)

    nodes.map { |node| node["text"] || (node["content"] ? tiptap_content_to_plain({ "content" => node["content"] }) : "") }.join(" ")
  end

  def escape_sse(str)
    str.to_s.gsub("\n", "\\n").to_json
  end

  def discussion_session_json(session)
    {
      id: session.id,
      idea_id: session.idea_id,
      messages: map_messages_json(session.messages || []),
      archived_at: session.archived_at,
      created_at: session.created_at,
      pinned_message_id: @idea.pinned_message_id,
      pinned_message_content: @idea.pinned_message_content
    }
  end
end
