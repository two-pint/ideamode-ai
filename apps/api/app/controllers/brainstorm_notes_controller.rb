# frozen_string_literal: true

class BrainstormNotesController < ApplicationController
  include Authenticatable
  include BrainstormFromRoute

  before_action :require_authentication!
  before_action :set_brainstorm
  before_action :require_editable!, only: [:update]

  def show
    note = @brainstorm.brainstorm_note
    payload = if note
      { note: note_json(note) }
    else
      { note: { content: {}, updated_at: nil } }
    end
    render json: payload
  end

  def update
    content = params[:content]
    content = {} if content.nil?

    note = @brainstorm.brainstorm_note || @brainstorm.build_brainstorm_note(user_id: current_user.id)
    note.user_id = current_user.id
    note.content = normalize_note_content(content)
    note.save!
    render json: { note: note_json(note) }
  end

  private

  def normalize_note_content(content)
    content = content.to_unsafe_h if content.respond_to?(:to_unsafe_h)
    return content if content.is_a?(Hash)
    if content.is_a?(String) && content.present?
      return {
        "type" => "doc",
        "content" => [
          { "type" => "paragraph", "content" => [{ "type" => "text", "text" => content }] }
        ]
      }
    end
    content.is_a?(String) ? { "type" => "doc", "content" => [] } : {}
  end

  def note_json(n)
    {
      id: n.id,
      brainstorm_id: n.brainstorm_id,
      content: n.content,
      updated_at: n.updated_at
    }
  end
end
