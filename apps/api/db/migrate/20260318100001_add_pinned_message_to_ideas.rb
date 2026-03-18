# frozen_string_literal: true

class AddPinnedMessageToIdeas < ActiveRecord::Migration[8.1]
  def change
    add_column :ideas, :pinned_message_id, :string
    add_column :ideas, :pinned_message_content, :text
  end
end
