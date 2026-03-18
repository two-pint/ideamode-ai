# frozen_string_literal: true

require "test_helper"

class HealthControllerTest < ActionDispatch::IntegrationTest
  test "GET /health returns ok" do
    get health_url
    assert_response :success
    json = response.parsed_body
    assert_equal "ok", json["status"]
  end
end
