# frozen_string_literal: true

class IdeaWireframe < ApplicationRecord
  belongs_to :idea
  belongs_to :user
  validates :title, presence: true, length: { maximum: 120 }
end
