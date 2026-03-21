# frozen_string_literal: true

# Resolves display names for persisted chat messages (brainstorm chat + idea discussion).
module ChatMessageJson
  extend ActiveSupport::Concern

  private

  def chat_messages_users_by_id(messages)
    ids = Array(messages).filter_map do |m|
      uid = m["user_id"]
      uid.present? ? uid.to_i : nil
    end.select(&:positive?).uniq
    return {} if ids.empty?

    User.where(id: ids).index_by(&:id)
  end

  def message_json(msg, users_by_id)
    uid_raw = msg["user_id"]
    uid_i = uid_raw.present? ? uid_raw.to_i : nil
    user = uid_i&.positive? ? users_by_id[uid_i] : nil

    author_name = case msg["role"]
                  when "assistant"
                    "Ideabot"
                  when "user"
                    user ? (user.name.presence || user.username) : "User"
                  end

    {
      id: msg["id"],
      role: msg["role"],
      user_id: msg["user_id"],
      content: msg["content"],
      author_name:,
      pinned: ActiveModel::Type::Boolean.new.cast(msg["pinned"])
    }
  end

  def map_messages_json(messages)
    list = Array(messages)
    users_by_id = chat_messages_users_by_id(list)
    list.map { |m| message_json(m, users_by_id) }
  end
end
