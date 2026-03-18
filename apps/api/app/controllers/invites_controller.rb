# frozen_string_literal: true

# Accept an invite by token. Token can be for an IdeaInvite or BrainstormInvite.
class InvitesController < ApplicationController
  include Authenticatable

  before_action :require_authentication!

  def show
    invite = find_invite_by_token(params[:token])
    return head :not_found if invite.blank?
    return head :gone if invite.accepted_at.present?
    return head :gone if invite.expires_at < Time.current

    payload = invite_payload(invite)
    render json: payload
  end

  def accept
    invite = find_invite_by_token(params[:token])
    return head :not_found if invite.blank?
    return head :gone if invite.accepted_at.present?
    return head :gone if invite.expires_at < Time.current
    return render json: { error: "Invite was sent to a different email" }, status: :forbidden unless invite.email.downcase == current_user.email.downcase

    if invite.is_a?(BrainstormInvite)
      member = invite.brainstorm.brainstorm_members.build(
        user: current_user,
        invited_by: invite.invited_by,
        role: invite.role
      )
      member.accepted_at = Time.current
      if member.save
        invite.update!(accepted_at: Time.current)
        render json: { resource_type: "brainstorm", resource: brainstorm_summary(invite.brainstorm) }, status: :ok
      else
        render json: { errors: member.errors.full_messages }, status: :unprocessable_entity
      end
    else
      member = invite.idea.idea_members.build(
        user: current_user,
        invited_by: invite.invited_by,
        role: invite.role
      )
      member.accepted_at = Time.current
      if member.save
        invite.update!(accepted_at: Time.current)
        render json: { resource_type: "idea", resource: idea_summary(invite.idea) }, status: :ok
      else
        render json: { errors: member.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  private

  def find_invite_by_token(token)
    return nil if token.blank?
    BrainstormInvite.find_by(token: token) || IdeaInvite.find_by(token: token)
  end

  def invite_payload(invite)
    if invite.is_a?(BrainstormInvite)
      {
        type: "brainstorm",
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        resource: brainstorm_summary(invite.brainstorm),
        invited_by: user_summary(invite.invited_by)
      }
    else
      {
        type: "idea",
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        resource: idea_summary(invite.idea),
        invited_by: user_summary(invite.invited_by)
      }
    end
  end

  def brainstorm_summary(brainstorm)
    {
      id: brainstorm.id,
      title: brainstorm.title,
      slug: brainstorm.slug,
      owner_username: brainstorm.user.username
    }
  end

  def idea_summary(idea)
    {
      id: idea.id,
      title: idea.title,
      slug: idea.slug,
      owner_username: idea.user.username
    }
  end

  def user_summary(user)
    {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url
    }
  end
end
