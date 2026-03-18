# frozen_string_literal: true

require "test_helper"

class IdeaAnalysisJobTest < ActiveJob::TestCase
  setup do
    @user = create_user
    @idea = create_idea(user: @user)
    @analysis = IdeaAnalysis.create!(idea: @idea, analysis_type: "competitor", status: "pending")
  end

  test "perform updates status to running then completed when service succeeds" do
    result = { "competitor_analysis" => { "summary" => "ok" } }
    mock_service = Minitest::Mock.new
    mock_service.expect :run, result, [{ idea: @idea, analysis_type: "competitor" }]
    IdeaAnalysisService.stub :new, mock_service do
      IdeaAnalysisJob.perform_now(@analysis)
    end
    mock_service.verify

    @analysis.reload
    assert_equal "completed", @analysis.status
    assert_equal result, @analysis.result
  end

  test "perform updates status to failed when service returns error" do
    mock_service = Minitest::Mock.new
    mock_service.expect :run, { "error" => "API not configured" }, [{ idea: @idea, analysis_type: "competitor" }]
    IdeaAnalysisService.stub :new, mock_service do
      IdeaAnalysisJob.perform_now(@analysis)
    end
    mock_service.verify

    @analysis.reload
    assert_equal "failed", @analysis.status
    assert_equal "API not configured", @analysis.result["error"]
  end

  test "perform updates status to failed when service raises" do
    failing_service = Object.new
    def failing_service.run(*)
      raise StandardError, "boom"
    end
    IdeaAnalysisService.stub :new, failing_service do
      IdeaAnalysisJob.perform_now(@analysis)
    end

    @analysis.reload
    assert_equal "failed", @analysis.status
    assert_equal "boom", @analysis.result["error"]
  end
end
