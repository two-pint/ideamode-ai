# Milestone 1 — Foundation

**Goal:** Core infrastructure: authentication (Google SSO), user model with username, idea ownership, membership, and GitHub-style URL routing. Users can sign in, claim a username, create ideas, invite collaborators, and access idea pages that are access-controlled and URL-scoped to the owner's username.

**Timeline:** Weeks 1–2  
**Depends on:** Milestone 0 (Base App Architecture)

---

## Tickets

### Ticket 1.1 — Authentication (Google OAuth, User model, session)

**Description:** Implement sign-in and sign-out with Google OAuth 2.0 and a User model with username, so every user has a stable identity and URL namespace. This matters because ownership and idea URLs (`/:username/:idea-slug`) depend on it; without auth and usernames, the rest of the product cannot function.

**Tasks:**

- [ ] Add Devise and OmniAuth (Google) to the Rails API; configure OAuth credentials and callback URL.
- [ ] Create User model with: `id`, `email`, `username`, `name`, `avatar_url`, `google_uid`, `bio`, timestamps. Add unique index on `email` and `username`; index on `google_uid`.
- [ ] Implement OAuth callback: find or create user by `google_uid`, set session (secure cookie, Rails session store).
- [ ] Expose endpoints: `POST /auth/google` (or equivalent initiate/callback flow), `DELETE /auth/sign_out`, `GET /auth/check_username` (for uniqueness validation).
- [ ] On first sign-in (user has no username yet), support a flow where the client can set username (validated via `check_username`); persist and then allow access to the app.
- [ ] Sign-out clears session and redirect or return response that client can use to redirect to marketing/login page.
- [ ] Add a way for the Next.js app to send credentials (cookies or token) with API requests and to read current user (e.g. `GET /auth/me` or include user in session response).

**Acceptance criteria:**

- User can sign in with Google; after callback, session is established and user record exists with `email`, `username` (once set), `name`, `avatar_url`, `google_uid`.
- First-time user can choose a unique, URL-safe username (3–30 chars); duplicate username returns validation error.
- Signed-in requests to protected endpoints receive the current user; signed-out requests are rejected (401 or redirect).
- User can sign out; session is cleared and client can redirect to marketing page.
- `GET /auth/check_username?username=foo` returns availability without requiring auth.

**Test plan (manual):**

1. Open web app unauthenticated; trigger "Sign in with Google." Complete Google OAuth. Confirm redirect back to app and that user is logged in (e.g. avatar/name in header).
2. As new user, confirm username selection screen appears; enter valid username, submit. Confirm username is saved and user can access dashboard or home.
3. Try submitting an existing username; confirm error message and that username is not saved.
4. Sign out. Confirm session is cleared and UI shows logged-out state; confirm API calls to protected routes return 401 or redirect.
5. Sign in again; confirm same user is loaded and no duplicate user created.

---

### Ticket 1.2 — Ideas CRUD

**Description:** Implement the Idea model and full CRUD with user-scoped slugs and status/visibility, so every idea belongs to one owner and is addressable at `/:username/:slug`. This is the core resource of the product; without it, dashboard and collaboration have nothing to attach to.

**Tasks:**

- [ ] Create Idea model: `user_id` (owner), `slug`, `title`, `description`, `status`, `visibility`, timestamps. Add enum `status`: brainstorm, validating, validated, shelved; enum `visibility`: private, shared.
- [ ] Enforce slug unique per user (DB unique index on `[user_id, slug]`); auto-generate slug from title (URL-safe, editable by owner).
- [ ] Implement endpoints: `GET /ideas` (current user's ideas), `POST /ideas` (create, set current user as owner), `GET /:username/:slug` (show), `PATCH /:username/:slug` (update), `DELETE /:username/:slug` (destroy). Resolve `:username` to user id for lookups.
- [ ] Ensure ownership is immutable after creation (no transfer in v1).
- [ ] Authorize: only owner (and later collaborators) can update/delete; show is restricted by membership (handled in 1.3).

**Acceptance criteria:**

- Authenticated user can create an idea with title (and optional description); slug is auto-generated and can be edited on create/update by owner.
- `GET /ideas` returns only ideas owned by the current user.
- `GET /:username/:slug` returns the idea when the current user is owner or member (membership in 1.3); returns 404 when not found or no access.
- Owner can PATCH (title, description, slug, status, visibility) and DELETE the idea. Non-owners receive 403 or 404 as per policy.

**Test plan (manual):**

1. Create a new idea with title "My First Idea"; confirm slug is generated (e.g. "my-first-idea") and idea appears in "My Ideas" list.
2. Edit the idea: change title, slug, status, visibility. Save; confirm changes persist and URL with new slug works.
3. Call `GET /ideas`; confirm only current user's ideas are returned.
4. As same user, open `/:username/:slug`; confirm idea loads. As another user (no membership yet), request same URL; confirm 404 (not 403).
5. Delete the idea; confirm it is removed and no longer accessible.

---

### Ticket 1.3 — Membership & Access Control

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
- Unauthorized access to an idea (no owner, not member) always returns 404. Viewer sees read-only experience (enforced in UI in 1.4).

**Test plan (manual):**

1. As owner, invite an existing user by email as collaborator. As invitee, accept invite. Confirm invitee can access the idea and edit (e.g. change title). Confirm invitee cannot see "Manage members" or delete idea.
2. As owner, invite a different user as viewer. After accept, confirm viewer can open the idea and see content but not edit (UI hides or disables edit controls).
3. As a user with no access, open URL `/:owner_username/:slug` for an idea you're not in. Confirm 404 response and no leak of idea title/existence.
4. Invite with invalid or expired token; confirm appropriate error. Resend invite; confirm new token works.

---

### Ticket 1.4 — Dashboard & Navigation

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
6. Paste URL of an idea you don’t have access to; confirm 404 page and no flash of idea content.

---

## Milestone 1 completion checklist

- [ ] All four tickets (1.1–1.4) are implemented and accepted.
- [ ] User can sign in with Google, set username, create ideas, invite members, accept invites, and access dashboard and idea detail with correct permissions.
- [ ] Unauthorized access to an idea returns 404. Role matrix (owner/collaborator/viewer) is enforced.
