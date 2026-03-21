# IdeaMode — Product Requirements Document

**Version:** 3.0  
**Author:** Court  
**Domain:** ideamode.ai  
**Status:** Draft  
**Last Updated:** March 2026

---

## 1. Overview

IdeaMode is a web application built around two core models: **Brainstorms** and **Ideas**.

A **Brainstorm** is an exploratory workspace where users can work out new concepts, research opportunities, and refine raw thinking with the help of AI chat and lightweight research tools. A brainstorm is low-pressure and open-ended — the goal is exploration, not commitment.

An **Idea** is a structured workspace for vetting and validating a concrete product or business concept. Ideas carry the full suite of validation tools — competitor analysis, market sizing, product-market fit assessment — alongside wireframing, task tracking, and PRD generation.

Users can take **two paths** into IdeaMode:
1. **Explore first:** Start with a Brainstorm to research and develop a raw concept, then create an Idea from that Brainstorm when the concept is concrete enough to validate. The Idea links back to the originating Brainstorm for reference.
2. **Validate directly:** If a user already has a concrete idea, they can create an Idea without an associated Brainstorm.

Structurally, IdeaMode follows a **GitHub-style ownership model**: both brainstorms and ideas belong to exactly one user (the owner), live at URLs scoped to that user's username (e.g. `ideamode.ai/court/my-saas-idea`), and can be shared with others as collaborators (read + write) or viewers (read-only). Ownership is singular and immutable. Access is always explicitly granted by the owner — never inherited.

The goal is to give founders, product managers, and indie developers a single place to take a concept from raw intuition through structured exploration to a well-reasoned go/no-go decision, with a permanent record of everything along the way.

---

## 2. Problem Statement

Evaluating a new idea is time-consuming, unstructured, and prone to confirmation bias. Most people either overthink early-stage ideas with too much process, or under-examine them and build the wrong thing. Existing tools are fragmented — market research lives in one place, notes in another, wireframes in a third — and there's no connective tissue between them.

Crucially, most tools skip the messy exploration phase entirely. They jump straight from "I have an idea" to structured validation, ignoring the fact that most concepts need room to breathe — to be questioned, researched loosely, and reshaped — before they're ready to be formally vetted. Without a dedicated space for this, early-stage thinking gets lost in scattered docs or never happens at all.

IdeaMode solves this with two distinct workspaces: **Brainstorms** for open-ended exploration and research, and **Ideas** for structured validation and product planning. A brainstorm can naturally evolve into an idea, or users can go straight to validation when they're ready. The entire workflow is structured with ownership the way developers already think about it: one owner, explicit collaborators, URL-addressable artifacts.

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
| Enable sharing and collaboration | At least one member added per brainstorm or idea on average |
| Produce useful PRD artifacts | PRD export used at least once per validated idea |
| Support the explore-then-validate workflow | Brainstorm-to-Idea conversion rate among active users |
| Make brainstorm research valuable | Average number of research queries per brainstorm |

---

## 5. Scope

### In Scope (v1)
- User accounts with Google SSO and unique usernames
- **Two core models: Brainstorms and Ideas**, each with GitHub-style ownership (one owner, explicit member access)
- Brainstorm creation, status tracking, slug management, and CRUD
- Brainstorm features: AI chat (streaming), notes (Tiptap rich text), light research tools (market lookups, competitor spotting, trend signals)
- **Create Idea from Brainstorm** flow — new Idea is pre-populated with brainstorm context and linked back via `brainstorm_id`
- Idea creation directly (without a brainstorm) for users with concrete concepts
- Idea features: AI discussion chat (streaming), structured AI validation analysis (competitors, TAM, PMF, full report), notes, task tracking, wireframes (Excalidraw), AI-generated PRD with Markdown and PDF export
- User-scoped URLs for both brainstorms and ideas: `/:username/:slug`
- User profile pages at `/:username`
- Collaborator invites with role-based access control (applies to both brainstorms and ideas)

### Out of Scope (v1)
- Mobile app
- Public brainstorm or idea discovery feed
- Integrations (Notion, Jira, Slack)
- Billing / paid tiers
- Real-time collaborative editing
- Username changes
- Brainstorm or idea ownership transfer

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

