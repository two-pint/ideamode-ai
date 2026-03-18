# frozen_string_literal: true

module BrainstormFromRoute
  extend ActiveSupport::Concern

  private

  def set_brainstorm
    owner = User.find_by(username: params[:username])
    @brainstorm = owner&.brainstorms&.find_by(slug: params[:slug])
    return head :not_found if @brainstorm.nil? || !@brainstorm.accessible_by?(current_user)
  end

  def require_editable!
    return head :forbidden unless @brainstorm.editable_by?(current_user)
  end
end
