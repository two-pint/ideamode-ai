# frozen_string_literal: true

class BrainstormResearchController < ApplicationController
  include Authenticatable
  include BrainstormFromRoute

  before_action :require_authentication!
  before_action :set_brainstorm
  before_action :require_editable!, only: [:create]

  def index
    list = @brainstorm.brainstorm_research.order(created_at: :desc)
    render json: { research: list.map { |r| research_json(r) } }
  end

  def show
    record = @brainstorm.brainstorm_research.find(params[:id])
    render json: { research: research_json(record) }
  end

  def create
    research_type = params[:research_type].to_s
    query = params[:query].to_s.strip

    unless BrainstormResearch::RESEARCH_TYPES.include?(research_type)
      return render json: { errors: ["Invalid research_type"] }, status: :unprocessable_entity
    end
    if query.blank?
      return render json: { errors: ["Query is required"] }, status: :unprocessable_entity
    end

    result = BrainstormResearchService.new.run(research_type: research_type, query: query)
    record = @brainstorm.brainstorm_research.create!(
      research_type: research_type,
      query: query,
      result: result
    )
    render json: { research: research_json(record) }, status: :created
  end

  private

  def research_json(r)
    {
      id: r.id,
      brainstorm_id: r.brainstorm_id,
      research_type: r.research_type,
      query: r.query,
      result: r.result,
      created_at: r.created_at
    }
  end
end