Both brainstorms and ideas follow the same ownership model as GitHub repositories. One user owns a brainstorm or idea. Others can be granted access by the owner. The owner's username is always in the URL, regardless of who is viewing.

```
User
 ├── owns many Brainstorms  (user_id on Brainstorm, immutable)
 │    └── BrainstormMember  (join table — grants access to other Users)
 │         roles: collaborator | viewer
 │
 └── owns many Ideas  (user_id on Idea, immutable)
      ├── brainstorm_id  (nullable FK → Brainstorm — set when created from a brainstorm)
      └── IdeaMember  (join table — grants access to other Users)
           roles: collaborator | viewer
```

### Role Definitions

The same roles apply to both brainstorms and ideas:

| Role | How Assigned | Capabilities |
|---|---|---|
| **Owner** | Creator of the brainstorm or idea — permanent | Full access: edit, delete, manage members, all tabs. On brainstorms: can create an idea from the brainstorm |
| **Collaborator** | Explicitly invited by owner | Read + write: edit notes, participate in chat, run research (brainstorms) or analysis (ideas), wireframes, generate PRD (ideas only). Cannot manage members or delete |
| **Viewer** | Explicitly invited by owner | Read-only: view all tabs, export PRD and analysis. Cannot edit anything |

### Key Behaviours

- Ownership is **immutable** after creation — cannot be transferred in v1
- A user can be a member of many brainstorms and ideas across many different owners
- URLs are always scoped to the owner: `/:username/:slug`
- Members access a brainstorm or idea at the **owner's URL**, not their own
- Accessing a brainstorm or idea without permission returns **404** — never 403, never confirm it exists
- Viewers see a lock indicator in the header; edit controls are hidden entirely, not just disabled
- Collaborators cannot invite additional members — only the owner can
- When an idea is created from a brainstorm, brainstorm members are **not** automatically added to the idea — the owner explicitly chooses which members to carry over

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

### Brainstorm
| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → User (owner) — immutable after creation |
| slug | string | URL-safe, unique per user (shared namespace with ideas) — auto-generated from title, editable by owner |
| title | string | |
| description | text | |
| status | enum | `exploring`, `researching`, `ready`, `archived` |
| visibility | enum | `private` (default), `shared` (accessible to BrainstormMembers only) |
| created_at / updated_at | timestamp | |

### BrainstormMember
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| brainstorm_id | uuid | FK → Brainstorm |
| user_id | uuid | FK → User (the member — never the owner) |
| role | enum | `collaborator`, `viewer` |
| invited_by | uuid | FK → User (always the owner in v1) |
| accepted_at | timestamp | Null until invite is accepted |
| created_at | timestamp | |

### BrainstormInvite
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| brainstorm_id | uuid | FK → Brainstorm |
| invited_by | uuid | FK → User (owner) |
| email | string | Invitee email — may not yet be a registered user |
| role | enum | `collaborator`, `viewer` |
| token | string | Unique secure token for invite link |
| accepted_at | timestamp | Null until accepted |
| expires_at | timestamp | 7-day expiry |

### BrainstormNote
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| brainstorm_id | uuid | FK → Brainstorm |
| user_id | uuid | FK → User (last editor) |
| content | text | Rich text (Tiptap JSON) |
| updated_at | timestamp | |

### BrainstormResearch
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| brainstorm_id | uuid | FK → Brainstorm |
| research_type | enum | `market_lookup`, `competitor_spot`, `trend_signal` |
| query | string | What the user asked or searched for |
| result | jsonb | Structured AI output — lighter-weight than IdeaAnalysis |
| created_at | timestamp | Multiple runs retained |

### Idea
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → User (owner) — immutable after creation |
| brainstorm_id | uuid | Nullable FK → Brainstorm — set when idea is created from a brainstorm; null when created independently. Multiple ideas can originate from the same brainstorm |
| slug | string | URL-safe, unique per user (shared namespace with brainstorms) — auto-generated from title, editable by owner |
| title | string | |
| description | text | |
| status | enum | `validating`, `validated`, `shelved` |
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

