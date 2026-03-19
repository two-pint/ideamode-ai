# frozen_string_literal: true

class IdeaPrd < ApplicationRecord
  belongs_to :idea
  belongs_to :user
  validates :version, presence: true, numericality: { only_integer: true, greater_than: 0 }
end
