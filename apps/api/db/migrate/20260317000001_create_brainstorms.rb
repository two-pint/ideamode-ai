# frozen_string_literal: true

class CreateBrainstorms < ActiveRecord::Migration[8.1]
  def change
    create_table :brainstorms do |t|
      t.references :user, null: false, foreign_key: true
      t.string :slug, null: false
      t.string :title, null: false
      t.text :description
      t.string :status, null: false, default: "exploring"
      t.string :visibility, null: false, default: "private"

      t.timestamps
    end

    add_index :brainstorms, [:user_id, :slug], unique: true
  end
end
