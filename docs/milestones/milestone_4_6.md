# Milestone 4.6 — Global Search

**Goal:** Users can **search across all brainstorms and ideas they can access** from a single entry point (keyboard-first command palette and/or header search), with fast, permission-aware results and navigation to the right detail page. Search ships **before** [Milestone 5 — Organizations](./milestone_5.md) so the product has one consistent discovery pattern for personal workspaces; org-scoped URLs can extend the same search contract later.

**Timeline:** TBD (after M4.5)  
**Depends on:** Milestone 4.5 (UI Standardization & Polish)

---

## Context

Today brainstorms and ideas are listed separately on the dashboard; finding a resource by title (or other fields) requires scanning lists or remembering URLs. Global search indexes **titles** at minimum (and optionally description snippets, member-visible metadata) for resources where [`ResourceAccess#accessible_by?`](../../apps/api/app/models/concerns/resource_access.rb) is true for the current user.

**Out of scope for this milestone:** Full-text search inside chat transcripts, notes, PRD body, or research blobs (can be a follow-up). Semantic / vector search is out of scope unless explicitly added later.

---

## Tickets

### Ticket 4.6.1 — Search API (backend)

**Description:** Add an authenticated search endpoint that returns brainstorms and ideas matching a query string, **only for resources the current user may view**, with stable ordering and pagination. Use PostgreSQL-appropriate matching (`ILIKE`, `pg_trgm` + GIN index, or `tsvector` if you introduce a generated column) and document the choice. This matters because the web UI must not leak titles from resources the user cannot open.

**Tasks:**

- [ ] Add `GET /search` (or `GET /me/search`) with query param `q` (min length, max length), optional `limit` / cursor / page.
- [ ] Implement search across **brainstorms** and **ideas** the user owns or is an **accepted member** of (same rules as dashboard listing + share access). Return typed results: `{ type: "brainstorm" | "idea", id, title, slug, owner_username, ... }` sufficient for the client to build links to `/:username/brainstorms/:slug` and `/:username/ideas/:slug`.
- [ ] Add DB indexes to keep search fast as data grows (e.g. trigram on `title`, or btree + `lower(title)` patterns per chosen strategy).
- [ ] Tests: user A cannot see user B’s private resources; shared/member resources appear for allowed users; empty `q` returns 400 or empty list per product choice.

**Acceptance criteria:**

- Authenticated search returns only accessible brainstorms and ideas; no 403 resources appear in results.
- Results include enough fields for the web app to navigate without a second round-trip (or document a follow-up fetch).
- Automated tests cover permission boundaries and basic query behavior.

**Test plan (manual):**

1. As owner, search for a unique substring of a brainstorm title; confirm it appears. Repeat for an idea.
2. As a user with no access to another user’s private brainstorm, search for its title; confirm it does not appear.
3. As collaborator on a shared brainstorm, search; confirm it appears.

---

### Ticket 4.6.2 — Global search UI (web)

**Description:** Add a **global search** entry in [`apps/web`](../../apps/web): command palette (**⌘K** / **Ctrl+K**) and/or a compact search field in the app chrome, using **shadcn/ui** patterns and **Client Components** per [AGENTS.md](../../AGENTS.md). Results should be grouped (Brainstorms / Ideas) with clear navigation on selection.

**Tasks:**

- [ ] Implement command dialog (e.g. shadcn `Command` + `Dialog`) or equivalent; register keyboard shortcut; focus trap and Escape to close.
- [ ] Debounced requests to the search API; loading and empty states; handle API errors with toast or inline message per existing patterns.
- [ ] Selecting a result navigates to the correct personal URL; highlight matching text in titles if cheap to add.
- [ ] Respect light/dark theme and semantic tokens from M4.5.

**Acceptance criteria:**

- User can open search via shortcut from main app layouts, type a query, and open a result in one or two steps.
- No layout break on mobile (either palette works on small viewports or a fallback search field is provided).

**Test plan (manual):**

1. Open search, type partial title, select a brainstorm; confirm navigation and correct page.
2. Repeat for an idea. Confirm browser back returns to prior page.
3. On a narrow viewport, confirm search remains usable or documented fallback works.

---

### Ticket 4.6.3 — Polish & limits

**Description:** Cap query length, rate-limit or debounce aggressively enough to protect the API, and document **sort order** (e.g. relevance score, then updated_at). Add empty-query behavior and “no results” copy that does not imply a bug.

**Tasks:**

- [ ] Document and enforce max `q` length; return clear validation errors when appropriate.
- [ ] Define stable default ordering and optional `sort` param if needed later.
- [ ] Optional: recent searches (localStorage) for repeat queries — only if low effort.

**Acceptance criteria:**

- Long or abusive queries do not stress the DB; UX stays responsive under normal typing.
- “No results” state is clear and actionable (e.g. adjust query, go to dashboard).

**Test plan (manual):**

1. Paste a very long string; confirm graceful handling.
2. Search for gibberish; confirm empty state messaging.

---

## Milestone 4.6 completion checklist

- [ ] All three tickets (4.6.1–4.6.3) are implemented and accepted.
- [ ] Search is permission-safe end-to-end; UI is discoverable (shortcut and/or header).
- [ ] Organizations ([Milestone 5](./milestone_5.md)) can later extend the same API to include org-scoped resources without redesigning personal search.
