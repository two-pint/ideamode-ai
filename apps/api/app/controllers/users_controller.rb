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
      user.ideas.where(visibility: "shared").order(updated_at: :desc)
    end

    render json: { ideas: ideas.map { |idea| idea_json(idea) } }
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
      updated_at: idea.updated_at
    }
  end
end
