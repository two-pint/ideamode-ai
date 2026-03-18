# frozen_string_literal: true

# Resolves :username/:slug to either a Brainstorm or an Idea.
# Used for show, update, destroy so the same URL pattern works for both resource types.
# Authorization: only owner can access (membership/collaborators in M1.4).
class ResourcesController < ApplicationController
  include Authenticatable

  before_action :require_authentication!
  before_action :set_resource, only: %i[show update destroy]

  def show
    render json: resource_response
  end

  def update
    return head :forbidden unless @resource.editable_by?(current_user)
    if @resource.update(update_params_for_resource)
      render json: resource_response
    else
      render json: { errors: @resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return head :forbidden unless @resource.editable_by?(current_user)
    @resource.destroy
    head :no_content
  end

  private

  def set_resource
    owner = User.find_by(username: params[:username])
    return head :not_found if owner.blank?

    # Slug is unique per user across brainstorms and ideas; check brainstorm first, then idea
    brainstorm = owner.brainstorms.find_by(slug: params[:slug])
    if brainstorm
      return head :not_found unless brainstorm.accessible_by?(current_user)
      @resource = brainstorm
      @resource_type = :brainstorm
      return
    end

    idea = owner.ideas.find_by(slug: params[:slug])
    if idea
      return head :not_found unless idea.accessible_by?(current_user)
      @resource = idea
      @resource_type = :idea
      return
    end

    head :not_found
  end

  def update_params_for_resource
    if @resource_type == :brainstorm
      params.permit(:title, :description, :slug, :status, :visibility)
    else
      params.permit(:title, :description, :slug, :status, :visibility, :brainstorm_id)
    end
  end

  def resource_response
    base = {
      resource_type: @resource_type.to_s,
      id: @resource.id,
      title: @resource.title,
      description: @resource.description,
      slug: @resource.slug,
      status: @resource.status,
      visibility: @resource.visibility,
      owner: {
        id: @resource.user.id,
        username: @resource.user.username,
        name: @resource.user.name,
        avatar_url: @resource.user.avatar_url
      },
      updated_at: @resource.updated_at
    }

    if @resource_type == :idea
      base[:brainstorm_id] = @resource.brainstorm_id
      base[:brainstorm_slug] = @resource.brainstorm&.slug
    end

    base
  end
end
