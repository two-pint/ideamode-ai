# frozen_string_literal: true

require "test_helper"

class SearchControllerTest < ActionDispatch::IntegrationTest
  test "index unauthorized without token" do
    get "/me/search", params: { q: "test" }
    assert_response :unauthorized
  end

  test "index returns 422 when q is blank" do
    user = create_user
    token = JwtService.encode(user.id)
    get "/me/search", params: { q: "" }, headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"].join, "required"
  end

  test "index returns 422 when q is too long" do
    user = create_user
    token = JwtService.encode(user.id)
    get "/me/search",
        params: { q: "x" * (GlobalSearch::MAX_QUERY_LENGTH + 1) },
        headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unprocessable_entity
  end

  test "owner finds own brainstorm and idea by title substring" do
    user = create_user
    token = JwtService.encode(user.id)
    create_brainstorm(user: user, title: "UniqueAlphaBrainstormXYZ", slug: "unique-alpha-bs")
    create_idea(user: user, title: "UniqueBetaIdeaXYZ", slug: "unique-beta-idea")

    get "/me/search",
        params: { q: "UniqueAlpha" },
        headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
    types = response.parsed_body["results"].map { |r| r["type"] }
    assert_includes types, "brainstorm"
    assert_not_includes types, "idea"

    get "/me/search",
        params: { q: "UniqueBeta" },
        headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
    types = response.parsed_body["results"].map { |r| r["type"] }
    assert_includes types, "idea"
  end

  test "user cannot find another users private brainstorm" do
    owner = create_user(username: "ownersearch1")
    other = create_user
    token = JwtService.encode(other.id)
    create_brainstorm(user: owner, title: "SecretPrivateBrainstormZZZ", slug: "secret-private-bs")

    get "/me/search",
        params: { q: "SecretPrivate" },
        headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
    assert_equal [], response.parsed_body["results"]
  end

  test "accepted member finds shared brainstorm title" do
    owner = create_user(username: "ownersearch2")
    member = create_user
    token = JwtService.encode(member.id)
    brainstorm = create_brainstorm(
      user: owner,
      title: "SharedMemberBrainstormQQQ",
      slug: "shared-member-bs"
    )
    BrainstormMember.create!(
      brainstorm: brainstorm,
      user: member,
      invited_by: owner,
      accepted_at: Time.current,
      role: "collaborator"
    )

    get "/me/search",
        params: { q: "SharedMember" },
        headers: { "Authorization" => "Bearer #{token}" }
    assert_response :success
    results = response.parsed_body["results"]
    assert_equal 1, results.length
    assert_equal "brainstorm", results.first["type"]
    assert_equal "shared-member-bs", results.first["slug"]
    assert_equal "ownersearch2", results.first["owner_username"]
  end
end
