# frozen_string_literal: true

class BrainstormsController < ApplicationController
  include Authenticatable
  include ChatMessageJson

  before_action :require_authentication!
  before_action :set_brainstorm, only: %i[show update destroy create_idea]

  def index
    brainstorms = current_user.brainstorms.includes(:user).order(updated_at: :desc)
    render json: { brainstorms: brainstorms.map { |b| brainstorm_json(b) } }
  end

  def shared
    brainstorm_ids = current_user.brainstorm_members.accepted.pluck(:brainstorm_id).uniq
    brainstorms = Brainstorm.includes(:user).where(id: brainstorm_ids).order(updated_at: :desc)
    render json: { brainstorms: brainstorms.map { |b| brainstorm_json(b) } }
  end

  def create
    brainstorm = current_user.brainstorms.new(create_params)

    if brainstorm.save
      render json: { brainstorm: brainstorm_json(brainstorm) }, status: :created
    else
      render json: { errors: brainstorm.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: { brainstorm: brainstorm_json(@brainstorm) }
  end

  def update
    return head :forbidden unless @brainstorm.editable_by?(current_user)
    if @brainstorm.update(update_params)
      render json: { brainstorm: brainstorm_json(@brainstorm) }
    else
      render json: { errors: @brainstorm.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return head :forbidden unless @brainstorm.editable_by?(current_user)
    @brainstorm.destroy
    head :no_content
  end

  def create_idea
    return head :forbidden unless @brainstorm.user_id == current_user.id

    title = params[:title].to_s.strip
    description = params[:description].to_s.strip
    slug_param = params[:slug].to_s.strip
    member_ids = Array(params[:member_ids]).map(&:to_i).uniq

    if title.blank?
      return render json: { errors: ["Title is required"] }, status: :unprocessable_entity
    end

    idea = current_user.ideas.new(
      title: title,
      description: description.presence,
      slug: slug_param.presence || title.parameterize,
      brainstorm_id: @brainstorm.id
    )

    if idea.save
      member_ids.each do |user_id|
        next if user_id == current_user.id
        user = User.find_by(id: user_id)
        next unless user
        next if idea.idea_members.exists?(user_id: user.id)
        idea.idea_members.create!(user_id: user.id, invited_by: current_user, role: "collaborator", accepted_at: Time.current)
      end
      render json: { idea: idea_json(idea) }, status: :created
    else
      render json: { errors: idea.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_brainstorm
    owner = User.find_by(username: params[:username])
    @brainstorm = owner&.brainstorms&.find_by(slug: params[:slug])
    return head :not_found if @brainstorm.nil? || !@brainstorm.accessible_by?(current_user)
  end

  def create_params
    params.permit(:title, :description, :slug, :status, :visibility)
  end

  def update_params
    # Permit route/body keys to avoid unpermitted-parameter logs; accept nested :brainstorm or flat body.
    permitted = params.permit(:username, :slug, :title, :description, :status, :visibility, brainstorm: %i[title description slug status visibility])
    source = permitted[:brainstorm].presence || permitted
    source.permit(:title, :description, :slug, :status, :visibility)
  end

  def brainstorm_json(brainstorm)
    brainstorm.sync_legacy_pinned_message_to_chat_session!
    brainstorm.reload
    session = brainstorm.chat_session
    pinned_raw = session&.messages&.then { |arr| Array(arr).select { |m| ActiveModel::Type::Boolean.new.cast(m["pinned"]) } } || []
    pinned_messages = map_messages_json(pinned_raw).map do |h|
      h.merge(content: h[:content].to_s.truncate(500))
    end

    {
      id: brainstorm.id,
      title: brainstorm.title,
      description: brainstorm.description,
      slug: brainstorm.slug,
      status: brainstorm.status,
      visibility: brainstorm.visibility,
      pinned_message_id: brainstorm.pinned_message_id,
      pinned_message_content: brainstorm.pinned_message_content,
      pinned_messages:,
      can_edit: brainstorm.editable_by?(current_user),
      owner: {
        id: brainstorm.user.id,
        username: brainstorm.user.username,
        name: brainstorm.user.name,
        avatar_url: brainstorm.user.avatar_url
      },
      updated_at: brainstorm.updated_at
    }
  end

  def idea_json(idea)
    {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      slug: idea.slug,
      status: idea.status,
      visibility: idea.visibility,
      brainstorm_id: idea.brainstorm_id,
      brainstorm_slug: idea.brainstorm&.slug,
      owner: {
        id: idea.user.id,
        username: idea.user.username,
        name: idea.user.name,
        avatar_url: idea.user.avatar_url
      },
      updated_at: idea.updated_at
    }
  end
end
