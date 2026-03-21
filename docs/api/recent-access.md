# Recent access (activity feed)

Server-backed **recent opens** for brainstorms and ideas. Used by the web dashboard activity feed.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/me/recent_access` | Bearer |
| `POST` | `/me/recent_access` | Bearer |

### `GET /me/recent_access`

Returns up to **30** items, newest first.

```json
{
  "items": [
    {
      "resource_type": "brainstorm",
      "title": "Q4 planning",
      "owner_username": "alice",
      "slug": "q4-planning",
      "accessed_at": "2026-03-19T12:00:00.000Z"
    }
  ]
}
```

`resource_type` is `"brainstorm"` or `"idea"`.

### `POST /me/recent_access`

Upserts a visit timestamp. Caller must have **access** to the resource (same rules as `GET` detail).

Body (JSON):

```json
{
  "resource_type": "brainstorm",
  "owner_username": "alice",
  "slug": "q4-planning"
}
```

- **204** — recorded  
- **404** — owner or resource not found  
- **403** — resource exists but user cannot access  
- **422** — missing/invalid `resource_type`, `owner_username`, or `slug`

## Database

Table: `user_recent_accesses` (polymorphic `trackable` → `Brainstorm` or `Idea`), one row per user per resource, `accessed_at` updated on each POST.

Run migrations from `apps/api`:

```bash
bin/rails db:migrate
```
