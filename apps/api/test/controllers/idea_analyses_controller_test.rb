# frozen_string_literal: true

require "test_helper"

class IdeaAnalysesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create_user
    @idea = create_idea(user: @user)
    @analysis = IdeaAnalysis.create!(idea: @idea, analysis_type: "competitor", status: "completed", annotations: {})
    @token = JwtService.encode(@user.id)
    @auth_headers = { "Authorization" => "Bearer #{@token}", "Content-Type" => "application/json" }
  end

  test "PATCH update merges annotations when sent as JSON" do
    patch "/#{@user.username}/ideas/#{@idea.slug}/analyses/#{@analysis.id}",
      params: { annotations: { key1: "value1", key2: "value2" } },
      headers: @auth_headers,
      as: :json
    assert_response :success
    @analysis.reload
    assert_equal "value1", @analysis.annotations["key1"]
    assert_equal "value2", @analysis.annotations["key2"]
  end

  test "PATCH update merges nested annotations" do
    patch "/#{@user.username}/ideas/#{@idea.slug}/analyses/#{@analysis.id}",
      params: { annotations: { section: { note: "done" } } },
      headers: @auth_headers,
      as: :json
    assert_response :success
    @analysis.reload
    assert_equal "done", @analysis.annotations["section"]["note"]
  end
end
