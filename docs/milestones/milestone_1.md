# Milestone 1 — Foundation

**Goal:** Core infrastructure: authentication (username/password + JWT and Google OAuth with account linking), user model with username, **brainstorm and idea** ownership, membership for both, GitHub-style URL routing, and slug resolution across both models. Users can register or sign in with Google, claim a username, create **brainstorms and ideas**, invite collaborators to either, and access brainstorm/idea pages that are access-controlled and URL-scoped to the owner's username. Dashboard has two tabs: **Brainstorms** and **Ideas**.

**Timeline:** Weeks 1–2  
**Depends on:** Milestone 0 (Base App Architecture)

---

## Tickets

### Ticket 1.1 — Authentication (username/password, Google OAuth, JWT, account linking, User model) ✅

**Description:** Implement user registration and sign-in via username/password and Google OAuth, with JWT-based auth and account linking. When a user signs in with Google and their email matches an existing account, link the Google identity to that account instead of creating a duplicate. User model includes username so every user has a stable identity and URL namespace. This matters because ownership and idea URLs (`/:username/:idea-slug`) depend on it; without auth and usernames, the rest of the product cannot function.

**Tasks:**

- [x] Add JWT handling to the Rails API (e.g. `jwt` gem or `devise-jwt`); configure secret, algorithm, and token expiry (e.g. 24h access token, optional refresh token strategy if desired for MVP).
- [x] Create User model with: `id`, `email`, `username`, `password_digest`, `name`, `avatar_url`, `google_uid`, `bio`, timestamps. Add unique index on `email` and `username`; unique index on `google_uid` (nullable). Use `has_secure_password` (bcrypt) for password storage; allow `password_digest` to be nullable so Google-only users are supported.
- [x] Implement registration: `POST /auth/register` — accept `email`, `username`, `password`, optional `name`; validate uniqueness of email and username (URL-safe, 3–30 chars); create user and return JWT + user payload (or require separate login after register).
- [x] Implement login: `POST /auth/login` — accept `email` (or username) and `password`; validate credentials; return JWT (and user payload). Return 401 on invalid credentials.
- [x] Add OmniAuth and Google OAuth 2.0 (e.g. `omniauth-google-oauth2`); configure OAuth client ID, secret, and callback URL. Implement `GET /auth/google` (redirect to Google) and `GET /auth/google/callback`. In callback: (1) find user by `google_uid` — if found, issue JWT and redirect to app with token; (2) else find user by email — if found, set `google_uid` on that user (account linking), then issue JWT and redirect; (3) else create new user with email, name, avatar_url from Google, set `google_uid`, leave username null and password_digest null. New Google users must set username before full access (see next bullet).
- [x] For users without a username (first-time Google sign-in): support flow where client calls `GET /auth/me`, sees `username` null, shows username-selection screen; client submits username via `PATCH /auth/me` or `POST /auth/set_username` (validated via `check_username`); persist and then allow access to dashboard. Require username at registration for email/password; require username (set after first sign-in) for Google-only users.
- [x] Expose endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me` (requires valid JWT; returns current user), `PATCH /auth/me` or `POST /auth/set_username` (set username when null, validated), `GET /auth/check_username?username=foo` (unauthenticated; returns availability). Sign-out is client-side (discard token); optional `POST /auth/logout` for server-side invalidation if using token blocklist.
- [x] Next.js app: send JWT in `Authorization: Bearer <token>` header for API requests; store token (e.g. httpOnly cookie or secure storage); call `GET /auth/me` on load to resolve current user. Provide "Sign in with Google" button that redirects to API Google auth URL; handle callback redirect that returns token (e.g. query param or cookie) and store it like login.

**Acceptance criteria:**

- User can register with email, username, and password; duplicate email or username returns validation error; on success, user can log in (or receive JWT immediately per product choice).
- User can log in with email (or username) and password; valid credentials return JWT and user payload; invalid credentials return 401.
- User can sign in with Google. New Google user: account is created with email, name, avatar from Google and `google_uid` set; user is prompted to choose a unique username before accessing dashboard. Returning Google user (existing `google_uid`): receives JWT and full access.
- Account linking: if user signs in with Google and their Google email matches an existing account (same email, any auth method), link by setting `google_uid` on the existing user and do not create a new user; issue JWT for that existing user. They can then use either password or Google to sign in.
- Requests to protected endpoints include JWT in Authorization header and receive the current user; requests without valid JWT are rejected with 401.
- User can "sign out" by discarding the token; client redirects to marketing/login page and subsequent API calls return 401.
- `GET /auth/check_username?username=foo` returns availability without requiring auth. Username rules: URL-safe, 3–30 characters.

**Test plan (manual):**

1. Register a new user with email, username, and password. Confirm account is created and (if applicable) JWT is returned or login succeeds.
2. Log in with email and password; confirm JWT is returned and user is logged in. Log in with username and password; confirm same behavior.
3. Try registering or logging in with wrong password; confirm 401 or validation error. Try registering with existing email or username; confirm validation error.
4. Sign in with Google as a brand-new user (Google account never used with app). Confirm user is created with email/name/avatar from Google; confirm username prompt appears; set username and confirm dashboard access.
5. Sign in with Google using the same Google account again; confirm no duplicate user, same account, and no username prompt.
6. Register a user with email/password (e.g. alice@example.com). Then sign in with Google using a Google account with the same email (alice@example.com). Confirm account linking: no new user created, `google_uid` attached to existing user, JWT returned for that user. Sign out and sign in with password; confirm same user. Sign out and sign in with Google again; confirm same user.
7. Sign out (discard token). Confirm UI shows logged-out state and API calls to protected routes return 401.
8. Log in again (password or Google); confirm same user is loaded and `GET /auth/me` returns correct user.

---

### Ticket 1.2 — Brainstorms CRUD

**Description:** Implement the Brainstorm model and full CRUD with user-scoped slugs and status/visibility, so every brainstorm belongs to one owner and is addressable at `/:username/:slug`. Brainstorms share the same slug namespace as ideas per user (a user cannot have both a brainstorm and an idea with the same slug). This is the exploratory workspace resource; building it first allows Phase 2 to deliver brainstorm features immediately.

**Tasks:**

- [ ] Create Brainstorm model: `user_id` (owner), `slug`, `title`, `description`, `status`, `visibility`, timestamps. Add enum `status`: exploring, researching, ready, archived; enum `visibility`: private, shared.
- [ ] Enforce slug unique per user (DB unique index on `[user_id, slug]`); slug namespace is shared with ideas — application layer must ensure no duplicate slug across both Brainstorm and Idea for the same user. Auto-generate slug from title (URL-safe, editable by owner).
- [ ] Implement endpoints: `GET /brainstorms` (current user's brainstorms), `POST /brainstorms` (create, set current user as owner), `GET /:username/:slug` (show — resolve to brainstorm or idea via slug resolution), `PATCH /:username/:slug`, `DELETE /:username/:slug`. Slug resolution: for a given `:username` and `:slug`, check both brainstorms and ideas tables; return 404 if neither exists or no access.
- [ ] Ensure ownership is immutable after creation (no transfer in v1).
- [ ] Authorize: only owner (and later collaborators) can update/delete; show is restricted by membership (handled in 1.4).

**Acceptance criteria:**

- Authenticated user can create a brainstorm with title (and optional description); slug is auto-generated and can be edited on create/update by owner.
- `GET /brainstorms` returns only brainstorms owned by the current user.
- Slug is unique per user across both brainstorms and ideas (creating an idea with the same slug as an existing brainstorm for that user fails or vice versa).
- `GET /:username/:slug` returns the brainstorm or idea when the current user is owner or member; returns 404 when not found or no access. Backend resolves whether the slug refers to a brainstorm or an idea.
- Owner can PATCH (title, description, slug, status, visibility) and DELETE the brainstorm. Non-owners receive 403 or 404 as per policy.

**Test plan (manual):**

1. Create a new brainstorm with title "My First Brainstorm"; confirm slug is generated and brainstorm appears in Brainstorms list. Create an idea with the same slug; confirm validation error or conflict. Create an idea with a different slug; confirm both exist.
2. Edit the brainstorm: change title, slug, status, visibility. Save; confirm changes persist and URL with new slug works.
3. Call `GET /brainstorms`; confirm only current user's brainstorms are returned. Open `/:username/:slug` for a brainstorm; confirm it loads. As another user (no membership), request same URL; confirm 404.

---

### Ticket 1.3 — Ideas CRUD

**Description:** Implement the Idea model and full CRUD with user-scoped slugs, optional `brainstorm_id` (nullable FK to Brainstorm), and status/visibility. Ideas share the same slug namespace as brainstorms per user. Every idea belongs to one owner and is addressable at `/:username/:slug`. Slug resolution (see 1.2) determines whether a slug refers to a brainstorm or an idea. This is the structured validation resource; ideas can be created from brainstorms (M2) or independently.

**Tasks:**

- [ ] Create Idea model: `user_id` (owner), `brainstorm_id` (nullable FK → Brainstorm), `slug`, `title`, `description`, `status`, `visibility`, timestamps. Add enum `status`: validating, validated, shelved; enum `visibility`: private, shared.
- [ ] Enforce slug unique per user across both brainstorms and ideas (application-level or composite check with Brainstorm). Auto-generate slug from title (URL-safe, editable by owner).
- [ ] Implement endpoints: `GET /ideas` (current user's ideas), `POST /ideas` (create, set current user as owner; optional `brainstorm_id` in payload for "create from brainstorm" flow in M2), `GET /:username/:slug` (show — via slug resolution), `PATCH /:username/:slug`, `DELETE /:username/:slug`. Resolve `:username` to user id for lookups.
- [ ] Ensure ownership is immutable after creation (no transfer in v1).
- [ ] Authorize: only owner (and later collaborators) can update/delete; show is restricted by membership (handled in 1.4).

**Acceptance criteria:**

- Authenticated user can create an idea with title (and optional description); slug is auto-generated and can be edited on create/update by owner. `brainstorm_id` can be null (direct idea) or set when creating from a brainstorm (M2).
- `GET /ideas` returns only ideas owned by the current user.
- `GET /:username/:slug` returns the idea when the current user is owner or member (membership in 1.4); returns 404 when not found or no access. Slug resolution correctly returns idea vs brainstorm.
- Owner can PATCH (title, description, slug, status, visibility) and DELETE the idea. Non-owners receive 403 or 404 as per policy.

**Test plan (manual):**

1. Create a new idea with title "My First Idea"; confirm slug is generated and idea appears in Ideas tab. Ensure slug does not conflict with existing brainstorm for same user.
2. Edit the idea: change title, slug, status, visibility. Save; confirm changes persist and URL with new slug works.
3. Call `GET /ideas`; confirm only current user's ideas are returned. Open `/:username/:slug` for an idea; confirm idea loads. As another user (no membership), request same URL; confirm 404 (not 403).
4. Delete the idea; confirm it is removed and no longer accessible.

---

### Ticket 1.4 — Membership & Access Control

**Description:** Add BrainstormMember, BrainstormInvite, IdeaMember, and IdeaInvite; Pundit policies for owner/collaborator/viewer for **both brainstorms and ideas**; 404 on unauthorized access so brainstorms and ideas can be shared without revealing existence to non-members. This matters for security and GitHub-style mental model: only people with access should see the resource at all.

**Tasks:**

- [ ] Create BrainstormMember: `brainstorm_id`, `user_id`, `role` (collaborator | viewer), `invited_by`, `accepted_at`, timestamps. BrainstormInvite: `brainstorm_id`, `email`, `token`, `role`, `expires_at` (7 days), `invited_by`, timestamps.
- [ ] Create IdeaMember: `idea_id`, `user_id`, `role` (collaborator | viewer), `invited_by`, `accepted_at`, timestamps. IdeaInvite: `idea_id`, `email`, `token`, `role`, `expires_at` (7 days), `invited_by`, timestamps.
- [ ] Implement Pundit policies for both resources: owner can do everything; collaborator can edit, run research (brainstorms) or analysis/PRD (ideas), but not manage members or delete; viewer can view and export only. Apply policies to both brainstorm- and idea-scoped routes and member/invite actions.
- [ ] For any brainstorm- or idea-scoped route, when the current user is not owner and not in the relevant Members (accepted), return 404 — never 403, never confirm the resource exists.
- [ ] Endpoints: `POST /:username/:slug/members` (invite by email; context determines whether creating BrainstormMember/Invite or IdeaMember/Invite based on slug resolution), `DELETE /:username/:slug/members/:id`, `PATCH /:username/:slug/members/:id`, `POST /invites/:token/accept`.
- [ ] Invite flow: if email matches existing user, create member record with `accepted_at` null and send in-app/email notification; if not, create Invite and send email with link containing token. Accept endpoint sets `accepted_at` and creates Member when applicable. Same flow for both brainstorms and ideas.

**Acceptance criteria:**

- Owner can invite by email to a brainstorm or an idea; existing user gets member record (pending until accept); new user gets invite with token and 7-day expiry.
- Invitee can accept via `POST /invites/:token/accept` (and appropriate client flow); after accept, they have access per role to that brainstorm or idea.
- Owner can change member role (collaborator ↔ viewer) and remove members; collaborator cannot manage members. Same for both brainstorms and ideas.
- Unauthorized access to a brainstorm or idea (no owner, not member) always returns 404. Viewer sees read-only experience (enforced in UI in 1.5).

**Test plan (manual):**

1. As owner, invite an existing user by email as collaborator to a brainstorm. As invitee, accept invite. Confirm invitee can access the brainstorm and edit. Repeat for an idea; confirm same behavior. Confirm invitee cannot manage members or delete.
2. As owner, invite a different user as viewer to a brainstorm and an idea. After accept, confirm viewer can open both and see content but not edit (UI hides or disables edit controls).
3. As a user with no access, open URL `/:owner_username/:slug` for a brainstorm or idea you're not in. Confirm 404 response and no leak of title/existence.
4. Invite with invalid or expired token; confirm appropriate error. Resend invite; confirm new token works.

---

### Ticket 1.5 — Dashboard & Navigation ✅

**Description:** Build the Next.js app shell (sidebar, user avatar, route slots), dashboard with **two tabs** (Brainstorms and Ideas), each with "My …" and "Shared With Me," brainstorm and idea cards, new-brainstorm and new-idea modals, and user profile page. Brainstorm detail shell and idea detail shell with correct tabs so users have a home and can navigate to brainstorms, ideas, and profiles. This ties together auth and both resources into a usable product surface.

**Tasks:**

- [x] Implement app shell: sidebar navigation, user avatar (and name), route slots for `/dashboard`, `/:username`, `/:username/:slug` (and children). Use design: zinc-50 background, zinc-900 text.
- [ ] Dashboard at `/dashboard` with **two top-level tabs: Brainstorms and Ideas**.
- [ ] **Brainstorms tab:** "My Brainstorms" — grid of brainstorm cards grouped by status (exploring, researching, ready, archived). "Shared With Me" — brainstorms where current user is collaborator or viewer, with owner avatar and username. Each card: title, status badge, member avatars, last updated.
- [ ] **Ideas tab:** "My Ideas" — grid of idea cards grouped by status (validating, validated, shelved). "Shared With Me" — ideas where current user is collaborator or viewer, with owner avatar and username. Each card: title, status badge, score ring if analysis exists, member avatars, last updated, linked brainstorm indicator if `brainstorm_id` is set.
- [ ] "New Brainstorm" button opens modal: title, optional description, slug preview (auto-generated, editable). Submit creates brainstorm via API and navigates to brainstorm detail.
- [ ] "New Idea" button opens modal: title, optional description, slug preview (auto-generated, editable). Submit creates idea via API and navigates to idea detail.
- [ ] User profile page at `/:username`: show avatar, display name, @username, bio, and list of **brainstorms and ideas** (visibility rules: owner sees all; others see only those shared with them).
- [ ] **Brainstorm detail:** shell at `/:username/:slug` when slug resolves to a brainstorm, with tabs: Overview, Chat, Research, Notes. Overview tab shows editable title/description, status, members; placeholder content for Chat/Research/Notes until M2.
- [ ] **Idea detail:** shell at `/:username/:slug` when slug resolves to an idea, with tabs: Overview, Discussion, Analysis, Wireframes, PRD, Notes, Tasks. Overview tab shows editable title/description, status, members, "From Brainstorm" link if `brainstorm_id` is set; placeholder content for other tabs until M3/M4.
- [ ] Slug resolution: frontend or API must determine whether current slug is a brainstorm or an idea (e.g. API returns resource type; or frontend tries both). Implement 404 when API returns 404 or no access.

**Acceptance criteria:**

- Logged-in user lands on dashboard and sees two tabs: Brainstorms and Ideas. Each tab shows "My …" and "Shared With Me" with correct data.
- Creating a new brainstorm or idea via modal creates the resource and navigates to its detail page; card appears in the correct tab.
- Navigating to `/:username` shows that user's profile with brainstorms and ideas (subject to visibility).
- Navigating to `/:username/:slug` shows the correct shell (brainstorm vs idea) and Overview tab; unauthorized access shows 404 page.
- Sidebar and header reflect current user and allow navigation to dashboard and profile.

**Test plan (manual):**

1. Log in and go to dashboard. Confirm Brainstorms tab shows "My Brainstorms" and "Shared With Me"; Ideas tab shows "My Ideas" and "Shared With Me" with correct data.
2. Click "New Brainstorm," fill title and description, submit. Confirm redirect to brainstorm detail and card appears in Brainstorms tab. Repeat for "New Idea" and Ideas tab.
3. Visit your profile at `/:username`. Confirm avatar, name, @username, and lists of brainstorms and ideas.
4. Open a brainstorm you own; confirm Overview and tab strip (Chat, Research, Notes). Open an idea you own; confirm Overview and tab strip (Discussion, Analysis, Wireframes, PRD, Notes, Tasks).
5. Paste URL of a brainstorm or idea you don't have access to; confirm 404 page and no flash of content.

---

## Milestone 1 completion checklist

- [ ] All five tickets (1.1–1.5) are implemented and accepted.
- [ ] User can register, sign in with username/password or Google OAuth (JWT), link accounts when Google email matches existing user, create brainstorms and ideas, invite members to either, accept invites, and access dashboard (two tabs) and brainstorm/idea detail with correct permissions.
- [ ] Unauthorized access to a brainstorm or idea returns 404. Role matrix (owner/collaborator/viewer) is enforced for both.
