# Milestone 5 — Organizations

**Goal:** Businesses and teams can have an **organization** that owns or groups **brainstorms** and **ideas**; **users are members** of one or more orgs with roles. Personal workspaces keep today’s behavior: resources with no organization remain user-scoped at `/:username/...`.

**Timeline:** TBD (after global search)  
**Depends on:** Milestone 4.6 (Global Search)

---

## Context

Today brainstorms and ideas are owned by a single user (`user_id`) with slugs unique per user; authorization uses [`ResourceAccess`](../../apps/api/app/models/concerns/resource_access.rb) (owner + per-resource members). This milestone adds an optional **org scope** via nullable `organization_id` on brainstorms and ideas so existing rows stay valid (personal = `organization_id` NULL).

**URL strategy (mandated for implementation):** Use a dedicated path prefix for org-scoped resources so org slugs never collide with usernames — e.g. **`/o/[orgSlug]/brainstorms/[slug]`** and **`/o/[orgSlug]/ideas/[slug]`** alongside existing **`/[username]/brainstorms/...`** and **`/[username]/ideas/...`**. Do not overload `[username]` for orgs without a global uniqueness rule across `users.username` and `organizations.slug`.

---

## Tickets

### Ticket 5.1 — Organizations & membership (backend)

**Description:** Add `Organization` and `OrganizationMember` models, migrations, and APIs so orgs can be created, named, and joined with roles. Mirror proven patterns from [`brainstorm_members`](../../apps/api/db/schema.rb) / [`idea_members`](../../apps/api/db/schema.rb) (invited_by, accepted_at, role). This matters because every other org feature hangs off membership and roles.

**Tasks:**

- [ ] Add `organizations` table: `name`, URL-safe `slug` (**unique globally** in the app namespace used for `/o/:orgSlug`), timestamps, optional `settings` jsonb.
- [ ] Add `organization_members`: `organization_id`, `user_id`, `role` (`owner` | `admin` | `member`), `invited_by_id`, `accepted_at`, unique index on `[organization_id, user_id]`.
- [ ] Optional: `organization_invites` (email, token, expires_at, invited_by, role) following [`BrainstormInvite`](../../apps/api/app/models/brainstorm_invite.rb) / [`IdeaInvite`](../../apps/api/app/models/idea_invite.rb); or document reuse of a generic invite pattern.
- [ ] Model validations: slug format (URL-safe), role inclusion; on create org, creator becomes `owner` with accepted membership.
- [ ] Endpoints (illustrative): list orgs for current user, create org, get/patch org (name, settings), delete or archive policy (document whether delete is hard or soft). List/add/remove/change-role members; accept invite if using invite table.
- [ ] API tests for happy paths and forbidden cases (non-member cannot read org; only admin/owner can invite or remove, per chosen rules).

**Acceptance criteria:**

- Authenticated user can create an org and appears as `owner` with an accepted membership.
- Members can be listed; invites (if implemented) can be created, accepted, and expired tokens rejected.
- Slug is unique among organizations; documented rules for changing slug (if allowed) or immutability.

**Test plan (manual):**

1. Create org via API; confirm owner membership and org appears in “my orgs.”
2. Invite a second user (or add by user id in dev); accept invite; confirm role and access.
3. Attempt to access org as non-member; confirm 404 or 403 per product convention.

---

### Ticket 5.2 — Org-scoped brainstorms & ideas (backend)

**Description:** Add nullable `organization_id` to `brainstorms` and `ideas`, fix slug uniqueness for personal vs org scope, extend authorization in [`ResourceAccess`](../../apps/api/app/models/concerns/resource_access.rb), and expose list/create/show/update/delete for org-scoped resources. Keep `user_id` as creator/primary owner for compatibility with existing invite and member rows.

**Tasks:**

