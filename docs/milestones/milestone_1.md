# Milestone 1 — Foundation

**Goal:** Core infrastructure: authentication (username/password + JWT and Google OAuth with account linking), user model with username, idea ownership, membership, and GitHub-style URL routing. Users can register or sign in with Google, claim a username, create ideas, invite collaborators, and access idea pages that are access-controlled and URL-scoped to the owner's username.

**Timeline:** Weeks 1–2  
**Depends on:** Milestone 0 (Base App Architecture)

---

## Tickets

### Ticket 1.1 — Authentication (username/password, Google OAuth, JWT, account linking, User model)

**Description:** Implement user registration and sign-in via username/password and Google OAuth, with JWT-based auth and account linking. When a user signs in with Google and their email matches an existing account, link the Google identity to that account instead of creating a duplicate. User model includes username so every user has a stable identity and URL namespace. This matters because ownership and idea URLs (`/:username/:idea-slug`) depend on it; without auth and usernames, the rest of the product cannot function.

**Tasks:**

- [ ] Add JWT handling to the Rails API (e.g. `jwt` gem or `devise-jwt`); configure secret, algorithm, and token expiry (e.g. 24h access token, optional refresh token strategy if desired for MVP).
- [ ] Create User model with: `id`, `email`, `username`, `password_digest`, `name`, `avatar_url`, `google_uid`, `bio`, timestamps. Add unique index on `email` and `username`; unique index on `google_uid` (nullable). Use `has_secure_password` (bcrypt) for password storage; allow `password_digest` to be nullable so Google-only users are supported.
- [ ] Implement registration: `POST /auth/register` — accept `email`, `username`, `password`, optional `name`; validate uniqueness of email and username (URL-safe, 3–30 chars); create user and return JWT + user payload (or require separate login after register).
- [ ] Implement login: `POST /auth/login` — accept `email` (or username) and `password`; validate credentials; return JWT (and user payload). Return 401 on invalid credentials.
- [ ] Add OmniAuth and Google OAuth 2.0 (e.g. `omniauth-google-oauth2`); configure OAuth client ID, secret, and callback URL. Implement `GET /auth/google` (redirect to Google) and `GET /auth/google/callback`. In callback: (1) find user by `google_uid` — if found, issue JWT and redirect to app with token; (2) else find user by email — if found, set `google_uid` on that user (account linking), then issue JWT and redirect; (3) else create new user with email, name, avatar_url from Google, set `google_uid`, leave username null and password_digest null. New Google users must set username before full access (see next bullet).
- [ ] For users without a username (first-time Google sign-in): support flow where client calls `GET /auth/me`, sees `username` null, shows username-selection screen; client submits username via `PATCH /auth/me` or `POST /auth/set_username` (validated via `check_username`); persist and then allow access to dashboard. Require username at registration for email/password; require username (set after first sign-in) for Google-only users.
- [ ] Expose endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me` (requires valid JWT; returns current user), `PATCH /auth/me` or `POST /auth/set_username` (set username when null, validated), `GET /auth/check_username?username=foo` (unauthenticated; returns availability). Sign-out is client-side (discard token); optional `POST /auth/logout` for server-side invalidation if using token blocklist.
- [ ] Next.js app: send JWT in `Authorization: Bearer <token>` header for API requests; store token (e.g. httpOnly cookie or secure storage); call `GET /auth/me` on load to resolve current user. Provide "Sign in with Google" button that redirects to API Google auth URL; handle callback redirect that returns token (e.g. query param or cookie) and store it like login.

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

### Ticket 1.2 — Dashboard & Navigation

**Description:** Build the Next.js app shell (sidebar, user avatar, route slots), dashboard with "My Ideas" and "Shared With Me," idea cards, new-idea modal, and user profile page so users have a home and can navigate to ideas and profiles. This ties together auth and ideas into a usable product surface.

**Tasks:**

- [ ] Implement app shell: sidebar navigation, user avatar (and name), route slots for `/dashboard`, `/:username`, `/:username/:slug` (and children). Use design: zinc-50 background, zinc-900 text.
- [ ] Dashboard at `/dashboard`: "My Ideas" section — grid of idea cards grouped by status (brainstorm, validating, validated, shelved). Each card: title, status badge, score ring if analysis exists, member avatars, last updated.
- [ ] Dashboard: "Shared With Me" section — ideas where current user is collaborator or viewer, with owner avatar and username.
- [ ] "New Idea" button opens modal: title, optional description, slug preview (auto-generated from title, editable). Submit creates idea via API and navigates to idea detail.
- [ ] User profile page at `/:username`: show avatar, display name, @username, bio, and list of ideas (visibility rules: owner sees all; others see only ideas shared with them).
- [ ] Idea detail: placeholder or minimal shell at `/:username/:slug` with tabs (Overview, Brainstorm, Analysis, Wireframes, PRD, Notes, Tasks); Overview tab shows editable title/description for owner/collaborator, read-only for viewer. Implement 404 when API returns 404.

**Acceptance criteria:**

- Logged-in user lands on dashboard and sees "My Ideas" and "Shared With Me" with correct data.
- Creating a new idea via modal creates the idea and navigates to its detail page; idea appears in My Ideas.
- Navigating to `/:username` shows that user's profile and ideas (subject to visibility).
- Navigating to `/:username/:slug` shows the idea shell and Overview tab; unauthorized access shows 404 page.
- Sidebar and header reflect current user and allow navigation to dashboard and profile.

**Test plan (manual):**

1. Log in and go to dashboard. Confirm "My Ideas" shows your ideas grouped by status; "Shared With Me" shows ideas you were invited to, with owner attribution.
2. Click "New Idea," fill title and description, adjust slug if desired, submit. Confirm redirect to idea detail and card appears on dashboard.
3. Visit your profile at `/:username`. Confirm avatar, name, @username, and idea list.
4. Visit another user's profile (with shared idea). Confirm you see only ideas shared with you.
5. Open an idea you own; confirm Overview shows editable title/description. Open an idea where you are viewer; confirm edit controls are hidden or disabled.
6. Paste URL of an idea you don't have access to; confirm 404 page and no flash of idea content.

---

### Ticket 1.3 — Ideas CRUD

**Description:** Implement the Idea model and full CRUD with user-scoped slugs and status/visibility, so every idea belongs to one owner and is addressable at `/:username/:slug`. This is the core resource of the product; without it, dashboard and collaboration have nothing to attach to.

**Tasks:**

- [ ] Create Idea model: `user_id` (owner), `slug`, `title`, `description`, `status`, `visibility`, timestamps. Add enum `status`: brainstorm, validating, validated, shelved; enum `visibility`: private, shared.
- [ ] Enforce slug unique per user (DB unique index on `[user_id, slug]`); auto-generate slug from title (URL-safe, editable by owner).
- [ ] Implement endpoints: `GET /ideas` (current user's ideas), `POST /ideas` (create, set current user as owner), `GET /:username/:slug` (show), `PATCH /:username/:slug` (update), `DELETE /:username/:slug` (destroy). Resolve `:username` to user id for lookups.
- [ ] Ensure ownership is immutable after creation (no transfer in v1).
- [ ] Authorize: only owner (and later collaborators) can update/delete; show is restricted by membership (handled in 1.4).

**Acceptance criteria:**

- Authenticated user can create an idea with title (and optional description); slug is auto-generated and can be edited on create/update by owner.
- `GET /ideas` returns only ideas owned by the current user.
- `GET /:username/:slug` returns the idea when the current user is owner or member (membership in 1.4); returns 404 when not found or no access.
- Owner can PATCH (title, description, slug, status, visibility) and DELETE the idea. Non-owners receive 403 or 404 as per policy.

**Test plan (manual):**

1. Create a new idea with title "My First Idea"; confirm slug is generated (e.g. "my-first-idea") and idea appears in "My Ideas" list.
2. Edit the idea: change title, slug, status, visibility. Save; confirm changes persist and URL with new slug works.
3. Call `GET /ideas`; confirm only current user's ideas are returned.
4. As same user, open `/:username/:slug`; confirm idea loads. As another user (no membership yet), request same URL; confirm 404 (not 403).
5. Delete the idea; confirm it is removed and no longer accessible.

---

### Ticket 1.4 — Membership & Access Control

**Description:** Add IdeaMember and IdeaInvite, Pundit policies for owner/collaborator/viewer, and 404 on unauthorized access so ideas can be shared without revealing existence to non-members. This matters for security and GitHub-style mental model: only people with access should see the idea at all.

**Tasks:**

- [ ] Create IdeaMember: `idea_id`, `user_id`, `role` (collaborator | viewer), `invited_by`, `accepted_at`, timestamps. IdeaInvite: `idea_id`, `email`, `token`, `role`, `expires_at` (7 days), `invited_by`, timestamps.
- [ ] Implement Pundit policies: owner can do everything; collaborator can edit, run analysis, generate PRD, but not manage members or delete; viewer can view and export only. Apply policies to idea and member/invite actions.
- [ ] For any idea-scoped route, when the current user is not owner and not in IdeaMembers (accepted), return 404 — never 403, never confirm the idea exists.
- [ ] Endpoints: `POST /:username/:slug/members` (invite by email, create IdeaMember or IdeaInvite), `DELETE /:username/:slug/members/:id`, `PATCH /:username/:slug/members/:id` (e.g. change role), `POST /invites/:token/accept`.
- [ ] Invite flow: if email matches existing user, create IdeaMember with `accepted_at` null and send in-app/email notification; if not, create IdeaInvite and send email with link containing token. Accept endpoint sets `accepted_at` and creates IdeaMember when applicable.

**Acceptance criteria:**

- Owner can invite by email; existing user gets member record (pending until accept); new user gets invite with token and 7-day expiry.
- Invitee can accept via `POST /invites/:token/accept` (and appropriate client flow); after accept, they have access per role.
- Owner can change member role (collaborator ↔ viewer) and remove members; collaborator cannot manage members.
- Unauthorized access to an idea (no owner, not member) always returns 404. Viewer sees read-only experience (enforced in UI in 1.2).

**Test plan (manual):**

1. As owner, invite an existing user by email as collaborator. As invitee, accept invite. Confirm invitee can access the idea and edit (e.g. change title). Confirm invitee cannot see "Manage members" or delete idea.
2. As owner, invite a different user as viewer. After accept, confirm viewer can open the idea and see content but not edit (UI hides or disables edit controls).
3. As a user with no access, open URL `/:owner_username/:slug` for an idea you're not in. Confirm 404 response and no leak of idea title/existence.
4. Invite with invalid or expired token; confirm appropriate error. Resend invite; confirm new token works.

---


## Milestone 1 completion checklist

- [ ] All four tickets (1.1–1.4) are implemented and accepted.
- [ ] User can register, sign in with username/password or Google OAuth (JWT), link accounts when Google email matches existing user, create ideas, invite members, accept invites, and access dashboard and idea detail with correct permissions.
- [ ] Unauthorized access to an idea returns 404. Role matrix (owner/collaborator/viewer) is enforced.
