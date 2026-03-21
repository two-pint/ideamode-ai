# frozen_string_literal: true

class Idea < ApplicationRecord
  include ResourceAccess

  STATUSES = %w[validating validated shelved].freeze
  VISIBILITIES = %w[private shared].freeze

  belongs_to :user
  belongs_to :brainstorm, optional: true
  has_many :idea_members, dependent: :destroy
  has_many :idea_invites, dependent: :destroy
  has_many :members, through: :idea_members, source: :user
  has_many :chat_sessions, dependent: :destroy
  has_many :idea_analyses, dependent: :destroy
  has_one :idea_note, dependent: :destroy
  has_many :idea_tasks, dependent: :destroy
  has_many :idea_wireframes, dependent: :destroy
  has_many :idea_prds, dependent: :destroy
  has_many :user_recent_accesses, as: :trackable, dependent: :delete_all

  # Ownership is immutable after creation (no transfer in v1).
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
  validate :brainstorm_belongs_to_same_owner

  before_validation :normalize_slug
  before_validation :apply_defaults

  private

  def apply_defaults
    self.status ||= "validating"
    self.visibility ||= "private"
  end

  def brainstorm_belongs_to_same_owner
    return if brainstorm_id.blank?
    return if brainstorm.nil?
    return if brainstorm.user_id == user_id

    errors.add(:brainstorm_id, "must belong to the same owner as the idea")
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
