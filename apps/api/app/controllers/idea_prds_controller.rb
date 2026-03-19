# frozen_string_literal: true

class IdeaPrdsController < ApplicationController
  include Authenticatable
  include IdeaFromRoute
  include ActionController::Live

  before_action :require_authentication!
  before_action :set_idea, only: %i[index create show update export]
  before_action :require_editable!, only: %i[create update]
  before_action :set_prd, only: %i[show update export]

  def index
    prds = @idea.idea_prds.order(version: :desc)
    render json: { prds: prds.map { |p| prd_json(p) } }
  end

  def create
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    full_content = +""
    begin
      IdeaPrdService.new.stream_prd(idea: @idea) do |chunk|
        full_content << chunk
        response.stream.write("data: #{escape_sse(chunk)}\n\n")
      end
    rescue StandardError => e
      Rails.logger.error("[IdeaPrdsController] stream error: #{e.message}")
    ensure
      response.stream.close
    end

    return unless full_content.present?

    next_version = (@idea.idea_prds.maximum(:version) || 0) + 1
    begin
      @idea.idea_prds.create!(
        user_id: current_user.id,
        content: full_content,
        version: next_version,
        generated_at: Time.current
      )
    rescue StandardError => e
      Rails.logger.error("[IdeaPrdsController] failed to persist PRD after stream: #{e.message}")
    end
  end

  def show
    render json: { prd: prd_json(@prd) }
  end

  def update
    @prd.update!(content: params[:content].to_s)
    render json: { prd: prd_json(@prd) }
  end

  def export
    format = params[:format].to_s.downcase
    case format
    when "md"
      send_data @prd.content,
        filename: "prd-v#{@prd.version}.md",
        type: "text/markdown",
        disposition: "attachment"
    when "pdf"
      render json: { error: "PDF export not configured. Use format=md for Markdown download." }, status: :not_implemented
    else
      render json: { error: "Unsupported format. Use format=md or format=pdf" }, status: :bad_request
    end
  end

  private

  def set_prd
    @prd = @idea.idea_prds.find_by!(version: params[:id])
  end

  def escape_sse(str)
    str.to_s.gsub("\n", "\\n").to_json
  end

  def prd_json(p)
    {
      id: p.id,
      idea_id: p.idea_id,
      version: p.version,
      content: p.content,
      generated_at: p.generated_at,
      created_at: p.created_at,
      updated_at: p.updated_at
    }
  end
end