- [ ] Migrations: `brainstorms.organization_id`, `ideas.organization_id` (nullable FKs to `organizations`). Backfill: all existing rows remain NULL (personal).
- [ ] **Slug uniqueness:** Retain unique `(user_id, slug)` where `organization_id` IS NULL. Add unique `(organization_id, slug)` where `organization_id` IS NOT NULL (partial unique indexes in PostgreSQL). Document that personal and org namespaces are independent.
- [ ] Extend [`Idea#brainstorm_belongs_to_same_owner`](../../apps/api/app/models/idea.rb): linked brainstorm and idea must share the **same org scope** (both `organization_id` NULL and same `user_id`, or both same non-null `organization_id` and same creator rules as product defines).
- [ ] **Authorization (MVP):** Document and implement one clear rule, e.g. any **accepted org member** can `accessible_by?` org-scoped resources; **`editable_by?`** = creator (`user_id`) or org **admin/owner**, plus existing per-resource collaborators (`brainstorm_members` / `idea_members`) where applicable. Adjust if product prefers stricter edit rules.
- [ ] API: query params or routes to list/create brainstorms and ideas under an org (`organization_id` set on create). Show/update/delete authorize via extended `ResourceAccess` + org membership.
- [ ] Update any services/controllers that assume only user-scoped lists (dashboard aggregations, recent access, etc.) to include org context where required.
- [ ] Automated tests: slug collisions across personal vs org; link validation idea↔brainstorm; access denial for non-members.

**Acceptance criteria:**

- Personal brainstorms and ideas behave as today (NULL `organization_id`).
- Org-scoped resources are visible to org members per documented rules; slugs are unique within the org.
- Linking an idea to a brainstorm fails if org scope does not match.

**Test plan (manual):**

1. Create org-scoped brainstorm and idea; confirm both list under org and URLs resolve (once web routing exists).
2. As non-member, request org resource; confirm no access.
3. Link idea to brainstorm in same org; confirm success. Try linking to personal brainstorm from org idea (or mismatched org); confirm validation error.

---

### Ticket 5.3 — Organizations UI (web)

**Description:** In [`apps/web`](../../apps/web), add org creation and selection, org dashboard (brainstorms and ideas lists for the active org), and navigation to org-scoped detail pages under **`/o/[orgSlug]/...`**. Use **Client Components** and **shadcn/ui** per [AGENTS.md](../../AGENTS.md). Empty states should match the tone of existing dashboard patterns.

**Tasks:**

- [ ] **Org switcher** (or equivalent) in app shell: switch between personal workspace (`/[username]/...`) and orgs the user belongs to.
- [ ] Routes: `/o/[orgSlug]` dashboard (tabs or sections for brainstorms and ideas); `/o/[orgSlug]/brainstorms/[slug]`, `/o/[orgSlug]/ideas/[slug]` reusing existing detail UIs with org scoped API calls.
- [ ] Flows: create organization (name → slug); manage members (list, invite by email if backend supports); leave org or remove member per permissions (if in scope).
- [ ] Create brainstorm / create idea under active org context sets `organization_id` on API payloads.
- [ ] Loading and error states consistent with Milestone 4.5 patterns; empty states for org dashboard.

**Acceptance criteria:**

- User can create an org, see it in the switcher, and open org dashboard with lists.
- User can open org-scoped brainstorm and idea detail pages and perform the same core actions as personal resources (within permissions).
- Personal URLs and org URLs coexist without slug collisions between username and org slug namespaces (enforced by `/o/` prefix).

**Test plan (manual):**

1. Create org from UI; switch from personal to org; create brainstorm and idea; open detail pages from `/o/...` links.
2. Add a second account as member; confirm they see org resources per membership.
3. Confirm personal `/:username/...` resources unchanged for legacy data.

---

## Out of scope (defer unless pulled in)

- Billing, seats, or usage limits per org (may reference future Pro “team workspaces”).
- Bulk migration of existing personal brainstorms into an org (MVP: recreate or manual).
- **Expo mobile:** out of scope for this milestone unless explicitly added later.

---

## Milestone 5 completion checklist

- [ ] All three tickets (5.1–5.3) are implemented and accepted.
- [ ] Organizations exist with membership and roles; org-scoped brainstorms and ideas are authorized and slugged correctly.
- [ ] Web app exposes org switcher and `/o/[orgSlug]/...` routes for org workspace; personal workspace remains at `/:username/...`.
