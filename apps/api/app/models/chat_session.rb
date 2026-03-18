# frozen_string_literal: true

class ChatSession < ApplicationRecord
  belongs_to :brainstorm, optional: true
  belongs_to :idea, optional: true

  validate :exactly_one_scope

  before_validation :ensure_messages_array

  def ensure_messages_array
    self.messages = [] if messages.nil?
  end

  def exactly_one_scope
    return if brainstorm_id.present? ^ idea_id.present?
    errors.add(:base, "Exactly one of brainstorm_id or idea_id must be set")
  end
end