### ChatSession
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| brainstorm_id | uuid | Nullable FK → Brainstorm — set for brainstorm chat sessions |
| idea_id | uuid | Nullable FK → Idea — set for idea discussion sessions |
| user_id | uuid | FK → User |
| messages | jsonb | Full chat history array |
| created_at | timestamp | |

*Exactly one of `brainstorm_id` or `idea_id` must be set (database check constraint). Renamed from `BrainstormSession` to reflect that chat sessions serve both brainstorms and ideas.*

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

**Description:** Users sign in with Google. On first sign-in, they choose a username that becomes the permanent namespace for all their brainstorms and ideas.

**Requirements:**
- Sign in / sign up via Google OAuth 2.0
- On first sign-in, redirect to username selection screen before entering the app
- Username must be unique, URL-safe, and 3–30 characters. Validation is real-time
- Username is permanent — not changeable in v1
- Session persists via secure cookie (Rails session store)
- Sign out clears session and redirects to marketing/login page

---

### 9.2 Dashboard

**Description:** The home screen after login. A tab-based layout with two top-level tabs: **Brainstorms** and **Ideas**. Each tab shows both owned and shared items in a single view.

**Tabs:**
1. **Brainstorms** — all brainstorms the user owns plus brainstorms shared with them
2. **Ideas** — all ideas the user owns plus ideas shared with them

**Brainstorms Tab Requirements:**
- **My Brainstorms** section: responsive card grid of all brainstorms owned by the current user, grouped by status: Exploring → Researching → Ready → Archived
- **Shared With Me** section: brainstorms where the current user is a collaborator or viewer, showing the owner's avatar and username
- Brainstorm cards show: title, status badge, member avatars, last updated
- "New Brainstorm" button opens a modal: title, optional description, slug preview (auto-generated, editable)
- Filter/sort by status, last updated
- Empty state with clear prompt to create first brainstorm

**Ideas Tab Requirements:**
- **My Ideas** section: responsive card grid of all ideas owned by the current user, grouped by status: Validating → Validated → Shelved
- **Shared With Me** section: ideas where the current user is a collaborator or viewer, showing the owner's avatar and username
- Idea cards show: title, owner (if shared), status badge, validation score ring (if run), member avatars, last updated, linked brainstorm indicator (if created from a brainstorm)
- "New Idea" button opens a modal: title, optional description, slug preview (auto-generated, editable)
- Filter/sort by status, last updated, score
- Empty state with clear prompt to create first idea

---

### 9.3 User Profile

**Description:** Every user has a profile page at `/:username`, analogous to a GitHub user page.

**Requirements:**
- Shows: avatar, display name, `@username`, bio, and a list of their brainstorms and ideas
- Content shown depends on the viewer's relationship: owners see all their own brainstorms and ideas; other logged-in users only see brainstorms and ideas the owner has explicitly shared with them
- Unauthenticated access to profile pages is out of scope for v1
- Owner edits their display name, bio, and avatar from `/settings`

---

### 9.4 Brainstorm Detail

**Description:** The workspace for a single brainstorm. Simpler than an idea — focused on exploration, conversation, and lightweight research. Tab-based layout under a persistent header showing the breadcrumb, title, status, and members.

**Breadcrumb format:** `@owner / brainstorm-slug`

**Tabs:**
1. Overview
2. Chat
3. Research
4. Notes

**Overview Tab Requirements:**
- Editable title and description (inline — owner and collaborators only)
- Status selector (owner only): Exploring → Researching → Ready → Archived
- Members panel: lists owner (marked Owner) and all BrainstormMembers with role badges. Owner can invite, change roles, and remove members
- "Create Idea" button (owner only) — opens the Create Idea from Brainstorm flow (see 9.5)
- If ideas have been created from this brainstorm, show a "Related Ideas" list with links
- Ownership attribution: "Owned by @username"
- Created date, last updated

---

### 9.5 Create Idea from Brainstorm

**Description:** A flow that allows a brainstorm owner to create a new idea seeded with context from the brainstorm. The brainstorm remains fully usable afterward.

