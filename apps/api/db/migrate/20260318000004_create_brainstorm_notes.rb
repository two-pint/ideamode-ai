# frozen_string_literal: true

class CreateBrainstormNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :brainstorm_notes do |t|
      t.references :brainstorm, null: false, foreign_key: true, index: { unique: true }
      t.references :user, null: true, foreign_key: true

      t.jsonb :content, default: {}, null: false

      t.timestamps
    end
  end
end
