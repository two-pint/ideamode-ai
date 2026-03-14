# Milestone 4 — Polish & Beta

**Goal:** Invite-only beta launch with onboarding flow, responsive and error polish, and beta/invite gating. App is stable, responsive, and ready for friends to onboard and collaborate.

**Timeline:** Week 5  
**Depends on:** Milestone 3 (Productivity Layer)

---

## Tickets

### Ticket 4.1 — Onboarding Flow

**Description:** Add a post-signup username selection screen, first-idea creation wizard, empty-state CTAs on all tabs, and a welcome banner so new users are guided to set a username and create their first idea. It matters to reduce drop-off and make the first session successful.

**Tasks:**

- [ ] After first Google sign-in, redirect to username selection screen before dashboard. Validate unique, URL-safe, 3–30 chars; show errors in real time. On success, persist username and redirect to dashboard.
- [ ] First-idea creation wizard: stepped flow (title → description → status) that creates the idea and redirects to idea detail. Trigger from empty dashboard or welcome banner.
- [ ] Empty states: every tab (Overview, Brainstorm, Analysis, Wireframes, PRD, Notes, Tasks) has a clear CTA when there is no content (e.g. "Start brainstorming", "Run your first analysis", "Add a note").
- [ ] Welcome banner on dashboard for new users with suggested first actions (e.g. create first idea, run analysis). Dismissible or hidden after first idea exists.

**Acceptance criteria:**

- New user completing Google sign-in is forced to set username before accessing the app; duplicate or invalid username is rejected with clear message.
- Dashboard empty state offers wizard or button to create first idea; wizard creates idea and navigates to it. Each tab has an empty state with a relevant CTA.
- Welcome banner appears for new users and suggests next steps; behavior is consistent and non-blocking after first use.

**Test plan (manual):**

1. Sign in with a new Google account; confirm redirect to username screen. Enter short or invalid username; confirm validation. Enter valid unique username; confirm redirect to dashboard.
2. On empty dashboard, use "Create first idea" or wizard; complete title, description, status. Confirm idea is created and you land on its detail page.
3. Open each tab (Brainstorm, Analysis, Notes, Tasks, Wireframes, PRD) with no data; confirm empty state and CTA are visible and make sense.
4. Confirm welcome banner appears and can be dismissed or disappears after first action; repeat with another new user if needed.

---

### Ticket 4.2 — Responsive & Error Polish

**Description:** Ensure mobile-responsive layout, loading skeletons for async data, error boundaries with retry, optimistic UI for task toggle and note save, toasts for key events, and dedicated 404/access-denied pages so the app feels solid and recoverable on all devices.

**Tasks:**

- [ ] Audit and fix layout for mobile: sidebar collapses or becomes drawer; tables/cards stack; touch targets adequate. All main pages pass a simple responsive check (e.g. 320px, 768px, 1024px).
- [ ] Add loading skeletons (or spinners) for dashboard idea list, idea detail, analysis results, PRD, and any other async-heavy views. Replace raw spinners where skeleton is more appropriate.
- [ ] Add error boundaries (React error boundary) with retry and optional "Go to dashboard" link so failures don’t leave a blank screen.
- [ ] Optimistic UI: task toggle (complete/incomplete) and note save reflect in UI immediately; revert and show error if request fails. Toasts: "Note saved", "Invite accepted", "Analysis complete" (or similar) for key actions.
- [ ] Design and implement 404 page (idea not found or no access) and access-denied page if used elsewhere. Use product theme (zinc-50, zinc-900).

**Acceptance criteria:**

- All primary flows are usable on a narrow viewport (e.g. 375px width). No horizontal scroll or clipped critical content.
- Async views show skeleton or loading state; errors show boundary with retry. Task toggle and note save feel instant; toasts confirm save and key events.
- Visiting a non-existent or unauthorized idea URL shows the 404 page, not a generic browser 404.

**Test plan (manual):**

1. Resize browser to mobile width; go through dashboard, idea detail, and at least one of each tab. Confirm layout adapts and nothing is unreachable.
2. Throttle network to "Slow 3G"; open dashboard and idea detail. Confirm skeletons or loading states appear. Trigger a failure (e.g. disconnect); confirm error boundary and retry work.
3. Toggle a task and edit a note; confirm immediate UI update and toast on save. Disconnect and save; confirm revert and error message if implemented.
4. Open a URL for an idea you don’t have access to; confirm custom 404 page with theme styling.

---

### Ticket 4.3 — Beta Access & Invite Gate

**Description:** Add allowlist for beta access, waitlist form on marketing page, beta invite email, and admin endpoint to grant/revoke access so launch is invite-only. Also ensure collaborator invite emails and in-app pending-invite banner work for idea invites. It matters to control load and create a clear beta cohort.

**Tasks:**

- [ ] Create allowlist table or model: `email`, `invited_by` (optional), `used_at` (nullable; set when user signs up with that email). Admin can add/remove emails.
- [ ] After Google OAuth, if user’s email is not on allowlist, show "You’re not in the beta yet" (or waitlist) and do not create session / do not grant access. Optionally add them to waitlist.
- [ ] Waitlist form on marketing/login page: submit email; store in waitlist table; show "We’ll be in touch" or similar. No sign-in until allowed.
- [ ] Beta invite email: Action Mailer sends email to allowlisted address with sign-in link or instructions. Admin endpoint (e.g. `POST /admin/invites`) to grant access (add email to allowlist) and optionally send invite email; endpoint to revoke (remove from allowlist).
- [ ] Idea collaborator invites: existing flow (from 1.3) sends email to invitee; if not registered, email contains link with token. In-app: pending idea invite banner for logged-in user when they have accepted member record but optional "pending" state, or banner for when they have an invite link to accept. Clarify with product: banner for "You have N pending idea invites."
- [ ] Document admin flow: how to add/remove beta users and send invite emails.

**Acceptance criteria:**

- Only allowlisted emails can sign in and use the app. Non-allowlisted user sees waitlist or "not in beta" message after OAuth. Waitlist form stores email and shows confirmation.
- Admin can add email to allowlist (and optionally trigger invite email) and remove email (revoke). Invite email contains clear next step (e.g. sign in link).
- Idea invite flow still works: invitee gets email; accepting invite grants access. Logged-in user with pending idea invite sees banner or notification; accepting works.

**Test plan (manual):**

1. As admin, add an email to allowlist and trigger invite. As that user, open invite email and sign in; confirm access to app. Remove email from allowlist; sign out and try to sign in again; confirm access denied and appropriate message.
2. Submit email via waitlist form; confirm success message and email stored. Confirm that email cannot sign in until allowlisted.
3. As owner, invite a non-user by email; confirm invite email is sent. As invitee, use token link and complete sign-up/sign-in; confirm added to idea. As existing user, invite to second idea; confirm in-app pending invite is visible and accept flow works.

---

## Milestone 4 completion checklist

- [ ] All three tickets (4.1–4.3) are implemented and accepted.
- [ ] New users are guided through username and first idea; empty states and welcome banner are in place.
- [ ] App is responsive, has loading and error handling, and uses 404/access-denied pages. Beta is gated by allowlist with waitlist and admin controls.
