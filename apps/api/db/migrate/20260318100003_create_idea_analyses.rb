# frozen_string_literal: true

class CreateIdeaAnalyses < ActiveRecord::Migration[8.1]
  def change
    create_table :idea_analyses do |t|
      t.references :idea, null: false, foreign_key: true
      t.string :analysis_type, null: false
      t.string :status, default: "pending", null: false
      t.jsonb :result, default: {}, null: false
      t.jsonb :annotations, default: {}, null: false
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end

    add_index :idea_analyses, [:idea_id, :created_at], order: { created_at: :desc }
  end
end
