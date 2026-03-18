# frozen_string_literal: true

class AllowMultipleDiscussionSessionsPerIdea < ActiveRecord::Migration[8.1]
  def up
    remove_index :chat_sessions, :idea_id, if_exists: true
    add_column :chat_sessions, :archived_at, :datetime
    add_index :chat_sessions, [:idea_id, :archived_at], where: "idea_id IS NOT NULL"
    add_index :chat_sessions, :idea_id, unique: true, where: "idea_id IS NOT NULL AND archived_at IS NULL", name: "index_chat_sessions_on_idea_id_active"
  end

  def down
    remove_index :chat_sessions, name: "index_chat_sessions_on_idea_id_active", if_exists: true
    remove_index :chat_sessions, [:idea_id, :archived_at], if_exists: true
    remove_column :chat_sessions, :archived_at
    add_index :chat_sessions, :idea_id, unique: true, where: "idea_id IS NOT NULL"
  end
end
