# frozen_string_literal: true

require "test_helper"

class InvitesControllerTest < ActionDispatch::IntegrationTest
  test "decline removes pending brainstorm invite for matching email" do
    owner = create_user
    invitee = create_user(email: "invitee-decline@example.com")
    brainstorm = create_brainstorm(user: owner)
    invite = BrainstormInvite.create!(
      brainstorm: brainstorm,
      invited_by: owner,
      email: invitee.email,
      token: "decline-token-brainstorm-#{SecureRandom.hex(4)}",
      role: "collaborator",
      expires_at: 2.days.from_now
    )
    token = JwtService.encode(invitee.id)

    assert_difference -> { BrainstormInvite.count }, -1 do
      post "/invites/#{invite.token}/decline", headers: { "Authorization" => "Bearer #{token}" }
    end
    assert_response :no_content
  end

  test "decline returns forbidden when email does not match" do
    owner = create_user
    other = create_user
    brainstorm = create_brainstorm(user: owner)
    invite = BrainstormInvite.create!(
      brainstorm: brainstorm,
      invited_by: owner,
      email: "someone-else@example.com",
      token: "decline-token-mismatch-#{SecureRandom.hex(4)}",
      role: "collaborator",
      expires_at: 2.days.from_now
    )
    token = JwtService.encode(other.id)

    assert_no_difference -> { BrainstormInvite.count } do
      post "/invites/#{invite.token}/decline", headers: { "Authorization" => "Bearer #{token}" }
    end
    assert_response :forbidden
  end
end
