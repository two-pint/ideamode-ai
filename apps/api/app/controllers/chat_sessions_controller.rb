# frozen_string_literal: true

class ChatSessionsController < ApplicationController
  include Authenticatable
  include BrainstormFromRoute
  include ActionController::Live
  include ChatMessageJson

  before_action :require_authentication!
  before_action :set_brainstorm, only: %i[show create_message pin unpin]

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
      return render json: { message: map_messages_json([user_message]).first, session: chat_session_json(session) }
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

    @brainstorm.sync_legacy_pinned_message_to_chat_session!

    msgs = session.messages || []
    idx = msgs.index { |m| m["id"].to_s == message_id }
    return render json: { errors: ["Message not found"] }, status: :unprocessable_entity if idx.nil?

    msg = msgs[idx].stringify_keys
    currently_pinned = ActiveModel::Type::Boolean.new.cast(msg["pinned"])
    updated_msg = if currently_pinned
                    msg.except("pinned")
                  else
                    msg.merge("pinned" => true)
                  end

    new_msgs = msgs.each_with_index.map { |m, i| i == idx ? updated_msg : m }
    session.update!(messages: new_msgs)
    @brainstorm.update_columns(pinned_message_id: nil, pinned_message_content: nil) if @brainstorm.pinned_message_id.present?

    render json: { session: chat_session_json(session.reload) }
  end

  def unpin
    return head :forbidden unless @brainstorm.editable_by?(current_user)

    session = @brainstorm.chat_session
    if session && session.messages.present?
      new_msgs = session.messages.map { |m| m.stringify_keys.except("pinned") }
      session.update!(messages: new_msgs)
    end
    @brainstorm.update!(pinned_message_id: nil, pinned_message_content: nil)

    sess = @brainstorm.chat_session
    render json: { session: chat_session_json(sess ? sess.reload : find_or_create_session) }
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
      "You are Ideabot, a business consultant in IdeaMode with deep expertise in idea generation and validation.",
      "Help the user explore possibilities, frame problems clearly, and pressure-test assumptions constructively.",
      "Suggest ways to validate hypotheses (customers, market signals, risks, next experiments) without being dismissive.",
      "Balance creativity with practical rigor: be curious, specific, and action-oriented."
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

  def chat_session_json(session)
    @brainstorm.sync_legacy_pinned_message_to_chat_session!
    session.reload if session.persisted?

    {
      id: session.id,
      brainstorm_id: session.brainstorm_id,
      messages: map_messages_json(session.messages || []),
      pinned_message_id: nil,
      pinned_message_content: nil
    }
  end
end