**Requirements:**
- "Create Idea" action available from the brainstorm Overview tab (owner only)
- Opens a modal pre-populated with: title and description from the brainstorm (both editable before creation)
- Slug preview auto-generated from the title (editable)
- Option to carry over brainstorm members to the new idea (checkboxes per member, all unchecked by default)
- On creation: the new idea's `brainstorm_id` is set to the originating brainstorm
- The brainstorm is **not** archived, locked, or otherwise affected — it remains fully usable. Users can continue exploring, or create additional ideas from the same brainstorm
- Chat history and notes from the brainstorm are available as context when generating analysis or PRDs on the linked idea
- The idea's Overview tab shows a "From Brainstorm" link that navigates back to the originating brainstorm

**Direct Idea Creation (no brainstorm):**
- Users can always create a new idea directly from the dashboard via the "New Idea" button
- In this case `brainstorm_id` is null — no brainstorm link is shown on the idea

---

### 9.6 Brainstorm Chat

**Description:** An open-ended conversational AI interface for exploring concepts, questioning assumptions, and developing raw ideas. Ideabot acts as a business consultant: creative exploration plus practical validation guidance.

**Requirements:**
- Chat interface with Claude (streaming via SSE)
- System prompt primes Claude as Ideabot, a business consultant with expertise in idea generation and validation — explore possibilities, ask generative questions, stress-test assumptions constructively, and suggest how to validate hypotheses
- Suggested starter prompts on empty state:
  - "I have a rough idea — help me think it through"
  - "What problems exist in [space] that nobody is solving well?"
  - "Help me explore who would actually use this"
  - "What are the different ways this concept could work?"
- Chat history persisted per session; users can start a new session (previous sessions archived and viewable)
- Users can pin any message as a key insight — pinned insights appear on the Overview tab
- Collaborators can view and participate in chat sessions; viewer access is read-only

---

### 9.7 Brainstorm Research

**Description:** Lightweight AI-powered research tools for quick signal-gathering during exploration. Less formal than Idea Analysis — designed for fast lookups, not structured reports.

**Research Types:**

**Market Lookup** — Quick search for existing products, trends, and market signals in a given space. Returns a summary with links and key takeaways.

**Competitor Spot** — Identifies potential competitors or adjacent players for a concept. For each: name, URL, and a one-line description. No scoring or deep analysis.

**Trend Signal** — Searches for demand signals: search trends, Reddit/forum mentions, app store activity, and general buzz. Returns a qualitative summary with confidence caveats.

**Requirements:**
- Each research type is a separate action
- AI uses web search to gather real-time signals
- Results render in simple, readable UI components — not raw text, but not as heavily structured as Idea Analysis
- Each query is saved with its result — users can see their research history
- Collaborators can run research; viewers can view results

---

### 9.8 Idea Detail

**Description:** The core workspace for a single idea. Tab-based layout under a persistent header showing the breadcrumb, title, status, score, and members.

**Breadcrumb format:** `@owner / idea-slug`

**Tabs:**
1. Overview
2. Discussion
3. Analysis
4. Wireframes
5. PRD
6. Notes
7. Tasks

**Overview Tab Requirements:**
- Editable title and description (inline — owner and collaborators only)
- Status selector (owner only)
- Validation score badge (if analysis has been run) — numeric score, color-coded
- If the idea was created from a brainstorm: "From Brainstorm: brainstorm-title" link that navigates to the source brainstorm
- Members panel: lists owner (marked Owner) and all IdeaMembers with role badges. Owner can invite, change roles, and remove members. Collaborators and viewers see the list but cannot modify it
- Ownership attribution: "Owned by @username"
- Created date, last updated

---

### 9.9 Discussion

**Description:** A conversational AI interface scoped to a specific idea. Unlike brainstorm chat (which is open-ended exploration), discussion is designed to pressure-test the idea's assumptions and sharpen the value proposition.

**Requirements:**
- Chat interface with Claude (streaming via SSE)
- System prompt primes Claude as a critical thinking partner — asks hard questions, surfaces assumptions, helps articulate the problem and target customer. Not a cheerleader
- If the idea was created from a brainstorm, the system prompt includes context from the brainstorm's chat history and notes
- Suggested starter prompts on empty state:
  - "Help me articulate the core problem this solves"
  - "What assumptions am I making that could be wrong?"
  - "Who is the ideal first customer for this?"
  - "What would make this idea fail?"
