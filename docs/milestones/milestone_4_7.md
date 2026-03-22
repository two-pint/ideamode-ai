# Milestone 4.7 — Mobile parity (Expo)

**Goal:** The **`apps/mobile`** Expo app exposes the same **personal-workspace** capabilities users have on **`apps/web`**: sign-in, dashboard-style discovery, brainstorm and idea CRUD with core tab experiences, global search, sharing/invitations, and polish consistent with [AGENTS.md](../../AGENTS.md) (Client Components parity: hooks and client-only patterns on native; **Lucide via `lucide-react-native`**; align with [semantic UI](../ui/semantic-ui.md) where applicable). **Organizations** ([Milestone 5](./milestone_5.md)) remain out of scope until the API and web support org routes; this milestone targets **`/:username/...`** resources only.

**Timeline:** TBD (after global search)  
**Depends on:** [Milestone 4.6 — Global Search](./milestone_4_6.md) (reuse `GET /me/search` and the same permission model as web)

---

## Context

Today [`apps/mobile`](../../apps/mobile) ships **personal-workspace parity** with [`apps/web`](../../apps/web): Google OAuth, JWT session, dashboard with recent activity, brainstorm and idea flows, tabbed detail pages, global search, and invitations.

This milestone is **feature parity for solo / personal workspace** on iOS and Android (simulator and device), not a separate product direction. Prefer **shared contracts** with web: same API endpoints, same env naming patterns (`EXPO_PUBLIC_API_URL` mirroring `NEXT_PUBLIC_API_URL`), and documentation updates in the root [README](../../README.md) for running mobile against local API.

**Explicit scope notes:**

- **Wireframes (Excalidraw):** **Not included on mobile** — canvas editing remains web-only. See [Web → mobile parity](../mobile-parity.md).
- **Rich editors (Tiptap, etc.):** Prefer parity where feasible; **Markdown/plain** fallbacks are acceptable if called out in acceptance criteria.
- **Org URLs (`/o/...`):** Out of scope; revisit after [Milestone 5](./milestone_5.md).

---

## Tickets

### Ticket 4.7.1 — Mobile foundation: auth, API client, app shell

**Description:** Establish secure auth (Google OAuth flow aligned with the API), JWT persistence, authenticated `fetch` helpers, Expo Router layout with a consistent shell (tabs or stack), and environment handling. Without this, no feature work can ship.

**Tasks:**

- [x] Wire **OAuth** to match web: redirect URI / callback handling appropriate for Expo (expo-auth-session or equivalent), exchange for API session/JWT per existing API contract.
- [x] Persist token securely (e.g. SecureStore); implement sign-out and session refresh behavior consistent with web.
- [x] **Username claim** flow if required after first login (mirror web `/auth/set-username`).
- [x] Central **API base URL** from `EXPO_PUBLIC_API_URL`; handle device vs simulator (LAN IP) per [README](../../README.md).
- [x] Root layout: navigation structure for **Dashboard / Brainstorms / Ideas / Profile** (or equivalent), safe areas, loading gate when token is unknown.
- [x] Use **`lucide-react-native`** for icons per [AGENTS.md](../../AGENTS.md); no other icon sets without approval.

**Acceptance criteria:**

- User can sign in with Google, land in an authenticated home state, and sign out.
- Authenticated requests include the same **Authorization** pattern as web.
- README prerequisites for mobile dev are accurate (no stale “placeholder only” wording once shipped).

**Test plan (manual):**

1. Fresh install: sign in, restart app, confirm still signed in (or correct refresh behavior).
2. Point `EXPO_PUBLIC_API_URL` at local API; confirm requests succeed from simulator and from a physical device using machine IP.

---

### Ticket 4.7.2 — Lists, dashboard, global search

**Description:** Implement **discovery** parity: lists of brainstorms and ideas (owner + shared), **recent activity** if exposed via API (`/me/recent_access`), **global search** via `GET /me/search` with debounced queries and navigation to detail routes. Include **pull-to-refresh** where idiomatic.

**Tasks:**

- [x] **Dashboard** (or home): entry to brainstorms and ideas; show recent access when API returns items; empty states.
- [x] **Brainstorms** list: mirror web split of owned vs shared if applicable; navigate to `/:username/brainstorms/:slug`.
- [x] **Ideas** list: navigate to `/:username/ideas/:slug`.
- [x] **Global search:** search field + results list (brainstorms / ideas groups), title + description preview when API returns `description_preview`; navigate on select.
- [x] **Profile** screen: basic user info and link-out or in-app path to username-scoped lists.

