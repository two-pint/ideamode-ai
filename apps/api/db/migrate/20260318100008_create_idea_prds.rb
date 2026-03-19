# frozen_string_literal: true

class CreateIdeaPrds < ActiveRecord::Migration[8.1]
  def change
    create_table :idea_prds do |t|
      t.references :idea, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :content, null: false, default: ""
      t.integer :version, null: false, default: 1
      t.datetime :generated_at
      t.timestamps
    end

    add_index :idea_prds, [:idea_id, :version], unique: true
  end
end
