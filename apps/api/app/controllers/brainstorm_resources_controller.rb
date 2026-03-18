# frozen_string_literal: true

class BrainstormResourcesController < ApplicationController
  include Authenticatable
  include BrainstormFromRoute

  before_action :require_authentication!
  before_action :set_brainstorm
  before_action :set_resource, only: %i[update destroy]

  def index
    resources = @brainstorm.brainstorm_resources.order(created_at: :asc)
    render json: { resources: resources.map { |r| resource_json(r) } }
  end

  def create
    return require_editable! unless @brainstorm.editable_by?(current_user)

    resource = @brainstorm.brainstorm_resources.new(resource_params)
    if resource.save
      render json: { resource: resource_json(resource) }, status: :created
    else
      render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    return require_editable! unless @brainstorm.editable_by?(current_user)

    if @resource.update(resource_params)
      render json: { resource: resource_json(@resource) }
    else
      render json: { errors: @resource.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return require_editable! unless @brainstorm.editable_by?(current_user)

    @resource.destroy
    head :no_content
  end

  private

  def set_resource
    @resource = @brainstorm.brainstorm_resources.find(params[:id])
  end

  def resource_params
    params.permit(:url, :title, :resource_type, :notes)
  end

  def resource_json(r)
    {
      id: r.id,
      url: r.url,
      title: r.title,
      resource_type: r.resource_type,
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at
    }
  end
end
