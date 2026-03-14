# IdeaMode — Product Requirements Document

**Version:** 2.0  
**Author:** Court  
**Domain:** ideamode.ai  
**Status:** Draft  
**Last Updated:** March 2026

---

## 1. Overview

IdeaMode is a web application for capturing, developing, and validating business and product ideas. It combines a structured brainstorming environment with AI-powered validation tools — including competitor analysis, market sizing, and product-market fit assessment — alongside lightweight project management, wireframing, and PRD generation.

Structurally, IdeaMode follows a **GitHub-style ownership model**: an idea belongs to exactly one user (the owner), lives at a URL scoped to that user's username (e.g. `ideamode.ai/court/my-saas-idea`), and can be shared with others as collaborators (read + write) or viewers (read-only). Ownership is singular and immutable. Access is always explicitly granted by the owner — never inherited.

The goal is to give founders, product managers, and indie developers a single place to take an idea from raw intuition to a well-reasoned go/no-go decision, with a permanent record of everything along the way.

---

## 2. Problem Statement

Evaluating a new idea is time-consuming, unstructured, and prone to confirmation bias. Most people either overthink early-stage ideas with too much process, or under-examine them and build the wrong thing. Existing tools are fragmented — market research lives in one place, notes in another, wireframes in a third — and there's no connective tissue between them.

IdeaMode brings all of this into one coherent workflow, and structures ownership the way developers already think about it: one owner, explicit collaborators, URL-addressable artifacts.

---

## 3. Target Users

**Primary:** Solo founders and indie developers evaluating multiple side project or product ideas simultaneously. They need a fast, honest gut-check before investing weeks of work.

**Secondary:** Product managers at small-to-mid-size companies who need to vet new product line concepts and produce shareable validation artifacts (analysis, PRDs) for stakeholders.

**Initial launch:** Friends and early testers — closed beta, invite-based access only.

---

## 4. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Help users evaluate ideas faster | Time from idea creation to completed analysis < 10 minutes |
| Reduce confirmation bias | Users report validation surfaced risks they hadn't considered |
| Become a regular part of users' ideation workflow | Weekly active usage among beta users |
| Enable sharing and collaboration | At least one member added per idea on average |
| Produce useful PRD artifacts | PRD export used at least once per validated idea |

---

## 5. Scope

### In Scope (v1)
- User accounts with Google SSO and unique usernames
- GitHub-style idea ownership: one owner, explicit member access via `IdeaMember`
- User-scoped idea URLs: `/:username/:idea-slug`
- User profile pages at `/:username`
- Idea creation, status tracking, and slug management
- AI-powered brainstorm chat per idea (streaming)
- Structured AI validation analysis: competitors, TAM, PMF, full report
- Notes (Tiptap rich text)
- Task tracking per idea
- Wireframe creation tool per idea (Excalidraw)
- AI-generated PRD with Markdown and PDF export
- Collaborator invites with role-based access control

### Out of Scope (v1)
- Mobile app
- Public idea discovery feed
- Integrations (Notion, Jira, Slack)
- Billing / paid tiers
- Real-time collaborative editing
- Username changes
- Idea ownership transfer

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Ruby on Rails (PostgreSQL) |
| Frontend | Next.js (App Router, TypeScript, Tailwind CSS) |
| Authentication | Devise + OmniAuth (Google SSO) |
| Authorization | Pundit |
| AI | Anthropic API (Claude, with web search tool enabled) |
| Background Jobs | Sidekiq |
| Rich Text | Tiptap |
| Wireframing | Excalidraw (embedded open-source canvas) |
| Hosting — API | Render or Railway |
| Hosting — Frontend | Vercel |

---

## 7. Ownership & Access Model

### Core Principle

Ideas follow the same ownership model as GitHub repositories. One user owns an idea. Others can be granted access by the owner. The owner's username is always in the URL, regardless of who is viewing.

```
User
 └── owns many Ideas  (user_id on Idea, immutable)
      └── IdeaMember  (join table — grants access to other Users)
           roles: collaborator | viewer
```

### Role Definitions

