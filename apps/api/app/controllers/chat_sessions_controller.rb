# frozen_string_literal: true

class ChatSessionsController < ApplicationController
  include Authenticatable
  include BrainstormFromRoute
  include ActionController::Live

  before_action :require_authentication!
  before_action :set_brainstorm, only: %i[show create_message pin]

  def show
    session = find_or_create_session
    render json: chat_session_json(session)
  end

  def create_message
    return head :forbidden unless @brainstorm.editable_by?(current_user)

    content = params[:content].to_s.strip
    return render json: { errors: ["Content is required"] }, status: :unprocessable_entity if content.blank?

    session = find_or_create_session
    user_message = build_message("user", content, current_user.id)
    session.messages = (session.messages || []) + [user_message]
    session.save!

    unless ClaudeChatService.ideabot_trigger?(content)
      return render json: { message: message_json(user_message), session: chat_session_json(session) }
    end

    # Stream assistant reply via SSE
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    assistant_content = +""
    begin
      ClaudeChatService.new.stream_chat(
        system_prompt: build_system_prompt,
        messages: session.messages
      ) do |chunk|
        assistant_content << chunk
        response.stream.write("data: #{escape_sse(chunk)}\n\n")
      end
    ensure
      response.stream.close
    end

    assistant_message = build_message("assistant", assistant_content, nil)
    session.messages = (session.messages || []) + [assistant_message]
    session.save!
  end

  def pin
    return head :forbidden unless @brainstorm.editable_by?(current_user)

    message_id = params[:message_id].to_s
    session = @brainstorm.chat_session
    return render json: { errors: ["No chat session"] }, status: :unprocessable_entity unless session

    msg = (session.messages || []).find { |m| m["id"] == message_id }
    return render json: { errors: ["Message not found"] }, status: :unprocessable_entity unless msg

    @brainstorm.update!(
      pinned_message_id: message_id,
      pinned_message_content: msg["content"].to_s.truncate(500)
    )
    render json: { pinned_message_id: message_id, pinned_message_content: @brainstorm.pinned_message_content }
  end

  private

  def find_or_create_session
    @brainstorm.chat_session || @brainstorm.create_chat_session!(messages: [])
  end

  def build_message(role, content, user_id)
    {
      "id" => SecureRandom.uuid,
      "role" => role,
      "user_id" => user_id,
      "content" => content
    }
  end

  def build_system_prompt
    parts = [
      "You are Ideabot,a business consultant in IdeaMode with deep expertise in idea generation and validation and a creative thinking partner in IdeaMode. You help users explore possibilities,",
      "ask generative questions, and think through the problem space. Be curious and open-ended.",
      "Do not validate or audit; focus on exploration and ideation."
    ]
    resources = @brainstorm.brainstorm_resources.order(created_at: :asc)
    if resources.any?
      parts << "\n\nReference material the user has linked:"
      resources.each do |r|
        parts << "\n- #{r.title.presence || r.url}: #{r.url}"
        parts << "  #{r.notes}" if r.notes.present?
      end
    end
    parts.join(" ")
  end

  def escape_sse(str)
    str.to_s.gsub("\n", "\\n").to_json
  end

  def message_json(msg)
    {
      id: msg["id"],
      role: msg["role"],
      user_id: msg["user_id"],
      content: msg["content"]
    }
  end

  def chat_session_json(session)
    {
      id: session.id,
      brainstorm_id: session.brainstorm_id,
      messages: (session.messages || []).map { |m| message_json(m) },
      pinned_message_id: @brainstorm.pinned_message_id,
      pinned_message_content: @brainstorm.pinned_message_content
    }
  end
end
