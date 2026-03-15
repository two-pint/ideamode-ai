# frozen_string_literal: true

module Authenticatable
  extend ActiveSupport::Concern

  private

  def current_user
    @current_user ||= authenticate_from_token
  end

  def require_authentication!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end

  def authenticate_from_token
    token = extract_token
    return nil unless token

    payload = JwtService.decode(token)
    return nil unless payload

    User.find_by(id: payload["sub"])
  end

  def extract_token
    header = request.headers["Authorization"]
    header&.match(/\ABearer (.+)\z/)&.captures&.first
  end
end