| Role | How Assigned | Capabilities |
|---|---|---|
| **Owner** | Creator of the idea — permanent | Full access: edit, delete, manage members, all tabs |
| **Collaborator** | Explicitly invited by owner | Read + write: edit notes, tasks, wireframes, run analysis, participate in brainstorm, generate PRD. Cannot manage members or delete the idea |
| **Viewer** | Explicitly invited by owner | Read-only: view all tabs, export PRD and analysis. Cannot edit anything |

### Key Behaviours

- Ownership is **immutable** after creation — cannot be transferred in v1
- A user can be a member of many ideas across many different owners
- Idea URLs are always scoped to the owner: `/:username/:idea-slug`
- Members access an idea at the **owner's URL**, not their own
- Accessing an idea without permission returns **404** — never 403, never confirm the idea exists
- Viewers see a lock indicator in the header; edit controls are hidden entirely, not just disabled
- Collaborators cannot invite additional members — only the owner can

---

## 8. Data Model

### User
| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | string | Unique |
| username | string | Unique, URL-safe — set at signup, not changeable in v1 |
| name | string | Display name |
| avatar_url | string | From Google profile |
| google_uid | string | OAuth identifier |
| bio | string | Optional, shown on profile page |
| created_at | timestamp | |

### Idea
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → User (owner) — immutable after creation |
| slug | string | URL-safe, unique per user — auto-generated from title, editable by owner |
| title | string | |
| description | text | |
| status | enum | `brainstorm`, `validating`, `validated`, `shelved` |
| visibility | enum | `private` (default), `shared` (accessible to IdeaMembers only — no fully public ideas in v1) |
| created_at / updated_at | timestamp | |

### IdeaMember
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| user_id | uuid | FK → User (the member — never the owner) |
| role | enum | `collaborator`, `viewer` |
| invited_by | uuid | FK → User (always the owner in v1) |
| accepted_at | timestamp | Null until invite is accepted |
| created_at | timestamp | |

### IdeaInvite
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| invited_by | uuid | FK → User (owner) |
| email | string | Invitee email — may not yet be a registered user |
| role | enum | `collaborator`, `viewer` |
| token | string | Unique secure token for invite link |
| accepted_at | timestamp | Null until accepted |
| expires_at | timestamp | 7-day expiry |

### IdeaAnalysis
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| analysis_type | enum | `competitor`, `tam`, `pmf`, `full` |
| result | jsonb | Structured AI output |
| created_at | timestamp | Versioned — multiple runs retained |

### BrainstormSession
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| user_id | uuid | FK → User |
| messages | jsonb | Full chat history array |
| created_at | timestamp | |

### IdeaNote
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| user_id | uuid | FK → User (last editor) |
| content | text | Rich text (Tiptap JSON) |
| updated_at | timestamp | |

### IdeaTask
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| user_id | uuid | FK → User (creator) |
| title | string | |
| completed | boolean | Default false |
| due_date | date | Optional |

### IdeaWireframe
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| user_id | uuid | FK → User (creator) |
| title | string | e.g. "Onboarding Flow", "Dashboard" |
| canvas_data | jsonb | Excalidraw scene JSON |
| updated_at | timestamp | |

### IdeaPRD
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| idea_id | uuid | FK → Idea |
| user_id | uuid | FK → User (generator) |
| title | string | e.g. "IdeaMode PRD v1" |
| content | text | Markdown source generated by AI |
| version | integer | Auto-incremented per idea |
| generated_at | timestamp | |
| updated_at | timestamp | Tracks manual edits after generation |

---

## 9. Features & Requirements

---

### 9.1 Authentication & Onboarding

**Description:** Users sign in with Google. On first sign-in, they choose a username that becomes the permanent namespace for all their ideas.

**Requirements:**
- Sign in / sign up via Google OAuth 2.0
- On first sign-in, redirect to username selection screen before entering the app
- Username must be unique, URL-safe, and 3–30 characters. Validation is real-time
- Username is permanent — not changeable in v1
- Session persists via secure cookie (Rails session store)
- Sign out clears session and redirects to marketing/login page

---

### 9.2 Dashboard

**Description:** The home screen after login. Two clear sections: ideas the user owns, and ideas shared with them.

