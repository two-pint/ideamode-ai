# frozen_string_literal: true

class BrainstormInvite < ApplicationRecord
  ROLES = %w[collaborator viewer].freeze

  belongs_to :brainstorm
  belongs_to :invited_by, class_name: "User"

  validates :email, presence: true
  validates :token, presence: true, uniqueness: true
  validates :role, inclusion: { in: ROLES }

  scope :pending, -> { where(accepted_at: nil).where("expires_at > ?", Time.current) }
end
