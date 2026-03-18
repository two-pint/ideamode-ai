# frozen_string_literal: true

class CreateIdeaMembersAndInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :idea_members do |t|
      t.references :idea, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :role, null: false, default: "collaborator"
      t.timestamp :accepted_at

      t.timestamps
    end

    add_index :idea_members, [:idea_id, :user_id], unique: true

    create_table :idea_invites do |t|
      t.references :idea, null: false, foreign_key: true
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :email, null: false
      t.string :token, null: false
      t.string :role, null: false, default: "collaborator"
      t.timestamp :expires_at, null: false
      t.timestamp :accepted_at

      t.timestamps
    end

    add_index :idea_invites, :token, unique: true
  end
end
