# frozen_string_literal: true

# Loads Solid Queue schema into the current database.
# In development/test the queue connection points to the same DB as primary,
# so this creates the solid_queue_* tables there. Production uses a separate
# queue database and should load db/queue_schema.rb into that DB via its own process.
class CreateSolidQueueTablesInPrimary < ActiveRecord::Migration[8.1]
  def up
    return unless Rails.env.development? || Rails.env.test?

    load Rails.root.join("db/queue_schema.rb")
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Solid Queue tables are not removed by rollback."
  end
end
