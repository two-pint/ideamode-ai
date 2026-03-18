# frozen_string_literal: true

class UsersController < ApplicationController
  include Authenticatable

  before_action :require_authentication!

  def show
    user = User.find_by(username: params[:username])

    unless user
      render json: { error: "Not found" }, status: :not_found
      return
    end

    render json: { user: user_json(user) }
  end

  def ideas
    user = User.find_by(username: params[:username])

    unless user
      render json: { error: "Not found" }, status: :not_found
      return
    end

    ideas = if user.id == current_user.id
      user.ideas.order(updated_at: :desc)
    else
      member_idea_ids = IdeaMember.where(user_id: current_user.id).accepted.pluck(:idea_id)
      user.ideas.where(id: member_idea_ids).order(updated_at: :desc)
    end

    render json: { ideas: ideas.map { |idea| idea_json(idea) } }
  end

  def brainstorms
    user = User.find_by(username: params[:username])

    unless user
      render json: { error: "Not found" }, status: :not_found
      return
    end

    brainstorms = if user.id == current_user.id
      user.brainstorms.order(updated_at: :desc)
    else
      member_brainstorm_ids = BrainstormMember.where(user_id: current_user.id).accepted.pluck(:brainstorm_id)
      user.brainstorms.where(id: member_brainstorm_ids).order(updated_at: :desc)
    end

    render json: { brainstorms: brainstorms.map { |b| brainstorm_json(b) } }
  end

  private

  def user_json(user)
    {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio
    }
  end

  def idea_json(idea)
    {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      slug: idea.slug,
      status: idea.status,
      visibility: idea.visibility,
      brainstorm_id: idea.brainstorm_id,
      owner: {
        id: idea.user.id,
        username: idea.user.username,
        name: idea.user.name,
        avatar_url: idea.user.avatar_url
      },
      updated_at: idea.updated_at
    }
  end

  def brainstorm_json(brainstorm)
    {
      id: brainstorm.id,
      title: brainstorm.title,
      description: brainstorm.description,
      slug: brainstorm.slug,
      status: brainstorm.status,
      visibility: brainstorm.visibility,
      owner: {
        id: brainstorm.user.id,
        username: brainstorm.user.username,
        name: brainstorm.user.name,
        avatar_url: brainstorm.user.avatar_url
      },
      updated_at: brainstorm.updated_at
    }
  end
end
