# frozen_string_literal: true

class Idea < ApplicationRecord
  STATUSES = %w[brainstorm validating validated shelved].freeze
  VISIBILITIES = %w[private shared].freeze

  belongs_to :user

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

  before_validation :normalize_slug
  before_validation :apply_defaults

  private

  def apply_defaults
    self.status ||= "brainstorm"
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
