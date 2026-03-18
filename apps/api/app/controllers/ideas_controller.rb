# frozen_string_literal: true

class IdeasController < ApplicationController
  include Authenticatable

  before_action :require_authentication!
  before_action :set_idea_by_route, only: %i[show update destroy]

  def index
    ideas = current_user.ideas.includes(:user).order(updated_at: :desc)
    render json: { ideas: ideas.map { |idea| idea_json(idea) } }
  end

  def shared
    idea_ids = current_user.idea_members.accepted.pluck(:idea_id).uniq
    ideas = Idea.includes(:user).where(id: idea_ids).order(updated_at: :desc)
    render json: { ideas: ideas.map { |idea| idea_json(idea) } }
  end

  def create
    idea = current_user.ideas.new(create_params)

    if idea.save
      render json: { idea: idea_json(idea) }, status: :created
    else
      render json: { errors: idea.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: { idea: idea_json(@idea) }
  end

  def update
    return head :forbidden unless @idea.editable_by?(current_user)
    if @idea.update(update_params)
      render json: { idea: idea_json(@idea) }
    else
      render json: { errors: @idea.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return head :forbidden unless @idea.editable_by?(current_user)
    @idea.destroy
    head :no_content
  end

  private

  def set_idea_by_route
    owner = User.find_by(username: params[:username])
    idea = owner&.ideas&.find_by(slug: params[:slug])

    if idea.nil? || !idea.accessible_by?(current_user)
      render json: { error: "Not found" }, status: :not_found
      return
    end

    @idea = idea
  end

  def create_params
    params.permit(:title, :description, :slug, :status, :visibility, :brainstorm_id)
  end

  def update_params
    permitted = params.permit(:username, :slug, :title, :description, :slug, :status, :visibility, :brainstorm_id, idea: %i[title description slug status visibility brainstorm_id])
    source = permitted[:idea].presence || permitted
    source.permit(:title, :description, :slug, :status, :visibility, :brainstorm_id)
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
      brainstorm_slug: idea.brainstorm&.slug,
      owner: {
        id: idea.user.id,
        username: idea.user.username,
        name: idea.user.name,
        avatar_url: idea.user.avatar_url
      },
      updated_at: idea.updated_at
    }
  end
end
