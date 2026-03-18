# frozen_string_literal: true

class AddPinnedMessageToBrainstorms < ActiveRecord::Migration[8.1]
  def change
    add_column :brainstorms, :pinned_message_id, :string
    add_column :brainstorms, :pinned_message_content, :text
  end
end
