# IdeaMode — High-Level Design

**Version:** 2.0  
**Domain:** ideamode.ai  
**Stack:** Rails API + Next.js  
**Last Updated:** March 2026

---

## Overview

Five phased milestones from foundation to beta. The app is built around two core models — **Brainstorms** (exploratory workspaces with AI chat, notes, and light research) and **Ideas** (structured validation with analysis, wireframes, tasks, and PRD generation). Ideas can optionally originate from a brainstorm (linked via `brainstorm_id`) or be created independently.

Both models follow a GitHub-style ownership model — each belongs to a single user, is URL-scoped to that user's username, and can be shared with others as collaborators or viewers. AI runs throughout: brainstorm chat, brainstorm research, idea discussion chat, validation analysis, and PRD generation all use the Claude API with streaming.

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
/dashboard                               ← Brainstorms tab + Ideas tab

/:username                               ← User profile page

Brainstorm routes:
/:username/:brainstorm-slug              ← Brainstorm detail (defaults to /overview)
  /:username/:brainstorm-slug/overview
  /:username/:brainstorm-slug/chat
  /:username/:brainstorm-slug/research
  /:username/:brainstorm-slug/notes

Idea routes:
/:username/:idea-slug                    ← Idea detail (defaults to /overview)
  /:username/:idea-slug/overview
  /:username/:idea-slug/discussion
  /:username/:idea-slug/analysis
  /:username/:idea-slug/wireframes
  /:username/:idea-slug/prd
  /:username/:idea-slug/prd/:version
  /:username/:idea-slug/notes
  /:username/:idea-slug/tasks

