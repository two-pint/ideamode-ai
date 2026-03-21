# frozen_string_literal: true

require "test_helper"

class RecentAccessControllerTest < ActionDispatch::IntegrationTest
  test "index unauthorized without token" do
    get "/me/recent_access"
    assert_response :unauthorized
  end

  test "index returns empty items for new user" do
    user = create_user
    token = JwtService.encode(user.id)
    get "/me/recent_access", headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal [], body["items"]
  end

  test "create returns not_found for missing resource" do
    user = create_user
    token = JwtService.encode(user.id)
    post "/me/recent_access",
         params: { resource_type: "brainstorm", owner_username: "nobody", slug: "missing" },
         headers: { "Authorization" => "Bearer #{token}" },
         as: :json
    assert_response :not_found
  end
end
