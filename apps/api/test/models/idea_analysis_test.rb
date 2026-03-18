# frozen_string_literal: true

require "test_helper"

class IdeaAnalysisTest < ActiveSupport::TestCase
  setup do
    @user = create_user
    @idea = create_idea(user: @user)
  end

  test "valid with analysis_type and idea" do
    a = IdeaAnalysis.new(idea: @idea, analysis_type: "competitor")
    assert a.valid?, a.errors.full_messages.join(", ")
  end

  test "invalid analysis_type" do
    a = IdeaAnalysis.new(idea: @idea, analysis_type: "invalid")
    assert_not a.valid?
    assert_includes a.errors[:analysis_type], "is not included in the list"
  end

  test "accepts all ANALYSIS_TYPES" do
    IdeaAnalysis::ANALYSIS_TYPES.each do |type|
      a = IdeaAnalysis.create!(idea: @idea, analysis_type: type)
      assert_equal type, a.analysis_type
    end
  end

  test "status defaults to pending" do
    a = IdeaAnalysis.create!(idea: @idea, analysis_type: "tam")
    assert_equal "pending", a.status
  end
end
