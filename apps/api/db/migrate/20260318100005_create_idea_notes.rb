# frozen_string_literal: true

class CreateIdeaNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :idea_notes do |t|
      t.references :idea, null: false, foreign_key: true, index: { unique: true }
      t.references :user, null: true, foreign_key: true
      t.jsonb :content, null: false, default: {}
      t.timestamps
    end
  end
end
