# frozen_string_literal: true

class IdeaAnalysis < ApplicationRecord
  ANALYSIS_TYPES = %w[competitor tam pmf full].freeze
  STATUSES = %w[pending running completed failed].freeze

  belongs_to :idea

  validates :analysis_type, inclusion: { in: ANALYSIS_TYPES }
  validates :status, inclusion: { in: STATUSES }
end
