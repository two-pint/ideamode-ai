# frozen_string_literal: true

module IdeaFromRoute
  extend ActiveSupport::Concern

  private

  def set_idea
    owner = User.find_by(username: params[:username])
    @idea = owner&.ideas&.find_by(slug: params[:slug])
    return head :not_found if @idea.nil? || !@idea.accessible_by?(current_user)
  end

  def require_editable!
    return head :forbidden unless @idea.editable_by?(current_user)
  end
end