- Chat history persisted per session; users can start a new session (previous sessions archived and viewable)
- Users can pin any message as a key insight — pinned insights appear on the Overview tab
- Collaborators can view and participate in discussion sessions; viewer access is read-only

---

### 9.10 Analysis

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

### 9.11 Wireframes

**Description:** An Excalidraw canvas embedded per idea for sketching flows and screens without leaving IdeaMode.

**Requirements:**
- Embed Excalidraw (open source — no external account required)
- Multiple named wireframes per idea (e.g. "Onboarding Flow", "Dashboard", "Pricing Page")
- Wireframes listed in a sidebar; clicking one loads it in the canvas
- Canvas auto-saves to the database (debounced, 2 seconds of inactivity)
- Each wireframe has an optional description/caption
- Collaborators can view and edit; viewers see a read-only canvas with no toolbar

---

### 9.12 PRD Generator

**Description:** AI-generated product requirements documents synthesized from everything captured in the idea — discussion sessions, analysis results, notes, and description. If the idea was created from a brainstorm, the brainstorm's chat history, notes, and research results are also included as context. Users can generate, edit, version, and export a full PRD without leaving IdeaMode.

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

### 9.13 Notes (Ideas)

**Description:** A freeform rich text scratchpad per idea for research, links, and thoughts.

**Requirements:**
- Tiptap-based editor: headings, bold, italic, bullet lists, numbered lists, links, code blocks, blockquotes
- Single note per idea — not a multi-document system
- Auto-saves on change (debounced)
- Last saved timestamp visible
- Collaborators can edit; viewers read-only

---

### 9.14 Tasks

**Description:** A lightweight to-do list per idea for tracking validation actions and next steps.

**Requirements:**
- Add tasks with a title and optional due date
- Toggle complete — completed tasks collapse to a "Completed" section (expandable)
- Delete task
- Ordered by creation date; drag-to-reorder is a stretch goal
- No assignees in v1
- Collaborators can add/edit/complete tasks; viewers read-only

---

### 9.15 Membership Management

**Description:** Owner-controlled access management for both brainstorms and ideas. Mirrors GitHub's collaborator invite flow.

**Requirements:**
- Owner invites members by email from the Overview tab members panel (on either a brainstorm or idea)
- If the email matches an existing user, a `BrainstormMember` or `IdeaMember` record is created (`accepted_at: null`) and the user receives an in-app notification and email
- If no account exists, a `BrainstormInvite` or `IdeaInvite` is created and a signup link with a pre-attached token is emailed
- Invites expire after 7 days; owner can resend
- Pending invites show a banner on the brainstorm or idea page until accepted
- Owner can change a member's role at any time (collaborator ↔ viewer)
- Owner can remove a member at any time — access revoked immediately
- Members can leave a brainstorm or idea themselves
- Only the owner can invite members — collaborators cannot

---

## 10. Navigation & Information Architecture

```
/ (Marketing / Login)
/dashboard                               ← My Brainstorms + My Ideas + Shared With Me
/:username                               ← User profile page

Brainstorm routes:
/:username/:brainstorm-slug              ← Brainstorm detail (defaults to overview)
  /:username/:brainstorm-slug/overview
  /:username/:brainstorm-slug/chat
  /:username/:brainstorm-slug/research
  /:username/:brainstorm-slug/notes

Idea routes:
/:username/:idea-slug                    ← Idea detail (defaults to overview)
  /:username/:idea-slug/overview
  /:username/:idea-slug/discussion
  /:username/:idea-slug/analysis
  /:username/:idea-slug/wireframes
  /:username/:idea-slug/prd
  /:username/:idea-slug/prd/:version
  /:username/:idea-slug/notes
  /:username/:idea-slug/tasks

/settings                                ← Profile, account, notifications
```

