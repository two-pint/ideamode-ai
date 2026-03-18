# frozen_string_literal: true

class BrainstormResource < ApplicationRecord
  RESOURCE_TYPES = %w[url youtube].freeze

  belongs_to :brainstorm

  validates :url, presence: true
  validates :resource_type, inclusion: { in: RESOURCE_TYPES }

  before_validation :infer_resource_type

  private

  def infer_resource_type
    return if url.blank?
    if url.match?(%r{\Ahttps?://(www\.)?(youtube\.com|youtu\.be)/})
      self.resource_type = "youtube"
    else
      self.resource_type = "url" if resource_type.blank?
    end
  end
end
