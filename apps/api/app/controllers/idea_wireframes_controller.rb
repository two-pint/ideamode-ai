# frozen_string_literal: true

class IdeaWireframesController < ApplicationController
  include Authenticatable
  include IdeaFromRoute

  before_action :require_authentication!
  before_action :set_idea, only: %i[index create show update]
  before_action :set_wireframe, only: %i[show update]
  before_action :require_editable!, only: %i[create update]

  def index
    wireframes = @idea.idea_wireframes.order(created_at: :asc)
    render json: { wireframes: wireframes.map { |w| wireframe_json(w) } }
  end

  def show
    render json: { wireframe: wireframe_json(@wireframe) }
  end

  def create
    raw = params[:canvas_data]
    canvas_data = if raw.present?
      raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw.to_h
    else
      {}
    end
    wireframe = @idea.idea_wireframes.create!(
      user_id: current_user.id,
      title: params[:title].to_s.strip.presence || "Untitled wireframe",
      canvas_data: canvas_data
    )
    render json: { wireframe: wireframe_json(wireframe) }, status: :created
  end

  def update
    @wireframe.update!(wireframe_update_params)
    render json: { wireframe: wireframe_json(@wireframe) }
  end

  private

  def set_wireframe
    @wireframe = @idea.idea_wireframes.find(params[:id])
  end

  def wireframe_update_params
    p = {}
    p[:title] = params[:title] if params.key?(:title)
    if params.key?(:canvas_data)
      raw = params[:canvas_data]
      p[:canvas_data] = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw.to_h
    end
    p
  end

  def wireframe_json(w)
    {
      id: w.id,
      idea_id: w.idea_id,
      title: w.title,
      canvas_data: w.canvas_data,
      created_at: w.created_at,
      updated_at: w.updated_at
    }
  end
end
