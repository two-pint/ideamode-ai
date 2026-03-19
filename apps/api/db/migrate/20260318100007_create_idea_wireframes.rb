# frozen_string_literal: true

class CreateIdeaWireframes < ActiveRecord::Migration[8.1]
  def change
    create_table :idea_wireframes do |t|
      t.references :idea, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.jsonb :canvas_data, null: false, default: {}
      t.timestamps
    end

    add_index :idea_wireframes, [:idea_id, :created_at]
  end
end
