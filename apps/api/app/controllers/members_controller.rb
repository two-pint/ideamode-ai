# frozen_string_literal: true

# Nested under :username/:slug. Resolves resource (Brainstorm or Idea) and manages members/invites.
# Only users who can edit the resource can manage members.
class MembersController < ApplicationController
  include Authenticatable

  before_action :require_authentication!
  before_action :set_resource
  before_action :authorize_editable!, only: %i[index create update destroy]

  def index
    members = member_association.accepted.includes(:user).order(created_at: :asc)
    invites = invite_association.pending
    render json: {
      members: members.map { |m| member_json(m) },
      invites: invites.map { |i| invite_json(i) }
    }
  end

  def create
    if params[:user_id].present?
      add_existing_user
    elsif params[:email].present?
      invite_by_email
    else
      render json: { errors: ["Provide user_id or email"] }, status: :unprocessable_entity
    end
  end

  def update
    member = member_association.find(params[:id])
    if member.update(role: params[:role])
      render json: { member: member_json(member) }
    else
      render json: { errors: member.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    member = member_association.find_by(id: params[:id])
    if member
      member.destroy
      head :no_content
      return
    end
    inv = invite_association.find_by(id: params[:id])
    if inv
      inv.destroy
      head :no_content
      return
    end
    head :not_found
  end

  private

  def set_resource
    owner = User.find_by(username: params[:username])
    return head :not_found if owner.blank?

    case params[:resource_type].to_s
    when "brainstorm"
      @resource = owner.brainstorms.find_by(slug: params[:slug])
      return head :not_found if @resource.blank? || !@resource.accessible_by?(current_user)
      @resource_type = :brainstorm
    when "idea"
      @resource = owner.ideas.find_by(slug: params[:slug])
      return head :not_found if @resource.blank? || !@resource.accessible_by?(current_user)
      @resource_type = :idea
    else
      head :not_found
    end
  end

  def authorize_editable!
    return head :forbidden unless @resource.editable_by?(current_user)
  end

  def member_association
    @resource_type == :brainstorm ? @resource.brainstorm_members : @resource.idea_members
  end

  def invite_association
    @resource_type == :brainstorm ? @resource.brainstorm_invites : @resource.idea_invites
  end

  def add_existing_user
    user = User.find_by(id: params[:user_id])
    return render json: { errors: ["User not found"] }, status: :unprocessable_entity if user.blank?
    return render json: { errors: ["Cannot add owner"] }, status: :unprocessable_entity if user.id == @resource.user_id

    member = member_association.build(user: user, invited_by: current_user, role: params[:role].presence || "collaborator")
    member.accepted_at = Time.current
    if member.save
      render json: { member: member_json(member) }, status: :created
    else
      render json: { errors: member.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def invite_by_email
    email = params[:email].to_s.strip.downcase
    return render json: { errors: ["Email required"] }, status: :unprocessable_entity if email.blank?

    user = User.find_by(email: email)
    if user
      return render json: { errors: ["Cannot add owner"] }, status: :unprocessable_entity if user.id == @resource.user_id
      existing = member_association.find_by(user_id: user.id)
      if existing
        render json: { errors: ["Already a member"] }, status: :unprocessable_entity
        return
      end
      member = member_association.build(user: user, invited_by: current_user, role: params[:role].presence || "collaborator")
      member.accepted_at = Time.current
      if member.save
        render json: { member: member_json(member) }, status: :created
        return
      end
      render json: { errors: member.errors.full_messages }, status: :unprocessable_entity
      return
    end

    existing_invite = invite_association.find_by(email: email)
    if existing_invite&.accepted_at.blank? && existing_invite.expires_at > Time.current
      render json: { errors: ["Invite already sent for this email"] }, status: :unprocessable_entity
      return
    end
    existing_invite&.destroy

    role = params[:role].presence || "collaborator"
    role = "collaborator" unless %w[collaborator viewer].include?(role)
    inv = invite_association.create!(
      email: email,
      token: SecureRandom.urlsafe_base64(32),
      invited_by: current_user,
      role: role,
      expires_at: 7.days.from_now
    )
    render json: { invite: invite_json(inv) }, status: :created
  end

  def member_json(member)
    {
      id: member.id,
      user_id: member.user.id,
      username: member.user.username,
      name: member.user.name,
      avatar_url: member.user.avatar_url,
      role: member.role,
      accepted_at: member.accepted_at,
      created_at: member.created_at
    }
  end

  def invite_json(inv)
    {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expires_at: inv.expires_at,
      created_at: inv.created_at
    }
  end
end
