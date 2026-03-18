# frozen_string_literal: true

class IdeaAnalysesController < ApplicationController
  include Authenticatable
  include IdeaFromRoute

  before_action :require_authentication!
  before_action :set_idea, only: %i[index create show update]
  before_action :set_analysis, only: %i[show update]
  before_action :require_editable!, only: %i[create update]

  def index
    analyses = @idea.idea_analyses.order(created_at: :desc)
    render json: { analyses: analyses.map { |a| analysis_json(a) } }
  end

  def create
    analysis_type = params[:analysis_type].to_s
    unless IdeaAnalysis::ANALYSIS_TYPES.include?(analysis_type)
      return render json: { errors: ["Invalid analysis_type"] }, status: :unprocessable_entity
    end

    analysis = @idea.idea_analyses.create!(analysis_type: analysis_type, status: "pending", result: {}, annotations: {})
    IdeaAnalysisJob.perform_later(analysis)
    render json: analysis_json(analysis), status: :created
  end

  def show
    render json: analysis_json(@analysis)
  end

  def update
    if params[:annotations].respond_to?(:to_unsafe_h)
      @analysis.update!(annotations: @analysis.annotations.deep_merge(params[:annotations].to_unsafe_h))
    elsif params[:annotations].is_a?(Hash)
      @analysis.update!(annotations: @analysis.annotations.deep_merge(params[:annotations]))
    end
    render json: analysis_json(@analysis)
  end

  private

  def set_analysis
    @analysis = @idea.idea_analyses.find(params[:id])
  end

  def analysis_json(a)
    {
      id: a.id,
      idea_id: a.idea_id,
      analysis_type: a.analysis_type,
      status: a.status,
      result: a.result,
      annotations: a.annotations,
      created_at: a.created_at,
      updated_at: a.updated_at
    }
  end
end
