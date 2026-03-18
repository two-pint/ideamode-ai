# frozen_string_literal: true

class IdeasController < ApplicationController
  include Authenticatable

  before_action :require_authentication!
  before_action :set_idea_by_route, only: %i[show update destroy]

  def index
    ideas = current_user.ideas.order(updated_at: :desc)
    render json: { ideas: ideas.map { |idea| idea_json(idea) } }
  end

  def shared
    # Membership lands in Ticket 1.4; return empty until then.
    render json: { ideas: [] }
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
    if @idea.update(update_params)
      render json: { idea: idea_json(@idea) }
    else
      render json: { errors: @idea.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @idea.destroy
    head :no_content
  end

  private

  def set_idea_by_route
    owner = User.find_by(username: params[:username])
    idea = owner&.ideas&.find_by(slug: params[:slug])

    if idea.nil? || idea.user_id != current_user.id
      render json: { error: "Not found" }, status: :not_found
      return
    end

    @idea = idea
  end

  def create_params
    params.permit(:title, :description, :slug, :status, :visibility)
  end

  def update_params
    params.permit(:title, :description, :slug, :status, :visibility)
  end

  def idea_json(idea)
    {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      slug: idea.slug,
      status: idea.status,
      visibility: idea.visibility,
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
