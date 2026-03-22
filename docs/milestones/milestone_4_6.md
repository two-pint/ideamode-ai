# Milestone 4.6 — Global Search

**Goal:** Users can **search across all brainstorms and ideas they can access** from a single entry point (keyboard-first command palette and/or header search), with fast, permission-aware results and navigation to the right detail page. Search ships **before** [Milestone 5 — Organizations](./milestone_5.md) so the product has one consistent discovery pattern for personal workspaces; org-scoped URLs can extend the same search contract later.

**Persona A ([solo founder / indie builder](../personas.md#persona-a--solo-founder--indie-builder))** depends on **fast capture + resume**; this milestone must close the gaps called out in product review: **find** work by title *or* short resource **description**, **resume** repeat lookups (recent queries), and **discover** search without relying on a hidden shortcut alone.

**Timeline:** TBD (after M4.5)  
**Depends on:** Milestone 4.5 (UI Standardization & Polish)

---

## Context

Today brainstorms and ideas are listed separately on the dashboard; finding a resource by title (or other fields) requires scanning lists or remembering URLs. Global search indexes **titles** and the **short `description` field** on brainstorms and ideas (same permission rules as titles) for resources where [`ResourceAccess#accessible_by?`](../../apps/api/app/models/concerns/resource_access.rb) is true for the current user. Results should include enough metadata (e.g. truncated description preview) to disambiguate similar titles.

**Out of scope for this milestone:** Full-text search inside **long-form** content — chat transcripts, rich notes bodies, PRD documents, research blobs, wireframe data — and semantic / vector search (can be follow-ups). Matching the **resource-level description column** is **in scope**; searching inside attached documents is not.

---

## Tickets

### Ticket 4.6.1 — Search API (backend)

**Description:** Add an authenticated search endpoint that returns brainstorms and ideas matching a query string, **only for resources the current user may view**, with stable ordering and pagination. Use PostgreSQL-appropriate matching (`ILIKE`, `pg_trgm` + GIN index, or `tsvector` if you introduce a generated column) and document the choice. This matters because the web UI must not leak titles from resources the user cannot open.

**Tasks:**

- [x] Add `GET /search` (or `GET /me/search`) with query param `q` (min length, max length), optional `limit` / cursor / page.
- [x] Implement search across **brainstorms** and **ideas** the user owns or is an **accepted member** of (same rules as dashboard listing + share access). Match `q` against **`title` and `description`** (nullable text on each model) so Persona A can find work by a remembered phrase, not only the title. Return typed results: `{ type: "brainstorm" | "idea", id, title, slug, owner_username, description_preview?, ... }` sufficient for the client to build links to `/:username/brainstorms/:slug` and `/:username/ideas/:slug` and to disambiguate rows.
- [x] Add DB indexes to keep search fast as data grows (e.g. trigram on `title` and on `description`, or documented btree / `lower()` patterns per chosen strategy).
- [x] Tests: user A cannot see user B’s private resources; shared/member resources appear for allowed users; empty `q` returns 400 or empty list per product choice; **query matches description-only** (no title match) returns the resource when the user has access.

**Acceptance criteria:**

- Authenticated search returns only accessible brainstorms and ideas; no 403 resources appear in results.
- Results include enough fields for the web app to navigate without a second round-trip (or document a follow-up fetch), including **description preview** when useful for Persona A disambiguation.
- **Title and resource `description`** are both included in matching; description-only matches behave correctly.
- Automated tests cover permission boundaries, title match, and **description-only** match behavior.

**Test plan (manual):**

1. As owner, search for a unique substring of a brainstorm title; confirm it appears. Repeat for an idea.
2. Search for a substring that appears **only** in the resource **description** (not in the title); confirm the brainstorm or idea appears.
3. As a user with no access to another user’s private brainstorm, search for its title; confirm it does not appear.
4. As collaborator on a shared brainstorm, search; confirm it appears.

---

### Ticket 4.6.2 — Global search UI (web)

**Description:** Add a **global search** entry in [`apps/web`](../../apps/web): command palette (**⌘K** / **Ctrl+K**) and/or a compact search field in the app chrome, using **shadcn/ui** patterns and **Client Components** per [AGENTS.md](../../AGENTS.md). Results should be grouped (Brainstorms / Ideas) with clear navigation on selection.

**Tasks:**

- [x] Implement command dialog (e.g. shadcn `Command` + `Dialog`) or equivalent; register **⌘K / Ctrl+K**; focus trap and Escape to close.
- [x] **Discoverability (Persona A must-have):** Search is openable from **a visible control** in the app chrome (e.g. sidebar “Search…” on desktop, search icon on mobile header) **and** via the keyboard shortcut; show a **shortcut hint** (e.g. ⌘K) on the primary trigger where layout allows so users are not required to memorize the shortcut.
- [x] Debounced requests to the search API; loading and empty states; handle API errors with toast or inline message per existing patterns.
- [x] **Resume (Persona A must-have):** Persist **recent queries** (e.g. localStorage, capped list) and show them when the palette opens so repeat lookups are one click; record a query when the user runs a search or opens a result (product choice: document in UI).
- [x] Selecting a result navigates to the correct personal URL; **highlight** matching substrings in **result titles** (and in description preview lines if shown and cheap).
- [x] Respect light/dark theme and semantic tokens from M4.5.

**Acceptance criteria:**

- User can open search via **visible control** and via **shortcut** from main app layouts, type a query, and open a result in one or two steps.
- **Recent queries** appear for signed-in users when opening search (after first use), supporting fast resume.
- No layout break on mobile (either palette works on small viewports or a fallback search entry is provided).

**Test plan (manual):**

1. Open search, type partial title, select a brainstorm; confirm navigation and correct page.
2. Repeat for an idea. Confirm browser back returns to prior page.
3. On a narrow viewport, confirm search remains usable or documented fallback works.

---

### Ticket 4.6.3 — Polish & limits

**Description:** Cap query length, rate-limit or debounce aggressively enough to protect the API, and document **sort order** (e.g. relevance score, then updated_at). Add empty-query behavior and “no results” copy that does not imply a bug.

**Tasks:**

- [x] Document and enforce max `q` length; return clear validation errors when appropriate.
- [x] Define stable default ordering and optional `sort` param if needed later.
- [x] Confirm debounce / request coalescing so typing does not hammer the API (complements Persona A “long session” use).

**Acceptance criteria:**

- Long or abusive queries do not stress the DB; UX stays responsive under normal typing.
- “No results” state is clear and actionable (e.g. adjust query, go to dashboard) and does not imply a bug — important for Persona A trust during resume flows.

**Note:** Recent-query persistence is **required** for Persona A and is owned by ticket **4.6.2**, not optional here.

**Test plan (manual):**

1. Paste a very long string; confirm graceful handling.
2. Search for gibberish; confirm empty state messaging.

---

## Milestone 4.6 completion checklist

- [x] All three tickets (4.6.1–4.6.3) are implemented and accepted.
- [x] Search is permission-safe end-to-end; UI is discoverable (**visible entry + keyboard shortcut + shortcut hint** where applicable).
- [x] **Persona A bar:** match on **title and resource description**; **recent queries**; **title highlight** in results; disambiguating **description preview** in API/UI as specified.
- [x] Organizations ([Milestone 5](./milestone_5.md)) can later extend the same API to include org-scoped resources without redesigning personal search.
