# frozen_string_literal: true

class AddBrainstormIdToIdeasAndUpdateStatus < ActiveRecord::Migration[8.1]
  def change
    add_reference :ideas, :brainstorm, null: true, foreign_key: true

    # Change default and allowed values: remove "brainstorm", use "validating" as default
    change_column_default :ideas, :status, from: "brainstorm", to: "validating"
    reversible do |dir|
      dir.up do
        execute <<-SQL.squish
          UPDATE ideas SET status = 'validating' WHERE status = 'brainstorm';
        SQL
      end
    end
  end
end