**URL rules:**
- Both brainstorms and ideas live at `/:username/:slug` — the owner's username is in the URL regardless of who is viewing
- Brainstorm and idea slugs share the same namespace per user — a user cannot have a brainstorm and an idea with the same slug
- Slugs are auto-generated from the title on creation; editable by the owner
- The backend resolves the slug by checking both brainstorms and ideas for the given user
- Accessing a brainstorm or idea without permission returns **404** — not 403, never confirm it exists

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
- Rails API: Google SSO, User model with username
- Brainstorm model + CRUD with user-scoped slugs, `BrainstormMember` + `BrainstormInvite`
- Idea model + CRUD with user-scoped slugs (shared namespace with brainstorms), `IdeaMember` + `IdeaInvite`, nullable `brainstorm_id` FK
- `ChatSession` model (polymorphic — serves both brainstorms and ideas)
- Pundit access control policies for both brainstorms and ideas, 404 middleware, slug resolution
- Next.js: Login flow, username selection screen, Dashboard (My Brainstorms + My Ideas + Shared With Me), Brainstorm Detail shell with tabs, Idea Detail shell with tabs, User profile page (`/:username`)
- Database schema and migrations

### Phase 2 — Core AI Value (Weeks 2–3)
- Brainstorm chat (Claude API, streaming via SSE, exploratory system prompt)
- Brainstorm research tools — market lookups, competitor spotting, trend signals
- Create Idea from Brainstorm flow (pre-populated context, `brainstorm_id` link, optional member carryover)
- Idea discussion chat (Claude API, streaming via SSE, critical/evaluative system prompt)
- AI Analysis runner — all four analysis types, Sidekiq background jobs, web search enabled
- Structured result display components, version history, annotation

### Phase 3 — Productivity Layer (Weeks 3–4)
- Notes for brainstorms (Tiptap, auto-save)
- Notes for ideas (Tiptap, auto-save)
- Tasks (CRUD, toggle complete — ideas only)
- Wireframes (Excalidraw embed + persistence — ideas only)
- PRD Generator (AI generation with brainstorm context when linked, split-pane editor, version history, Markdown + PDF export)
- Collaborator invite flow for both brainstorms and ideas (email + in-app notification)

### Phase 4 — Polish & Beta (Week 5)
- Mobile-responsive layout passes
- Empty states and onboarding wizard
- Loading skeletons, error boundaries, optimistic UI
- Toast notification system (invite accepted, analysis complete, idea created from brainstorm)
- Invite-only beta access (allowlist + waitlist form)

---

## 13. Open Questions

1. Should brainstorm and idea slugs share the same namespace under a user (current plan), or have separate namespaces (e.g. `/b/slug` vs `/i/slug`)?
2. Should chat sessions (in both brainstorms and ideas) be visible to collaborators, or private to the user who started them?
3. Should analysis runs be metered (credits the user manages) or fully abstracted behind a usage limit?
4. Should the owner be able to make a brainstorm or idea fully public (readable by any logged-in user without an explicit invite)?
5. Should idea status changes trigger contextual AI prompts? (e.g. "You moved this to Validated — want to generate a PRD?")
6. Should PRD public share links expire automatically, or remain active until manually revoked?
7. Should the slug be locked once shared with collaborators, or always editable by the owner?
8. Should the brainstorm detail page show a list of ideas that were created from it?
9. Should research results from a brainstorm carry over as pre-populated context when running full analysis on the linked idea?

---

## 14. Future Considerations (Post-v1)

- **Monetization:** Pro tier with higher analysis run limits, team workspaces, and advanced PRD export formats
- **PRD DOCX export:** Word document export requiring server-side rendering pipeline
- **Ownership transfer:** Allow an owner to transfer a brainstorm or idea to another user
- **Idea forking:** Allow a member to fork an idea into their own namespace (like GitHub forks)
- **Brainstorm forking:** Allow a member to fork a brainstorm into their own namespace
- **Integrations:** Export PRD to Notion, create Jira epics from tasks, post to Slack
- **Mobile:** React Native companion app for quick brainstorm and idea capture on the go
- **Templates:** Pre-built brainstorm and validation templates by industry vertical
- **AI follow-through:** After validation, Claude helps draft an MVP spec or landing page copy
- **Public feed:** Opt-in brainstorm and idea showcase for community feedback and discovery
- **Brainstorm-to-idea lineage:** Visual graph showing how brainstorms have evolved into ideas over time
