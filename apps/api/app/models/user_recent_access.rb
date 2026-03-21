# frozen_string_literal: true

class UserRecentAccess < ApplicationRecord
  belongs_to :user
  belongs_to :trackable, polymorphic: true

  validates :accessed_at, presence: true
end
