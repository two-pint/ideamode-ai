# frozen_string_literal: true

class Brainstorm < ApplicationRecord
  include ResourceAccess

  STATUSES = %w[exploring researching ready archived].freeze
  VISIBILITIES = %w[private shared].freeze

  belongs_to :user
  has_many :ideas, dependent: :nullify
  has_many :brainstorm_members, dependent: :destroy
  has_many :brainstorm_invites, dependent: :destroy
  has_many :members, through: :brainstorm_members, source: :user
  has_one :chat_session, dependent: :destroy
  has_many :brainstorm_research, dependent: :destroy
  has_one :brainstorm_note, dependent: :destroy
  has_many :brainstorm_resources, dependent: :destroy
  has_many :user_recent_accesses, as: :trackable, dependent: :delete_all

  attr_readonly :user_id

  validates :title, presence: true, length: { maximum: 120 }
  validates :slug, presence: true, uniqueness: { scope: :user_id },
    length: { maximum: 80 },
    format: {
      with: /\A[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\z/,
      message: "must be URL-safe (lowercase, numbers, hyphens)"
    }
  validates :status, inclusion: { in: STATUSES }
  validates :visibility, inclusion: { in: VISIBILITIES }

  before_validation :normalize_slug
  before_validation :apply_defaults

  private

  def apply_defaults
    self.status ||= "exploring"
    self.visibility ||= "private"
  end

  def normalize_slug
    source = slug.presence || title.to_s
    self.slug = source
      .downcase
      .strip
      .gsub(/[^a-z0-9]+/, "-")
      .gsub(/\A-+|-+\z/, "")
      .slice(0, 80)
  end
end
