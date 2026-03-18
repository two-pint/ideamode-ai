# frozen_string_literal: true

class IdeaMember < ApplicationRecord
  ROLES = %w[collaborator viewer].freeze

  belongs_to :idea
  belongs_to :user
  belongs_to :invited_by, class_name: "User"

  validates :role, inclusion: { in: ROLES }

  scope :accepted, -> { where.not(accepted_at: nil) }
end