**Requirements:**
- **My Ideas** section: responsive card grid of all ideas owned by the current user, grouped by status: Brainstorm → Validating → Validated → Shelved
- **Shared With Me** section: ideas where the current user is a collaborator or viewer, showing the owner's avatar and username
- Idea cards show: title, owner (if shared), status badge, validation score ring (if run), member avatars, last updated
- "New Idea" button opens a modal: title, optional description, slug preview (auto-generated, editable)
- Filter/sort by status, last updated, score
- Empty state with clear prompt to create first idea

---

### 9.3 User Profile

**Description:** Every user has a profile page at `/:username`, analogous to a GitHub user page.

**Requirements:**
- Shows: avatar, display name, `@username`, bio, and a list of their ideas
- Ideas shown depend on the viewer's relationship: owners see all their own ideas; other logged-in users only see ideas the owner has explicitly shared with them
- Unauthenticated access to profile pages is out of scope for v1
- Owner edits their display name, bio, and avatar from `/settings`

---

### 9.4 Idea Detail

**Description:** The core workspace for a single idea. Tab-based layout under a persistent header showing the breadcrumb, title, status, score, and members.

**Breadcrumb format:** `@owner / idea-slug`

**Tabs:**
1. Overview
2. Brainstorm
3. Analysis
4. Wireframes
5. PRD
6. Notes
7. Tasks

**Overview Tab Requirements:**
- Editable title and description (inline — owner and collaborators only)
- Status selector (owner only)
- Validation score badge (if analysis has been run) — numeric score, color-coded
- Members panel: lists owner (marked Owner) and all IdeaMembers with role badges. Owner can invite, change roles, and remove members. Collaborators and viewers see the list but cannot modify it
- Ownership attribution: "Owned by @username"
- Created date, last updated

---

### 9.5 Brainstorm

**Description:** A conversational AI interface to help the user think through an idea before running formal validation. Designed to pressure-test assumptions, not validate them.

**Requirements:**
- Chat interface with Claude (streaming via SSE)
- System prompt primes Claude as a critical thinking partner — asks hard questions, surfaces assumptions, helps articulate the problem and target customer. Not a cheerleader
- Suggested starter prompts on empty state:
  - "Help me articulate the core problem this solves"
  - "What assumptions am I making that could be wrong?"
  - "Who is the ideal first customer for this?"
  - "What would make this idea fail?"
- Chat history persisted per session; users can start a new session (previous sessions archived and viewable)
- Users can pin any message as a key insight — pinned insights appear on the Overview tab
- Collaborators can view and participate in brainstorm sessions; viewer access is read-only

---

### 9.6 Analysis

**Description:** Structured AI-powered validation reports. Results are saved and versioned so users can re-run and compare over time.

**Analysis Types:**

**Competitor Analysis** — Identifies direct and indirect competitors. For each: name, URL, positioning, strengths, weaknesses, pricing (if discoverable). Overall saturation score (1–10) and whitespace summary.

**Market Size (TAM)** — TAM and SAM estimates with confidence rating (Low / Medium / High). Proxy signals used (search volume, App Store data, referenced reports). Transparent data limitations.

**Product-Market Fit Signals** — Evidence of existing demand (search trends, Reddit/forum sentiment, App Store reviews). Pain point strength assessment. Willingness-to-pay signals. Comparable app traction.

**Full Validation Report** — Runs all three above. Produces an overall validation score (0–100), a verdict (Go / Proceed with Caution / No-Go), top 3 risks, and top 3 recommended next steps.

**Requirements:**
- Each analysis type is a separate button; Full Report runs all at once
- AI uses web search to gather real-time signals — not purely trained knowledge
- Results render in structured UI components, not raw text
- Each run is timestamped and retained — version history viewable
- Users can annotate any result with freeform notes
- Collaborators can run analysis and annotate; viewers can view and export

**Analysis Result JSON Schema:**
```json
{
  "competitor_analysis": {
    "summary": "...",
    "competitors": [
      { "name": "", "url": "", "positioning": "", "strengths": [], "weaknesses": [], "pricing": "" }
    ],
    "saturation_score": 7,
    "whitespace": "..."
  },
  "market_size": {
    "tam_estimate": "$4.2B",
    "sam_estimate": "$380M",
    "confidence": "medium",
    "proxies_used": [],
    "data_limitations": "..."
  },
  "pmf_signals": {
    "demand_evidence": "...",
    "pain_point_strength": "high",
    "willingness_to_pay_signals": "...",
    "comparable_traction": "..."
  },
  "verdict": {
    "score": 72,
    "recommendation": "Proceed with Caution",
    "key_risks": [],
    "next_steps": []
  }
}
```

