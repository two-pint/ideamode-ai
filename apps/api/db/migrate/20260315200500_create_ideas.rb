# frozen_string_literal: true

class CreateIdeas < ActiveRecord::Migration[8.1]
  def change
    create_table :ideas do |t|
      t.references :user, null: false, foreign_key: true
      t.string :slug, null: false
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "brainstorm"
      t.string :visibility, null: false, default: "private"

      t.timestamps
    end

    add_index :ideas, [:user_id, :slug], unique: true
  end
end
