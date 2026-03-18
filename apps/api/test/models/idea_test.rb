# frozen_string_literal: true

require "test_helper"

class IdeaTest < ActiveSupport::TestCase
  setup do
    @user = create_user
  end

  test "valid idea with required attributes" do
    idea = Idea.new(user: @user, title: "My Idea", slug: "my-idea")
    assert idea.valid?, idea.errors.full_messages.join(", ")
  end

  test "invalid without title" do
    idea = Idea.new(user: @user, title: nil, slug: "slug")
    assert_not idea.valid?
    assert_includes idea.errors[:title], "can't be blank"
  end

  test "invalid with duplicate slug for same user" do
    create_idea(user: @user, slug: "same-slug")
    idea = Idea.new(user: @user, title: "Other", slug: "same-slug")
    assert_not idea.valid?
    assert idea.errors[:slug].any?
  end

  test "slug normalized from title" do
    idea = Idea.create!(user: @user, title: "Hello World Here", slug: nil)
    assert_match(/\A[a-z0-9-]+\z/, idea.slug)
    assert idea.slug.include?("hello")
  end

  test "status defaults to validating" do
    idea = Idea.create!(user: @user, title: "X", slug: "x")
    assert_equal "validating", idea.status
  end

  test "visibility defaults to private" do
    idea = Idea.create!(user: @user, title: "X", slug: "x")
    assert_equal "private", idea.visibility
  end

  test "brainstorm_id must belong to same owner" do
    other_user = create_user
    bs = create_brainstorm(user: other_user)
    idea = Idea.new(user: @user, title: "X", slug: "x", brainstorm_id: bs.id)
    assert_not idea.valid?
    assert idea.errors[:brainstorm_id].any?
  end

  test "accessible_by? returns true for owner" do
    idea = create_idea(user: @user)
    assert idea.accessible_by?(@user)
  end

  test "accessible_by? returns false for nil user" do
    idea = create_idea(user: @user)
    assert_not idea.accessible_by?(nil)
  end

  test "editable_by? returns true for owner" do
    idea = create_idea(user: @user)
    assert idea.editable_by?(@user)
  end
end
