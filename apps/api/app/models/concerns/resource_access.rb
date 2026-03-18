# frozen_string_literal: true

module ResourceAccess
  # True if user can view this resource (owner or accepted member)
  def accessible_by?(user)
    return false if user.blank?
    return true if user_id == user.id

    if is_a?(Idea)
      idea_members.accepted.exists?(user_id: user.id)
    elsif is_a?(Brainstorm)
      brainstorm_members.accepted.exists?(user_id: user.id)
    else
      false
    end
  end

  # True if user can update/delete (owner or accepted collaborator, not viewer)
  def editable_by?(user)
    return false if user.blank?
    return true if user_id == user.id

    if is_a?(Idea)
      idea_members.accepted.where(role: "collaborator").exists?(user_id: user.id)
    elsif is_a?(Brainstorm)
      brainstorm_members.accepted.where(role: "collaborator").exists?(user_id: user.id)
    else
      false
    end
  end
end
