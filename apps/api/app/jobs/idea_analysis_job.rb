# frozen_string_literal: true

class IdeaAnalysisJob < ApplicationJob
  queue_as :default

  def perform(idea_analysis)
    idea_analysis.update!(status: "running")
    result = IdeaAnalysisService.new.run(idea: idea_analysis.idea, analysis_type: idea_analysis.analysis_type)
    if result["error"]
      idea_analysis.update!(status: "failed", result: result)
    else
      idea_analysis.update!(status: "completed", result: result)
    end
  rescue StandardError => e
    Rails.logger.error("[IdeaAnalysisJob] #{e.message}")
    # Optional hardening: result is non-nil in schema (default: {}, null: false); guard if schema were relaxed.
    idea_analysis.update!(status: "failed", result: (idea_analysis.result || {}).merge("error" => e.message))
  end
end