/settings
```

> Brainstorm and idea slugs share the same namespace per user. The backend resolves by checking both tables. Accessing without permission returns **404** — never confirm existence.

---

## Phase 1 — Foundation
**Timeline:** Weeks 1–2

Core infrastructure: auth, user model with username, brainstorm and idea ownership, GitHub-style URL routing, and slug resolution across both models.

**Deliverable:** Users can sign in with Google, claim a username, create brainstorms and ideas, and invite collaborators. All pages are access-controlled and URL-scoped to the owner's username. Dashboard has two tabs: Brainstorms and Ideas.

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

### Module 1.2 — Brainstorms CRUD
**Layer:** Backend · **Tech:** Rails, PostgreSQL

**Tasks:**
- Brainstorm model: `user_id` (owner), `slug`, `title`, `description`, `status`, `visibility`
- Slug auto-generation from title (unique per user, shared namespace with ideas)
- Status enum: `exploring | researching | ready | archived`
- Visibility enum: `private | shared`
- Ownership is immutable post-creation

**Endpoints:**
```
GET    /brainstorms
POST   /brainstorms
GET    /:username/:slug
PATCH  /:username/:slug
DELETE /:username/:slug
```

---

### Module 1.3 — Ideas CRUD
**Layer:** Backend · **Tech:** Rails, PostgreSQL

**Tasks:**
- Idea model: `user_id` (owner), `brainstorm_id` (nullable FK → Brainstorm), `slug`, `title`, `description`, `status`, `visibility`
- Slug auto-generation from title (unique per user, shared namespace with brainstorms)
- Status enum: `validating | validated | shelved`
- Visibility enum: `private | shared`
- Ownership is immutable post-creation
- Slug resolution middleware: check both brainstorms and ideas tables for a given `/:username/:slug`

**Endpoints:**
```
GET    /ideas
POST   /ideas
GET    /:username/:slug
PATCH  /:username/:slug
DELETE /:username/:slug
```

---

### Module 1.4 — Membership & Access Control
**Layer:** Backend · **Tech:** Rails, Pundit

**Tasks:**
- `BrainstormMember`: `brainstorm_id`, `user_id`, `role` (`collaborator|viewer`), `invited_by`, `accepted_at`
- `BrainstormInvite`: `brainstorm_id`, `email`, `token`, `role`, `expires_at` (7 days)
- `IdeaMember`: `idea_id`, `user_id`, `role` (`collaborator|viewer`), `invited_by`, `accepted_at`
- `IdeaInvite`: `idea_id`, `email`, `token`, `role`, `expires_at` (7 days)
- Pundit policies for both brainstorms and ideas: owner / collaborator / viewer permission matrix
- 404 on unauthorized access (never confirm existence)
- Access middleware on all brainstorm- and idea-scoped routes

**Role Matrix (applies to both brainstorms and ideas):**

| Action | Owner | Collaborator | Viewer |
|---|:---:|:---:|:---:|
| Edit content | ✓ | ✓ | — |
| Run research (brainstorms) | ✓ | ✓ | — |
| Run analysis (ideas) | ✓ | ✓ | — |
| Generate PRD (ideas) | ✓ | ✓ | — |
| Export PRD (ideas) | ✓ | ✓ | ✓ |
| Create idea from brainstorm | ✓ | — | — |
| Manage members | ✓ | — | — |
| Delete | ✓ | — | — |

**Endpoints:**
```
POST   /:username/:slug/members
DELETE /:username/:slug/members/:id
PATCH  /:username/:slug/members/:id
POST   /invites/:token/accept
```

---

### Module 1.5 — Dashboard + Navigation
**Layer:** Frontend · **Tech:** Next.js, Tailwind

**Tasks:**
- App shell: sidebar nav, user avatar, route slots
- Dashboard with two top-level tabs: **Brainstorms** and **Ideas**
- Brainstorms tab: "My Brainstorms" grid grouped by status (Exploring → Researching → Ready → Archived) + "Shared With Me" section
- Ideas tab: "My Ideas" grid grouped by status (Validating → Validated → Shelved) + "Shared With Me" section
- Brainstorm cards: title, status badge, member avatars, last updated
- Idea cards: title, status badge, score ring, member avatars, linked brainstorm indicator
- New brainstorm modal: title + description, slug preview
- New idea modal: title + description, slug preview
- Brainstorm detail shell with tabs (Overview, Chat, Research, Notes)
- Idea detail shell with tabs (Overview, Discussion, Analysis, Wireframes, PRD, Notes, Tasks)
- User profile page at `/:username` listing visible brainstorms and ideas

**Routes:** `/dashboard`, `/:username`, `/:username/:slug`

---

## Phase 2 — Brainstorm Features
**Timeline:** Weeks 2–3

Brainstorm-specific AI features — the exploratory workspace that differentiates IdeaMode. Built first so users can start exploring concepts immediately.

**Deliverable:** Users can chat with Claude in an exploratory mode, run lightweight research queries, take notes within a brainstorm, and create an idea from a brainstorm with context carried over.

---

### Module 2.1 — Brainstorm Chat
**Layer:** AI / LLM · **Tech:** Claude API, Streaming, Rails SSE

**Tasks:**
- `ChatSession` model: `brainstorm_id` (nullable), `idea_id` (nullable), `user_id`, `messages` (jsonb) — check constraint: exactly one of `brainstorm_id` or `idea_id` must be set
- System prompt: creative thinking partner — exploratory and curious, not evaluative
- Streaming response via Server-Sent Events
- Suggested starter prompts on empty state (e.g. "I have a rough idea — help me think it through")
- Session history: archive old sessions, start new
- Pin message to Overview as key insight

**Endpoints:**
```
POST /:username/:slug/chat/sessions
POST /:username/:slug/chat/sessions/:id/messages   (SSE)
GET  /:username/:slug/chat/sessions
```

---

### Module 2.2 — Brainstorm Research
**Layer:** AI / LLM · **Tech:** Claude API, Web Search Tool

**Tasks:**
- `BrainstormResearch` model: `brainstorm_id`, `research_type`, `query`, `result` (jsonb), `created_at`
- Research types: `market_lookup | competitor_spot | trend_signal`
- Web search tool enabled on all Claude API calls
- Lightweight structured output — simpler than full idea analysis
- Each query saved with result — research history viewable
- Results render in simple, readable UI components

**Endpoints:**
```
POST /:username/:slug/research
GET  /:username/:slug/research
GET  /:username/:slug/research/:id
```

---

### Module 2.3 — Brainstorm Notes
**Layer:** Frontend · **Tech:** Tiptap, Rails

**Tasks:**
- `BrainstormNote` model: `brainstorm_id`, `user_id`, `content` (Tiptap JSON), `updated_at`
- Tiptap editor: headings, bold, italic, lists, links, code, blockquote
- Auto-save on change (debounced 1.5s)
- Last-saved timestamp display
- Single note per brainstorm

**Endpoints:**
```
GET /:username/:slug/note
PUT /:username/:slug/note
```

---

### Module 2.4 — Create Idea from Brainstorm
**Layer:** Full Stack · **Tech:** Rails, Next.js

**Tasks:**
- "Create Idea" action on brainstorm Overview tab (owner only)
- Modal pre-populated with brainstorm title + description (editable)
- Slug preview auto-generated from title
- Checkboxes to optionally carry over brainstorm members
- On creation: sets `brainstorm_id` on the new idea
- Brainstorm remains fully usable after idea creation
- Idea Overview shows "From Brainstorm" link to source

**Endpoints:**
```
POST /:username/:brainstorm-slug/create-idea
```

---

### Module 2.5 — Brainstorm Research UI
**Layer:** Frontend · **Tech:** Next.js, Tailwind

**Tasks:**
- Research tab: action buttons per research type (Market Lookup, Competitor Spot, Trend Signal)
- Research history list with timestamps
- Result cards: summary, links, key takeaways
- Loading skeleton while research runs

---

## Phase 3 — Idea AI Value
**Timeline:** Weeks 3–4

Discussion chat and structured validation analysis — the core reason to move from brainstorm to idea.

**Deliverable:** Users can discuss ideas with Claude (critical/evaluative mode, streamed), run full validation analysis with real web search data, and view structured results. All runs are versioned. If the idea was created from a brainstorm, context carries over into discussion and analysis prompts.

---

### Module 3.1 — Discussion Chat
**Layer:** AI / LLM · **Tech:** Claude API, Streaming, Rails SSE

**Tasks:**
- Reuses `ChatSession` model with `idea_id` set (same table as brainstorm chat)
- System prompt: critical thinking partner — pressure-tests assumptions, not a cheerleader
- If idea has a linked brainstorm, system prompt includes brainstorm chat history and notes as context
- Streaming response via Server-Sent Events
- Suggested starter prompts on empty state (e.g. "What assumptions am I making that could be wrong?")
- Session history: archive old sessions, start new
- Pin message to Overview as key insight

**Endpoints:**
```
POST /:username/:slug/discussion/sessions
POST /:username/:slug/discussion/sessions/:id/messages   (SSE)
GET  /:username/:slug/discussion/sessions
```

---

### Module 3.2 — Analysis Engine
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
- If idea has a linked brainstorm, research results are included as context

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

### Module 3.3 — Analysis UI
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

## Phase 4 — Productivity Layer
**Timeline:** Weeks 4–5

Notes, tasks, wireframes, and PRD generation — the tools that make an idea actionable.

**Deliverable:** Ideas have a full productivity workspace: freeform notes, task tracking, Excalidraw wireframes, and AI-generated PRDs (with brainstorm context when linked) with Markdown/PDF export.

---

### Module 4.1 — Notes (Ideas)
**Layer:** Frontend · **Tech:** Tiptap, Rails

**Tasks:**
- `IdeaNote` model: `idea_id`, `user_id`, `content` (Tiptap JSON), `updated_at`
- Tiptap editor: headings, bold, italic, lists, links, code, blockquote
- Auto-save on change (debounced 1.5s)
- Last-saved timestamp display
- Single note per idea (not multi-doc)
- Same editor component as brainstorm notes (Module 2.3) — shared component, different data source

**Endpoints:**
```
GET /:username/:slug/note
PUT /:username/:slug/note
```

---

### Module 4.2 — Tasks
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

### Module 4.3 — Wireframes
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

### Module 4.4 — PRD Generator
**Layer:** AI / LLM · **Tech:** Claude API, Streaming, pdf-lib

**Tasks:**
- `IdeaPRD` model: `idea_id`, `user_id`, `content` (Markdown), `version` (int), `generated_at`, `updated_at`
- Generate PRD from idea context: title + description + discussion history + analysis results + notes
- If idea has a linked brainstorm: include brainstorm chat history, notes, and research results as additional context
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

## Phase 5 — Polish & Beta
**Timeline:** Week 6

Invite-only beta launch. Responsive polish, empty states, error handling, and onboarding flow.

**Deliverable:** App is stable, responsive, and invite-gated. Friends can onboard, create brainstorms and ideas, and collaborate. Beta feedback loop established.

---

### Module 5.1 — Onboarding Flow
**Layer:** Frontend · **Tech:** Next.js

**Tasks:**
- Post-signup username selection screen (validated, URL-safe)
- First brainstorm or idea creation wizard (title → description → status)
- Empty state CTAs on all tabs (brainstorms and ideas)
- Welcome banner with suggested first actions: "Start a Brainstorm" or "Create an Idea"

---

### Module 5.2 — Responsive & Error Polish
**Layer:** Frontend · **Tech:** Next.js, Tailwind

**Tasks:**
- Mobile-responsive layout passes for all pages
- Loading skeletons for all async data
- Error boundaries with retry affordances
- Optimistic UI on task toggle and note save
- Toast notification system (invite accepted, analysis complete)
- 404 and access-denied page designs

---

### Module 5.3 — Beta Access & Invite Gate
**Layer:** Backend · **Tech:** Rails, Action Mailer

**Tasks:**
- Allowlist table: `email → invited_by, used_at`
- Beta invite email via Action Mailer
- Waitlist form on marketing page
- Admin endpoint to grant/revoke beta access
- Invite email for brainstorm and idea collaborators (non-registered users)
- In-app notification: pending brainstorm/idea invite banner

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
| 1 | 1.1 Authentication | Backend | Rails, Devise, OmniAuth | 5 |
| 1 | 1.2 Brainstorms CRUD | Backend | Rails, PostgreSQL | 5 |
| 1 | 1.3 Ideas CRUD | Backend | Rails, PostgreSQL | 6 |
| 1 | 1.4 Membership & Access Control | Backend | Rails, Pundit | 7 |
| 1 | 1.5 Dashboard + Navigation | Frontend | Next.js, Tailwind | 11 |
| 2 | 2.1 Brainstorm Chat | AI / LLM | Claude API, SSE | 6 |
| 2 | 2.2 Brainstorm Research | AI / LLM | Claude API, Web Search | 6 |
| 2 | 2.3 Brainstorm Notes | Frontend | Tiptap, Rails | 5 |
| 2 | 2.4 Create Idea from Brainstorm | Full Stack | Rails, Next.js | 7 |
| 2 | 2.5 Brainstorm Research UI | Frontend | Next.js, Tailwind | 4 |
| 3 | 3.1 Discussion Chat | AI / LLM | Claude API, SSE | 7 |
| 3 | 3.2 Analysis Engine | AI / LLM | Claude API, Sidekiq | 9 |
| 3 | 3.3 Analysis UI | Frontend | Next.js, Recharts | 7 |
| 4 | 4.1 Notes (Ideas) | Frontend | Tiptap, Rails | 6 |
| 4 | 4.2 Tasks | Frontend | Next.js, Rails | 5 |
| 4 | 4.3 Wireframes | Frontend | Excalidraw, Rails | 6 |
| 4 | 4.4 PRD Generator | AI / LLM | Claude API, pdf-lib | 10 |
| 5 | 5.1 Onboarding Flow | Frontend | Next.js | 4 |
| 5 | 5.2 Responsive & Error Polish | Frontend | Next.js, Tailwind | 6 |
| 5 | 5.3 Beta Access & Invite Gate | Backend | Rails, Action Mailer | 6 |

**Total: 5 phases · 20 modules · 121 tasks**
