# IdeaMode — High-Level Design

**Version:** 1.0  
**Domain:** ideamode.ai  
**Stack:** Rails API + Next.js  
**Last Updated:** March 2026

---

## Overview

Four phased milestones from foundation to beta. The app follows a GitHub-style ownership model — ideas belong to a single user, are URL-scoped to that user's username, and can be shared with others as collaborators or viewers. AI runs throughout: brainstorm chat, validation analysis, and PRD generation all use the Claude API with streaming.

---

## Architecture Summary

| Layer | Technology |
|---|---|
| Backend API | Ruby on Rails (PostgreSQL) |
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) |
| Auth | Devise + OmniAuth (Google SSO) |
| Authorization | Pundit |
| AI | Anthropic API — Claude, web search tool enabled |
| Background Jobs | Sidekiq |
| Rich Text | Tiptap |
| Wireframing | Excalidraw (embedded) |
| Hosting — API | Render or Railway |
| Hosting — Frontend | Vercel |

**Theme & Visual Design:** Light mode only. Main background: Tailwind `zinc-50`. Primary text: Tailwind `zinc-900`. No dark mode.

**Package manager:** pnpm for all Node.js workspaces (Turborepo, Next.js, Expo). Use `pnpm install`, `pnpm run build`, `pnpm run dev`, etc. from repo root or app directories.

**Shared assets:** Brand assets (app icon and logo SVGs) live in a shared package `packages/assets` and are consumed by the Next.js and Expo apps via workspace dependency. See [Shared assets plan](shared-assets-plan.md) for layout, usage (favicon, header, splash, etc.), and how to add more shared assets.

---

## URL Structure

```
/dashboard                               ← My Ideas + Shared With Me
/:username                               ← User profile page
/:username/:idea-slug                    ← Idea detail (defaults to /overview)
  /:username/:idea-slug/overview
  /:username/:idea-slug/brainstorm
  /:username/:idea-slug/analysis
  /:username/:idea-slug/wireframes
  /:username/:idea-slug/prd
  /:username/:idea-slug/prd/:version
  /:username/:idea-slug/notes
  /:username/:idea-slug/tasks
/settings
```

> Accessing an idea without permission returns **404** — never confirm the idea exists.

---

## Phase 1 — Foundation
**Timeline:** Weeks 1–2

Core infrastructure: auth, user model with username, idea ownership, and GitHub-style URL routing.

**Deliverable:** Users can sign in with Google, claim a username, create ideas, and invite collaborators. All idea pages are access-controlled and URL-scoped to the owner's username.

---

### Module 1.1 — Authentication
**Layer:** Backend · **Tech:** Rails, Devise, OmniAuth

**Tasks:**
- Google OAuth 2.0 via OmniAuth
- User model: `id`, `email`, `username`, `name`, `avatar_url`, `google_uid`, `bio`
- Username selection flow on first sign-in (unique, URL-safe)
- Session via secure cookie (Rails session store)
- Sign-out + redirect to marketing page

**Endpoints:**
```
POST   /auth/google
DELETE /auth/sign_out
GET    /auth/check_username
```

---

### Module 1.2 — Ideas CRUD
**Layer:** Backend · **Tech:** Rails, PostgreSQL

**Tasks:**
- Idea model: `user_id` (owner), `slug`, `title`, `description`, `status`, `visibility`
- Slug auto-generation from title (unique per user)
- Status enum: `brainstorm | validating | validated | shelved`
- Visibility enum: `private | shared`
- Ownership is immutable post-creation

**Endpoints:**
```
GET    /ideas
POST   /ideas
GET    /:username/:slug
PATCH  /:username/:slug
DELETE /:username/:slug
```

---

### Module 1.3 — Membership & Access Control
**Layer:** Backend · **Tech:** Rails, Pundit

**Tasks:**
- `IdeaMember`: `idea_id`, `user_id`, `role` (`collaborator|viewer`), `invited_by`, `accepted_at`
- `IdeaInvite`: `idea_id`, `email`, `token`, `role`, `expires_at` (7 days)
- Pundit policy: owner / collaborator / viewer permission matrix
- 404 on unauthorized access (never confirm idea existence)
- Access middleware on all idea-scoped routes

**Role Matrix:**

| Action | Owner | Collaborator | Viewer |
|---|:---:|:---:|:---:|
| Edit idea | ✓ | ✓ | — |
| Run analysis | ✓ | ✓ | — |
| Generate PRD | ✓ | ✓ | — |
| Export PRD | ✓ | ✓ | ✓ |
| Manage members | ✓ | — | — |
| Delete idea | ✓ | — | — |

