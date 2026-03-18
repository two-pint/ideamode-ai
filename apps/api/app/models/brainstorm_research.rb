# frozen_string_literal: true

class BrainstormResearch < ApplicationRecord
  RESEARCH_TYPES = %w[market_lookup competitor_spot trend_signal].freeze

  self.table_name = "brainstorm_research"

  belongs_to :brainstorm

  validates :research_type, inclusion: { in: RESEARCH_TYPES }
  validates :query, presence: true
end
