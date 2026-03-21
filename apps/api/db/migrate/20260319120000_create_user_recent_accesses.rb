# frozen_string_literal: true

class CreateUserRecentAccesses < ActiveRecord::Migration[8.0]
  def change
    create_table :user_recent_accesses do |t|
      t.references :user, null: false, foreign_key: true
      t.references :trackable, polymorphic: true, null: false
      t.datetime :accessed_at, null: false
    end

    add_index :user_recent_accesses,
              %i[user_id trackable_type trackable_id],
              unique: true,
              name: "index_user_recent_accesses_on_user_and_trackable"

    add_index :user_recent_accesses, %i[user_id accessed_at]
  end
end