**Endpoints:**
```
POST   /:username/:slug/members
DELETE /:username/:slug/members/:id
PATCH  /:username/:slug/members/:id
POST   /invites/:token/accept
```

---

### Module 1.4 — Dashboard + Navigation
**Layer:** Frontend · **Tech:** Next.js, Tailwind

**Tasks:**
- App shell: sidebar nav, user avatar, route slots
- Dashboard: "My Ideas" grid grouped by status
- Dashboard: "Shared With Me" section with owner attribution
- Idea cards: title, status badge, score ring, member avatars
- New idea modal: title + description, slug preview
- User profile page at `/:username` listing visible ideas

**Routes:** `/dashboard`, `/:username`, `/:username/:slug`

---

## Phase 2 — Core AI Value
**Timeline:** Weeks 2–3

Brainstorm chat and structured validation analysis — the primary reason to use the app.

**Deliverable:** Users can brainstorm with Claude (streamed), run full validation analysis with real web search data, and view structured results. All runs are versioned.

---

### Module 2.1 — Brainstorm Chat
**Layer:** AI / LLM · **Tech:** Claude API, Streaming, Rails SSE

**Tasks:**
- `BrainstormSession` model: `idea_id`, `user_id`, `messages` (jsonb)
- System prompt: critical thinking partner, not a cheerleader
- Streaming response via Server-Sent Events
- Suggested starter prompts on empty state
- Session history: archive old sessions, start new
- Pin message to Overview as key insight

**Endpoints:**
```
POST /:username/:slug/brainstorm/sessions
POST /:username/:slug/brainstorm/sessions/:id/messages   (SSE)
```

---

### Module 2.2 — Analysis Engine
**Layer:** AI / LLM · **Tech:** Claude API, Web Search Tool, Sidekiq

**Tasks:**
- `IdeaAnalysis` model: `idea_id`, `analysis_type`, `result` (jsonb), `created_at`
- Analysis types: `competitor | tam | pmf | full`
- Web search tool enabled on all Claude API calls
- Structured JSON output schema enforced
- Full report = competitor + tam + pmf in one job
- Run via Sidekiq background job; stream progress to frontend
- Versioned — retain all historical runs
- Users can annotate any analysis result

**Analysis Result Schema:**
```json
{
  "competitor_analysis": {
    "summary": "...",
    "competitors": [{ "name": "", "strengths": [], "weaknesses": [], "pricing": "" }],
    "saturation_score": 7,
    "whitespace": "..."
  },
  "market_size": {
    "tam_estimate": "$4.2B",
    "sam_estimate": "$380M",
    "confidence": "medium",
    "proxies_used": []
  },
  "pmf_signals": {
    "demand_evidence": "...",
    "pain_point_strength": "high",
    "willingness_to_pay_signals": "..."
  },
  "verdict": {
    "score": 78,
    "recommendation": "Proceed with Caution",
    "key_risks": [],
    "next_steps": []
  }
}
```

**Endpoints:**
```
POST /:username/:slug/analyses
GET  /:username/:slug/analyses
GET  /:username/:slug/analyses/:id
```

---

### Module 2.3 — Analysis UI
**Layer:** Frontend · **Tech:** Next.js, Recharts

**Tasks:**
- Analysis tab: run buttons per type, history version selector
- Verdict banner: score ring, recommendation, key risks
- Competitor cards: strengths/weaknesses tag chips, pricing
- TAM/SAM display with confidence indicator
- PMF signals: collapsible sections
- Next steps list
- Loading skeleton while job runs

---

## Phase 3 — Productivity Layer
**Timeline:** Weeks 3–4

Notes, tasks, wireframes, and PRD generation — the tools that make an idea actionable.

**Deliverable:** Ideas have a full productivity workspace: freeform notes, task tracking, Excalidraw wireframes, and AI-generated PRDs with Markdown/PDF export.

---

### Module 3.1 — Notes
**Layer:** Frontend · **Tech:** Tiptap, Rails

**Tasks:**
- `IdeaNote` model: `idea_id`, `user_id`, `content` (Tiptap JSON), `updated_at`
- Tiptap editor: headings, bold, italic, lists, links, code, blockquote
- Auto-save on change (debounced 1.5s)
- Last-saved timestamp display
- Single note per idea (not multi-doc)

**Endpoints:**
```
GET /:username/:slug/note
PUT /:username/:slug/note
```

---

### Module 3.2 — Tasks
**Layer:** Frontend · **Tech:** Next.js, Rails

**Tasks:**
- `IdeaTask` model: `idea_id`, `user_id`, `title`, `completed`, `due_date`
- Add task with optional due date
- Toggle complete — collapse completed to bottom section
- Delete task
- Ordered by `created_at`; drag-to-reorder is a stretch goal

