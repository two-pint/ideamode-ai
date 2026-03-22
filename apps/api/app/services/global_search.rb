# frozen_string_literal: true

# Permission-aware search across brainstorms and ideas for the current user.
#
# Matching: case-insensitive substring match on `title` via ILIKE (see migration for
# pg_trgm + GIN indexes).
#
# Sort order: `updated_at` descending, then `id` descending (stable tie-break).
module GlobalSearch
  MAX_QUERY_LENGTH = 200
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 50

  module_function

  # @return [Hash] `{ results: Array<Hash>, meta: Hash }`
  def call(user:, q:, page: 1, per_page: DEFAULT_PER_PAGE)
    query = q.to_s.strip
    raise ArgumentError, "Query (q) is required" if query.blank?
    raise ArgumentError, "Query is too long (max #{MAX_QUERY_LENGTH} characters)" if query.length > MAX_QUERY_LENGTH

    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
    page_n = [page.to_i, 1].max
    per = [[per_page.to_i, 1].max, MAX_PER_PAGE].min
    offset = (page_n - 1) * per
    uid = user.id

    count_sql = ActiveRecord::Base.sanitize_sql_array(
      [
        <<~SQL.squish,
          SELECT COUNT(*) AS c FROM (
            SELECT brainstorms.id FROM brainstorms
            WHERE (brainstorms.user_id = ? OR EXISTS (
              SELECT 1 FROM brainstorm_members bm
              WHERE bm.brainstorm_id = brainstorms.id AND bm.user_id = ? AND bm.accepted_at IS NOT NULL
            ))
            AND brainstorms.title ILIKE ?
            UNION ALL
            SELECT ideas.id FROM ideas
            WHERE (ideas.user_id = ? OR EXISTS (
              SELECT 1 FROM idea_members im
              WHERE im.idea_id = ideas.id AND im.user_id = ? AND im.accepted_at IS NOT NULL
            ))
            AND ideas.title ILIKE ?
          ) AS sub
        SQL
        uid, uid, pattern, uid, uid, pattern
      ]
    )
    total = ActiveRecord::Base.connection.select_value(count_sql).to_i

    data_sql = ActiveRecord::Base.sanitize_sql_array(
      [
        <<~SQL.squish,
          SELECT * FROM (
            SELECT
              'brainstorm'::text AS type,
              brainstorms.id AS id,
              brainstorms.title AS title,
              brainstorms.slug AS slug,
              users.username AS owner_username,
              brainstorms.updated_at AS updated_at
            FROM brainstorms
            INNER JOIN users ON users.id = brainstorms.user_id
            WHERE (brainstorms.user_id = ? OR EXISTS (
              SELECT 1 FROM brainstorm_members bm
              WHERE bm.brainstorm_id = brainstorms.id AND bm.user_id = ? AND bm.accepted_at IS NOT NULL
            ))
            AND brainstorms.title ILIKE ?
            UNION ALL
            SELECT
              'idea'::text,
              ideas.id,
              ideas.title,
              ideas.slug,
              users.username,
              ideas.updated_at
            FROM ideas
            INNER JOIN users ON users.id = ideas.user_id
            WHERE (ideas.user_id = ? OR EXISTS (
              SELECT 1 FROM idea_members im
              WHERE im.idea_id = ideas.id AND im.user_id = ? AND im.accepted_at IS NOT NULL
            ))
            AND ideas.title ILIKE ?
          ) AS combined
          ORDER BY combined.updated_at DESC, combined.id DESC
          LIMIT ? OFFSET ?
        SQL
        uid, uid, pattern, uid, uid, pattern, per, offset
      ]
    )

    rows = ActiveRecord::Base.connection.select_all(data_sql).to_a

    results = rows.map do |row|
      ts = row["updated_at"]
      updated =
        if ts.respond_to?(:iso8601)
          ts.iso8601(3)
        else
          ts.to_s
        end
      {
        type: row["type"],
        id: row["id"].to_i,
        title: row["title"],
        slug: row["slug"],
        owner_username: row["owner_username"],
        updated_at: updated
      }
    end

    total_pages = (total.to_f / per).ceil

    {
      results: results,
      meta: {
        page: page_n,
        per_page: per,
        total: total,
        total_pages: total_pages,
        sort: "updated_at_desc"
      }
    }
  end
end
