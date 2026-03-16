# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password validations: false
  has_many :ideas, dependent: :destroy

  validates :email, presence: true, uniqueness: true,
    format: { with: URI::MailTo::EMAIL_REGEXP }

  validates :username, uniqueness: true, allow_nil: true,
    length: { minimum: 3, maximum: 30 },
    format: {
      with: /\A[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?\z/,
      message: "must be URL-safe (letters, numbers, hyphens, underscores) and start/end with a letter or number"
    }

  validates :password, presence: true, length: { minimum: 8 },
    if: :password_required?

  private

  def password_required?
    google_uid.blank? && (new_record? || password_digest_changed?)
  end
end
