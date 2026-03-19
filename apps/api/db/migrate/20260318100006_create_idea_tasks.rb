# frozen_string_literal: true

class CreateIdeaTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :idea_tasks do |t|
      t.references :idea, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.boolean :completed, null: false, default: false
      t.date :due_date
      t.timestamps
    end

    add_index :idea_tasks, [:idea_id, :created_at]
  end
end