**Endpoints:**
```
GET    /:username/:slug/tasks
POST   /:username/:slug/tasks
PATCH  /:username/:slug/tasks/:id
DELETE /:username/:slug/tasks/:id
```

---

### Module 3.3 — Wireframes
**Layer:** Frontend · **Tech:** Excalidraw, Rails

**Tasks:**
- `IdeaWireframe` model: `idea_id`, `user_id`, `title`, `canvas_data` (jsonb), `updated_at`
- Embed Excalidraw canvas (open source, no external account required)
- Multiple named frames per idea (sidebar list)
- Auto-save canvas state (debounced 2s)
- Description/caption per frame
- Viewer role: read-only canvas (no toolbar shown)

**Endpoints:**
```
GET   /:username/:slug/wireframes
POST  /:username/:slug/wireframes
PATCH /:username/:slug/wireframes/:id
```

---

### Module 3.4 — PRD Generator
**Layer:** AI / LLM · **Tech:** Claude API, Streaming, pdf-lib

**Tasks:**
- `IdeaPRD` model: `idea_id`, `user_id`, `content` (Markdown), `version` (int), `generated_at`, `updated_at`
- Generate PRD from idea context: title + description + brainstorm history + analysis results + notes
- Stream generation into live Markdown preview
- Unfilled sections flagged as `[Needs input]` — no hallucination
- Split-pane: Markdown source + rendered preview
- Per-section regeneration without replacing full document
- Version history: retain all versions, show AI-generated diff summary between versions
- Export: Markdown (`.md` download), PDF (server-side render)
- PRD public share link (revocable by owner)

**Endpoints:**
```
POST /:username/:slug/prds                              (SSE)
GET  /:username/:slug/prds
GET  /:username/:slug/prds/:version
GET  /:username/:slug/prds/:version/export?format=md|pdf
```

---

## Phase 4 — Polish & Beta
**Timeline:** Week 5

Invite-only beta launch. Responsive polish, empty states, error handling, and onboarding flow.

**Deliverable:** App is stable, responsive, and invite-gated. Friends can onboard, create ideas, and collaborate. Beta feedback loop established.

---

### Module 4.1 — Onboarding Flow
**Layer:** Frontend · **Tech:** Next.js

**Tasks:**
- Post-signup username selection screen (validated, URL-safe)
- First idea creation wizard (title → description → status)
- Empty state CTAs on all tabs
- Welcome banner with suggested first actions

---

### Module 4.2 — Responsive & Error Polish
**Layer:** Frontend · **Tech:** Next.js, Tailwind

**Tasks:**
- Mobile-responsive layout passes for all pages
- Loading skeletons for all async data
- Error boundaries with retry affordances
- Optimistic UI on task toggle and note save
- Toast notification system (invite accepted, analysis complete)
- 404 and access-denied page designs

---

### Module 4.3 — Beta Access & Invite Gate
**Layer:** Backend · **Tech:** Rails, Action Mailer

**Tasks:**
- Allowlist table: `email → invited_by, used_at`
- Beta invite email via Action Mailer
- Waitlist form on marketing page
- Admin endpoint to grant/revoke beta access
- Invite email for idea collaborators (non-registered users)
- In-app notification: pending idea invite banner

**Endpoints:**
```
POST /waitlist
POST /admin/invites
GET  /invites/:token
```

---

## Module Summary

| Phase | Module | Layer | Tech | Tasks |
|---|---|---|---|:---:|
| 1 | Authentication | Backend | Rails, Devise, OmniAuth | 5 |
| 1 | Ideas CRUD | Backend | Rails, PostgreSQL | 5 |
| 1 | Membership & Access Control | Backend | Rails, Pundit | 5 |
| 1 | Dashboard + Navigation | Frontend | Next.js, Tailwind | 6 |
| 2 | Brainstorm Chat | AI / LLM | Claude API, SSE | 6 |
| 2 | Analysis Engine | AI / LLM | Claude API, Sidekiq | 8 |
| 2 | Analysis UI | Frontend | Next.js, Recharts | 7 |
| 3 | Notes | Frontend | Tiptap, Rails | 5 |
| 3 | Tasks | Frontend | Next.js, Rails | 5 |
| 3 | Wireframes | Frontend | Excalidraw, Rails | 6 |
| 3 | PRD Generator | AI / LLM | Claude API, pdf-lib | 9 |
| 4 | Onboarding Flow | Frontend | Next.js | 4 |
| 4 | Responsive & Error Polish | Frontend | Next.js, Tailwind | 6 |
| 4 | Beta Access & Invite Gate | Backend | Rails, Action Mailer | 6 |

**Total: 4 phases · 14 modules · 83 tasks**