---

### 9.7 Wireframes

**Description:** An Excalidraw canvas embedded per idea for sketching flows and screens without leaving IdeaMode.

**Requirements:**
- Embed Excalidraw (open source — no external account required)
- Multiple named wireframes per idea (e.g. "Onboarding Flow", "Dashboard", "Pricing Page")
- Wireframes listed in a sidebar; clicking one loads it in the canvas
- Canvas auto-saves to the database (debounced, 2 seconds of inactivity)
- Each wireframe has an optional description/caption
- Collaborators can view and edit; viewers see a read-only canvas with no toolbar

---

### 9.8 PRD Generator

**Description:** AI-generated product requirements documents synthesized from everything captured in the idea — brainstorm sessions, analysis results, notes, and description. Users can generate, edit, version, and export a full PRD without leaving IdeaMode.

**Generation:**
- "Generate PRD" triggers Claude to synthesize a structured PRD using all available idea context
- Output streams into a live Markdown preview
- Each generation creates a new versioned document (v1, v2, v3...) — all versions are retained
- Sections without sufficient context are flagged as `[Needs input]` — Claude never halluculates placeholder content

**Editing:**
- After generation the PRD is editable in a split-pane: Markdown source (left), rendered preview (right)
- Auto-saves with last-saved timestamp
- Users can regenerate specific sections without replacing the whole document

**Versioning:**
- Version history panel with timestamp and AI-generated diff summary per version (e.g. "Added tech stack section, updated scope")
- Users can restore any previous version

**Export:**
- Export as Markdown (`.md` download)
- Export as PDF (server-side rendered)
- Export as DOCX (Word — v1 stretch goal)
- Exported filename format: `{idea-slug}-prd-v{n}.{ext}`

**Sharing:**
- Owner can generate a revocable read-only public share link for the latest PRD version
- Collaborators can edit the PRD; viewers can read and export

**PRD Template (AI output follows this structure):**
```
# {Idea Title} — Product Requirements Document

## 1. Overview
## 2. Problem Statement
## 3. Target Users
## 4. Goals & Success Metrics
## 5. Scope
## 6. Features & Requirements
## 7. Tech Stack
## 8. Data Model
## 9. Navigation & Information Architecture
## 10. UI/UX Principles
## 11. Phased Build Plan
## 12. Open Questions
## 13. Future Considerations
```

---

### 9.9 Notes

**Description:** A freeform rich text scratchpad per idea for research, links, and thoughts.

**Requirements:**
- Tiptap-based editor: headings, bold, italic, bullet lists, numbered lists, links, code blocks, blockquotes
- Single note per idea — not a multi-document system
- Auto-saves on change (debounced)
- Last saved timestamp visible
- Collaborators can edit; viewers read-only

---

### 9.10 Tasks

**Description:** A lightweight to-do list per idea for tracking validation actions and next steps.

**Requirements:**
- Add tasks with a title and optional due date
- Toggle complete — completed tasks collapse to a "Completed" section (expandable)
- Delete task
- Ordered by creation date; drag-to-reorder is a stretch goal
- No assignees in v1
- Collaborators can add/edit/complete tasks; viewers read-only

---

### 9.11 Membership Management

**Description:** Owner-controlled access management. Mirrors GitHub's collaborator invite flow.

**Requirements:**
- Owner invites members by email from the Overview tab members panel
- If the email matches an existing user, an `IdeaMember` record is created (`accepted_at: null`) and the user receives an in-app notification and email
- If no account exists, an `IdeaInvite` is created and a signup link with a pre-attached token is emailed
- Invites expire after 7 days; owner can resend
- Pending invites show a banner on the idea page until accepted
- Owner can change a member's role at any time (collaborator ↔ viewer)
- Owner can remove a member at any time — access revoked immediately
- Members can leave an idea themselves
- Only the owner can invite members — collaborators cannot

---

## 10. Navigation & Information Architecture

