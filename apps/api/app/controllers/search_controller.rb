# frozen_string_literal: true

# GET /me/search — authenticated global search across brainstorms and ideas (see GlobalSearch).
class SearchController < ApplicationController
  include Authenticatable

  before_action :require_authentication!

  def index
    data = GlobalSearch.call(
      user: current_user,
      q: params[:q],
      page: params[:page],
      per_page: params[:limit]
    )
    render json: data
  rescue ArgumentError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end
end
