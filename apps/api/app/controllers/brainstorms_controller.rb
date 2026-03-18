# frozen_string_literal: true

class BrainstormsController < ApplicationController
  include Authenticatable

  before_action :require_authentication!
  before_action :set_brainstorm, only: %i[show update destroy]

  def index
    brainstorms = current_user.brainstorms.order(updated_at: :desc)
    render json: { brainstorms: brainstorms.map { |b| brainstorm_json(b) } }
  end

  def shared
    brainstorm_ids = current_user.brainstorm_members.accepted.pluck(:brainstorm_id).uniq
    brainstorms = Brainstorm.where(id: brainstorm_ids).order(updated_at: :desc)
    render json: { brainstorms: brainstorms.map { |b| brainstorm_json(b) } }
  end

  def create
    brainstorm = current_user.brainstorms.new(create_params)

    if brainstorm.save
      render json: { brainstorm: brainstorm_json(brainstorm) }, status: :created
    else
      render json: { errors: brainstorm.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: { brainstorm: brainstorm_json(@brainstorm) }
  end

  def update
    return head :forbidden unless @brainstorm.editable_by?(current_user)
    if @brainstorm.update(update_params)
      render json: { brainstorm: brainstorm_json(@brainstorm) }
    else
      render json: { errors: @brainstorm.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return head :forbidden unless @brainstorm.editable_by?(current_user)
    @brainstorm.destroy
    head :no_content
  end

  private

  def set_brainstorm
    owner = User.find_by(username: params[:username])
    @brainstorm = owner&.brainstorms&.find_by(slug: params[:slug])
    return head :not_found if @brainstorm.nil? || !@brainstorm.accessible_by?(current_user)
  end

  def create_params
    params.permit(:title, :description, :slug, :status, :visibility)
  end

  def update_params
    # Permit route/body keys to avoid unpermitted-parameter logs; accept nested :brainstorm or flat body.
    permitted = params.permit(:username, :slug, :title, :description, :status, :visibility, brainstorm: %i[title description slug status visibility])
    source = permitted[:brainstorm].presence || permitted
    source.permit(:title, :description, :slug, :status, :visibility)
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
