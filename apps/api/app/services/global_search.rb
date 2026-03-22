# frozen_string_literal: true

# Permission-aware search across brainstorms and ideas for the current user.
#
# Matching: case-insensitive substring match on `title` and `description` via ILIKE
# (see migrations for pg_trgm + GIN indexes on both columns).
#
# Sort order: `updated_at` descending, then `id` descending (stable tie-break).
module GlobalSearch
  MAX_QUERY_LENGTH = 200
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 50
  DESCRIPTION_PREVIEW_MAX = 160

  # @return [Hash] `{ results: Array<Hash>, meta: Hash }`
  def self.call(user:, q:, page: 1, per_page: DEFAULT_PER_PAGE)
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
            AND (brainstorms.title ILIKE ? OR COALESCE(brainstorms.description, '') ILIKE ?)
            UNION ALL
            SELECT ideas.id FROM ideas
            WHERE (ideas.user_id = ? OR EXISTS (
              SELECT 1 FROM idea_members im
              WHERE im.idea_id = ideas.id AND im.user_id = ? AND im.accepted_at IS NOT NULL
            ))
            AND (ideas.title ILIKE ? OR COALESCE(ideas.description, '') ILIKE ?)
          ) AS sub
        SQL
        uid, uid, pattern, pattern, uid, uid, pattern, pattern
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
              brainstorms.description AS raw_description,
              users.username AS owner_username,
              brainstorms.updated_at AS updated_at
            FROM brainstorms
            INNER JOIN users ON users.id = brainstorms.user_id
            WHERE (brainstorms.user_id = ? OR EXISTS (
              SELECT 1 FROM brainstorm_members bm
              WHERE bm.brainstorm_id = brainstorms.id AND bm.user_id = ? AND bm.accepted_at IS NOT NULL
            ))
            AND (brainstorms.title ILIKE ? OR COALESCE(brainstorms.description, '') ILIKE ?)
            UNION ALL
            SELECT
              'idea'::text,
              ideas.id,
              ideas.title,
              ideas.slug,
              ideas.description AS raw_description,
              users.username,
              ideas.updated_at
            FROM ideas
            INNER JOIN users ON users.id = ideas.user_id
            WHERE (ideas.user_id = ? OR EXISTS (
              SELECT 1 FROM idea_members im
              WHERE im.idea_id = ideas.id AND im.user_id = ? AND im.accepted_at IS NOT NULL
            ))
            AND (ideas.title ILIKE ? OR COALESCE(ideas.description, '') ILIKE ?)
          ) AS combined
          ORDER BY combined.updated_at DESC, combined.id DESC
          LIMIT ? OFFSET ?
        SQL
        uid, uid, pattern, pattern, uid, uid, pattern, pattern, per, offset
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
      raw_desc = row["raw_description"]
      preview = GlobalSearch.format_description_preview(raw_desc)
      {
        type: row["type"],
        id: row["id"].to_i,
        title: row["title"],
        slug: row["slug"],
        owner_username: row["owner_username"],
        updated_at: updated,
        description_preview: preview
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

  # Single-line preview for search results; nil when no description.
  def self.format_description_preview(text)
    return nil if text.blank?

    single_line = text.to_s.gsub(/\s+/, " ").strip
    return nil if single_line.blank?

    single_line.truncate(DESCRIPTION_PREVIEW_MAX)
  end
end
