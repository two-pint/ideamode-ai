# frozen_string_literal: true

class CreateChatSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :chat_sessions do |t|
      t.references :brainstorm, null: true, foreign_key: true, index: false
      t.references :idea, null: true, foreign_key: true, index: false
      t.jsonb :messages, default: [], null: false

      t.timestamps
    end

    add_check_constraint :chat_sessions,
      "((brainstorm_id IS NOT NULL AND idea_id IS NULL) OR (brainstorm_id IS NULL AND idea_id IS NOT NULL))",
      name: "chat_sessions_exactly_one_scope"

    add_index :chat_sessions, :brainstorm_id, unique: true, where: "brainstorm_id IS NOT NULL"
    add_index :chat_sessions, :idea_id, unique: true, where: "idea_id IS NOT NULL"
  end
end
