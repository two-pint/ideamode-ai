# frozen_string_literal: true

class IdeaNotesController < ApplicationController
  include Authenticatable
  include IdeaFromRoute

  before_action :require_authentication!
  before_action :set_idea, only: %i[show update]
  before_action :require_editable!, only: %i[update]

  def show
    note = @idea.idea_note
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

    note = @idea.idea_note || @idea.build_idea_note(user_id: current_user.id)
    note.user_id = current_user.id
    note.content = normalize_note_content(content)
    note.save!
    render json: { note: note_json(note) }
  end

  private

  def normalize_note_content(content)
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
      idea_id: n.idea_id,
      content: n.content,
      updated_at: n.updated_at
    }
  end
end
