# frozen_string_literal: true

class CreateBrainstormResources < ActiveRecord::Migration[8.1]
  def change
    create_table :brainstorm_resources do |t|
      t.references :brainstorm, null: false, foreign_key: true
      t.string :url, null: false
      t.string :title
      t.string :resource_type, default: "url", null: false
      t.text :notes

      t.timestamps
    end
  end
end
