# frozen_string_literal: true

class RecentAccessController < ApplicationController
  include Authenticatable

  before_action :require_authentication!

  # GET /me/recent_access — most recently opened brainstorms & ideas (authorized resources only)
  def index
    rows = UserRecentAccess
      .where(user: current_user)
      .includes(trackable: :user)
      .order(accessed_at: :desc)
      .limit(30)

    items = rows.filter_map { |row| serialize_item(row) }
    render json: { items: items }
  end

  # POST /me/recent_access
  # Body: { "resource_type": "brainstorm"|"idea", "owner_username": "...", "slug": "..." }
  def create
    resource_type = params[:resource_type].to_s.downcase
    owner_username = params[:owner_username].to_s.strip
    slug = params[:slug].to_s.strip

    unless %w[brainstorm idea].include?(resource_type) && owner_username.present? && slug.present?
      return render json: { error: "resource_type, owner_username, and slug are required" }, status: :unprocessable_entity
    end

    owner = User.find_by(username: owner_username)
    return render json: { error: "Not found" }, status: :not_found unless owner

    trackable =
      case resource_type
      when "brainstorm"
        owner.brainstorms.find_by(slug: slug)
      when "idea"
        owner.ideas.find_by(slug: slug)
      end

    return render json: { error: "Not found" }, status: :not_found if trackable.nil?
    return render json: { error: "Forbidden" }, status: :forbidden unless trackable.accessible_by?(current_user)

    access = UserRecentAccess.find_or_initialize_by(user: current_user, trackable: trackable)
    access.accessed_at = Time.current
    access.save!

    head :no_content
  end

  private

  def serialize_item(row)
    trackable = row.trackable
    return nil if trackable.nil?

    owner = trackable.user
    return nil if owner&.username.blank?

    {
      resource_type: trackable.class.name.downcase,
      title: trackable.title,
      owner_username: owner.username,
      slug: trackable.slug,
      accessed_at: row.accessed_at.iso8601(3)
    }
  end
end
