# frozen_string_literal: true

# Global search (Milestone 4.6) matches ILIKE on `description` as well as `title`.
# GIN trigram indexes keep substring queries fast on growing tables.
class AddSearchDescriptionTrgmIndexes < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    enable_extension "pg_trgm" unless extension_enabled?("pg_trgm")

    add_index :brainstorms, :description,
      algorithm: :concurrently,
      using: :gin,
      opclass: :gin_trgm_ops,
      name: "index_brainstorms_on_description_trgm"

    add_index :ideas, :description,
      algorithm: :concurrently,
      using: :gin,
      opclass: :gin_trgm_ops,
      name: "index_ideas_on_description_trgm"
  end

  def down
    remove_index :brainstorms, name: "index_brainstorms_on_description_trgm"
    remove_index :ideas, name: "index_ideas_on_description_trgm"
  end
end
