# frozen_string_literal: true

# Global search (Milestone 4.6) uses ILIKE '%q%' on title. The pg_trgm extension plus
# GIN indexes on title (gin_trgm_ops) lets PostgreSQL use the index for substring matches.
class AddSearchTitleTrgmIndexes < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    enable_extension "pg_trgm" unless extension_enabled?("pg_trgm")

    add_index :brainstorms, :title,
      algorithm: :concurrently,
      using: :gin,
      opclass: :gin_trgm_ops,
      name: "index_brainstorms_on_title_trgm"

    add_index :ideas, :title,
      algorithm: :concurrently,
      using: :gin,
      opclass: :gin_trgm_ops,
      name: "index_ideas_on_title_trgm"
  end

  def down
    remove_index :brainstorms, name: "index_brainstorms_on_title_trgm"
    remove_index :ideas, name: "index_ideas_on_title_trgm"
  end
end
