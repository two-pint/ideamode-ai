# frozen_string_literal: true

require "test_helper"

class BrainstormTest < ActiveSupport::TestCase
  setup do
    @user = create_user
  end

  test "valid brainstorm with required attributes" do
    bs = Brainstorm.new(user: @user, title: "My BS", slug: "my-bs")
    assert bs.valid?, bs.errors.full_messages.join(", ")
  end

  test "invalid without title" do
    bs = Brainstorm.new(user: @user, title: nil, slug: "s")
    assert_not bs.valid?
    assert_includes bs.errors[:title], "can't be blank"
  end

  test "slug normalized from title" do
    bs = Brainstorm.create!(user: @user, title: "Foo Bar", slug: nil)
    assert_match(/\A[a-z0-9-]+\z/, bs.slug)
  end

  test "status defaults to exploring" do
    bs = Brainstorm.create!(user: @user, title: "X", slug: "x")
    assert_equal "exploring", bs.status
  end

  test "accessible_by? returns true for owner" do
    bs = create_brainstorm(user: @user)
    assert bs.accessible_by?(@user)
  end
end