**Acceptance criteria:**

- User can find and open any brainstorm/idea they can access on web, via lists or search, without typing URLs.
- Search respects the same permission boundaries as web (no leaked titles).

**Test plan (manual):**

1. Search for a title and a description-only substring; open result.
2. Confirm collaborator-only resources appear when shared, as on web.

---

### Ticket 4.7.3 — Brainstorm detail (tabs & actions)

**Description:** Build brainstorm detail screens with the same **tab set** as web where technically feasible: **Chat**, **Research**, **Notes**, **Resources**, **Sharing**. Support create/update flows the API already exposes; use streaming or polling per existing API patterns.

**Tasks:**

- [x] Load brainstorm by owner + slug; handle **404** as non-existent (no existence leak).
- [x] **Chat** UI with @ideabot trigger behavior parity (or document minimal subset if blocked).
- [x] **Research** list/create/open; **Notes** editor; **Resources** list/add.
- [x] **Sharing:** list members, invite flow if available on API, align with web permissions.
- [x] **Create idea from brainstorm** entry point if web exposes it (modal → API).
- [x] Status / visibility controls if editable on web for the same roles.

**Acceptance criteria:**

- Collaborator can use shared brainstorm according to role; owner can edit metadata consistent with web.
- No tab crashes on empty data; loading and error states present.

**Test plan (manual):**

1. Owner: edit title, change status, add note, run a chat message.
2. Collaborator: confirm read/write matches web for the same resource.

---

### Ticket 4.7.4 — Idea detail (tabs & PRD / wireframes strategy)

**Description:** Implement idea detail with tabs aligned to web: **Discussion**, **Analysis**, **Notes**, **Tasks**, **PRD**, **Sharing**. Wireframes are **web-only** (not shipped on mobile).

**Tasks:**

- [x] Discussion chat session; **Analysis** run/view results per API.
- [x] **Notes** and **Tasks** CRUD aligned with web capabilities.
- [x] **PRD:** view generated versions; generation trigger if API supports from mobile.
- [x] **Wireframes:** **omitted on mobile** — use web for Excalidraw (documented in [mobile-parity.md](../mobile-parity.md)).
- [x] **Pinned message** / overview parity if shown on web idea header.
- [x] Sharing and invites for ideas consistent with web.

**Acceptance criteria:**

- Core “validate an idea” loop is possible on mobile without forcing web for every step, or gaps are explicitly messaged.
- Wireframe/PRD limitations are visible to users, not silent failures.

**Test plan (manual):**

1. Open idea with existing PRD data; confirm display path works.
2. Create task and note; verify persistence via refresh.

---

### Ticket 4.7.5 — Invitations, polish, and release readiness

**Description:** Surface **invitations** (`/invitations` parity), handle **invite tokens** if deep-linked, unify loading/error toasts or native alerts, audit **read-only** mode for non-editors, and run a **parity checklist** against web for personal workspace. Update docs and CI hints (lint/test from `apps/mobile`).

**Tasks:**

- [x] Invitations list; accept/decline flows per API (`POST /invites/:token/decline`).
- [x] Optional: **universal links** / app scheme for `ideamode.ai` paths (document if deferred).
- [x] **Read-only** UX when `canEdit` is false (mirror web messaging).
- [x] Theming: light/dark if web supports both; contrast and touch targets.
- [x] **Parity checklist** doc section or spreadsheet: [mobile-parity.md](../mobile-parity.md).
- [x] Root [README](../../README.md): mobile section reflects full setup, not placeholder.

**Acceptance criteria:**

- Invited user can complete onboarding to a shared resource on mobile.
- Parity checklist reviewed and signed off for “personal workspace” scope.

**Test plan (manual):**

1. Receive invite on second account; accept on mobile; open resource.
2. Use app for 15 minutes on small device; no blocking layout bugs on core flows.

---

## Milestone 4.7 completion checklist

- [x] All five tickets (4.7.1–4.7.5) are implemented and accepted.
- [x] Mobile app is a credible alternative to web for **personal** brainstorms and ideas (pre-org).
- [x] [README](../../README.md) and env examples describe running mobile against a local API.
- [x] Organizations and `/o/...` routes remain explicitly out of scope until [Milestone 5](./milestone_5.md) (and a future mobile milestone if needed).
