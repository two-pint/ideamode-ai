# frozen_string_literal: true

require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid user with email and password" do
    user = User.new(
      email: "test@example.com",
      password: "password123",
      username: "testuser"
    )
    assert user.valid?, user.errors.full_messages.join(", ")
  end

  test "invalid without email" do
    user = User.new(email: nil, password: "password123", username: "u1")
    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end

  test "invalid with duplicate email" do
    create_user(email: "same@example.com", username: "u1")
    user = User.new(email: "same@example.com", password: "password123", username: "u2")
    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "invalid username too short" do
    user = User.new(email: "a@b.com", password: "password123", username: "ab")
    assert_not user.valid?
    assert user.errors[:username].any? { |m| m.include?("3") }
  end

  test "invalid username format" do
    user = User.new(email: "a@b.com", password: "password123", username: "bad slug")
    assert_not user.valid?
    assert user.errors[:username].any?
  end

  test "valid username can be nil for google users" do
    user = User.new(email: "g@example.com", google_uid: "uid123", username: nil)
    user.stub(:password_required?, false) do
      assert user.valid?, user.errors.full_messages.join(", ")
    end
  end
end
