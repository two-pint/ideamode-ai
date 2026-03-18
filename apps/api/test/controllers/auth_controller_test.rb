# frozen_string_literal: true

require "test_helper"

class AuthControllerTest < ActionDispatch::IntegrationTest
  test "POST auth/register creates user and returns token" do
    post auth_register_url, params: {
      email: "newuser@example.com",
      username: "newuser",
      password: "password123"
    }, as: :json
    assert_response :created
    json = response.parsed_body
    assert json["token"].present?
    assert_equal "newuser", json["user"]["username"]
    assert_equal "newuser@example.com", json["user"]["email"]
  end

  test "POST auth/login returns token for valid credentials" do
    user = create_user(email: "login@example.com", username: "loginuser")
    post auth_login_url, params: { login: "login@example.com", password: "password123" }, as: :json
    assert_response :success
    json = response.parsed_body
    assert json["token"].present?
    assert_equal "loginuser", json["user"]["username"]
  end

  test "POST auth/login returns 401 for invalid password" do
    user = create_user(email: "x@example.com", username: "xuser")
    post auth_login_url, params: { login: "x@example.com", password: "wrong" }, as: :json
    assert_response :unauthorized
    assert_equal "Invalid credentials", response.parsed_body["error"]
  end

  test "GET auth/me returns current user with valid token" do
    user = create_user
    token = JwtService.encode(user.id)
    get auth_me_url, headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
    assert_equal user.username, response.parsed_body["user"]["username"]
  end

  test "GET auth/me returns 401 without token" do
    get auth_me_url
    assert_response :unauthorized
  end
end
