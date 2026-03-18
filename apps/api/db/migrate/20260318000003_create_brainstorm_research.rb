# frozen_string_literal: true

class CreateBrainstormResearch < ActiveRecord::Migration[8.1]
  def change
    create_table :brainstorm_research do |t|
      t.references :brainstorm, null: false, foreign_key: true
      t.string :research_type, null: false
      t.string :query, null: false
      t.jsonb :result, default: {}, null: false

      t.timestamps
    end

    add_index :brainstorm_research, [:brainstorm_id, :created_at]
  end
end
