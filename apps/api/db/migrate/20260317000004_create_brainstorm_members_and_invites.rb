# frozen_string_literal: true

class CreateBrainstormMembersAndInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :brainstorm_members do |t|
      t.references :brainstorm, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :role, null: false, default: "collaborator"
      t.timestamp :accepted_at

      t.timestamps
    end

    add_index :brainstorm_members, [:brainstorm_id, :user_id], unique: true

    create_table :brainstorm_invites do |t|
      t.references :brainstorm, null: false, foreign_key: true
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :email, null: false
      t.string :token, null: false
      t.string :role, null: false, default: "collaborator"
      t.timestamp :expires_at, null: false
      t.timestamp :accepted_at

      t.timestamps
    end

    add_index :brainstorm_invites, :token, unique: true
  end
end
