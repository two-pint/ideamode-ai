# frozen_string_literal: true

class IdeaTask < ApplicationRecord
  belongs_to :idea
  belongs_to :user
  validates :title, presence: true, length: { maximum: 500 }
end