```
/ (Marketing / Login)
/dashboard                               ← My Ideas + Shared With Me
/:username                               ← User profile page
/:username/:idea-slug                    ← Idea detail (defaults to overview)
  /:username/:idea-slug/overview
  /:username/:idea-slug/brainstorm
  /:username/:idea-slug/analysis
  /:username/:idea-slug/wireframes
  /:username/:idea-slug/prd
  /:username/:idea-slug/prd/:version
  /:username/:idea-slug/notes
  /:username/:idea-slug/tasks
/settings                                ← Profile, account, notifications
```

**URL rules:**
- Ideas always live at `/:username/:idea-slug` — the owner's username is in the URL regardless of who is viewing
- Slugs are auto-generated from the title on creation; editable by the owner
- Accessing an idea without permission returns **404** — not 403, never confirm the idea exists

---

## 11. UI/UX Principles

- **Light mode only.** No dark mode. Main background: Tailwind `zinc-50`. Primary text: Tailwind `zinc-900`.
- **Thinking partner, not a report generator.** The tone and UX should feel like a smart collaborator, not a corporate audit tool. Minimal chrome, focus on content.
- **GitHub mental model.** Users who have used GitHub will immediately understand the ownership and access patterns. Lean into familiar conventions: breadcrumbs with `@owner / idea-slug`, explicit role labels, 404 on unauthorized.
- **Progressive disclosure.** Don't overwhelm on first load. Surface complexity as the user needs it.
- **Honest AI.** Analysis output is transparent about confidence levels and data gaps. Never present uncertain data as certain. `[Needs input]` is always preferable to a hallucinated section.
- **Fast.** All AI features stream results so the interface feels responsive even for long operations.
- **No dead ends.** Every empty state has a clear, contextual next action.

---

## 12. Phased Build Plan

### Phase 1 — Foundation (Weeks 1–2)
- Rails API: Google SSO, User model with username, Ideas CRUD with user-scoped slugs
- `IdeaMember` + `IdeaInvite` models, Pundit access control policies, 404 middleware
- Next.js: Login flow, username selection screen, Dashboard (My Ideas + Shared With Me), Idea Detail shell with tabs, User profile page (`/:username`)
- Database schema and migrations

### Phase 2 — Core AI Value (Weeks 2–3)
- Brainstorm chat (Claude API, streaming via SSE)
- AI Analysis runner — all four analysis types, Sidekiq background jobs, web search enabled
- Structured result display components, version history, annotation

### Phase 3 — Productivity Layer (Weeks 3–4)
- Notes (Tiptap, auto-save)
- Tasks (CRUD, toggle complete)
- Wireframes (Excalidraw embed + persistence)
- PRD Generator (AI generation, split-pane editor, version history, Markdown + PDF export)
- Collaborator invite flow (email + in-app notification)

### Phase 4 — Polish & Beta (Week 5)
- Mobile-responsive layout passes
- Empty states and onboarding wizard
- Loading skeletons, error boundaries, optimistic UI
- Toast notification system (invite accepted, analysis complete)
- Invite-only beta access (allowlist + waitlist form)

---

## 13. Open Questions

1. Should brainstorm sessions be visible to collaborators, or private to the user who started them?
2. Should analysis runs be metered (credits the user manages) or fully abstracted behind a usage limit?
3. Should the owner be able to make an idea fully public (readable by any logged-in user without an explicit invite)?
4. Should idea status changes trigger contextual AI prompts? (e.g. "You moved this to Validated — want to generate a PRD?")
5. Should PRD public share links expire automatically, or remain active until manually revoked?
6. Should the slug be locked once shared with collaborators, or always editable by the owner?

---

## 14. Future Considerations (Post-v1)

- **Monetization:** Pro tier with higher analysis run limits, team workspaces, and advanced PRD export formats
- **PRD DOCX export:** Word document export requiring server-side rendering pipeline
- **Ownership transfer:** Allow an owner to transfer an idea to another user
- **Idea forking:** Allow a member to fork an idea into their own namespace (like GitHub forks)
- **Integrations:** Export PRD to Notion, create Jira epics from tasks, post to Slack
- **Mobile:** React Native companion app for quick idea capture on the go
- **Templates:** Pre-built brainstorm and validation templates by industry vertical
- **AI follow-through:** After validation, Claude helps draft an MVP spec or landing page copy
- **Public feed:** Opt-in idea showcase for community feedback and discovery
