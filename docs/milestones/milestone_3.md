# Milestone 3 — Productivity Layer

**Goal:** Notes (Tiptap), tasks, Excalidraw wireframes, and AI-generated PRD with streaming, versioning, and Markdown/PDF export. Ideas become full workspaces with actionable artifacts.

**Timeline:** Weeks 3–4  
**Depends on:** Milestone 2 (Core AI Value)

---

## Tickets

### Ticket 3.1 — Notes (Tiptap, auto-save)

**Description:** Add a single rich-text note per idea using Tiptap, stored as JSON and auto-saved, so users have a scratchpad for research and thoughts without leaving the idea. It matters because notes feed into PRD context and keep all idea-related content in one place.

**Tasks:**

- [ ] Create IdeaNote model: `idea_id`, `user_id` (last editor), `content` (jsonb for Tiptap JSON), `updated_at`. One note per idea (upsert by idea_id).
- [ ] Endpoints: `GET /:username/:slug/note` (return note or empty), `PUT /:username/:slug/note` (body: content JSON; authorize owner/collaborator).
- [ ] Next.js: Notes tab with Tiptap editor. Toolbar or menu for headings, bold, italic, lists, links, code, blockquote. Serialize to Tiptap JSON and send on save.
- [ ] Auto-save: debounce 1.5s after last change; send PUT with current content. Show last-saved timestamp.
- [ ] Viewer: read-only rendering of note content (no editor).

**Acceptance criteria:**

- Owner/collaborator can type in Notes tab; content auto-saves after 1.5s idle and last-saved time updates. Refresh shows persisted content with formatting preserved.
- Single note per idea; editing overwrites the same record. Viewer sees content but cannot edit.

**Test plan (manual):**

1. Open Notes tab; type and apply bold, list, link. Wait for auto-save; confirm "Last saved at …" updates. Refresh page; confirm content and formatting are intact.
2. Switch to another idea and back; confirm each idea has its own note. As viewer, open Notes; confirm read-only and no save control.

---

### Ticket 3.2 — Tasks

**Description:** Add a task list per idea with add, complete toggle, delete, and optional due date so users can track validation actions and next steps. It matters for turning analysis "next steps" into concrete todos.

**Tasks:**

- [ ] Create IdeaTask model: `idea_id`, `user_id` (creator), `title`, `completed` (boolean, default false), `due_date` (optional), timestamps. Ordered by `created_at`.
- [ ] Endpoints: `GET /:username/:slug/tasks`, `POST /:username/:slug/tasks`, `PATCH /:username/:slug/tasks/:id`, `DELETE /:username/:slug/tasks/:id`. Authorize owner/collaborator for write; viewer read-only.
- [ ] Next.js: Tasks tab. Add task (title, optional due date). List incomplete tasks first; completed tasks in a "Completed" section (collapsible). Toggle complete, delete task.
- [ ] Viewer: read-only list, no add/edit/delete.

**Acceptance criteria:**

- Owner/collaborator can add tasks, set due date, mark complete, delete. Order is by creation; completed grouped at bottom in collapsible section.
- Viewer sees task list but cannot modify. Data persists across refresh.

**Test plan (manual):**

1. Add several tasks, one with due date. Toggle one complete; confirm it moves to "Completed" section. Delete a task; confirm it is removed. Refresh; confirm state persists.
2. As viewer, open Tasks; confirm no add/complete/delete controls and list is read-only.

---

### Ticket 3.3 — Wireframes (Excalidraw)

**Description:** Embed Excalidraw per idea with multiple named frames, auto-save of canvas JSON, and read-only for viewers so users can sketch flows and screens without leaving IdeaMode. It matters for low-fidelity design and PRD context.

**Tasks:**

- [ ] Create IdeaWireframe model: `idea_id`, `user_id`, `title`, `canvas_data` (jsonb), `updated_at`. Multiple wireframes per idea.
- [ ] Endpoints: `GET /:username/:slug/wireframes`, `POST /:username/:slug/wireframes`, `PATCH /:username/:slug/wireframes/:id`. Authorize owner/collaborator for write.
- [ ] Next.js: Wireframes tab. Sidebar lists wireframes; click to load. Embed Excalidraw (open-source; no external account). Auto-save canvas state (debounced, e.g. 2s). Optional description/caption per frame.
- [ ] Viewer: read-only canvas (no toolbar); load same canvas_data for view-only.

**Acceptance criteria:**

- Owner/collaborator can create multiple wireframes, draw in Excalidraw, and have state auto-saved. Switching frames loads correct canvas. Viewer sees canvas without editing.

**Test plan (manual):**

1. Create two wireframes, draw in each, wait for auto-save. Switch between frames; confirm correct content loads. Refresh; confirm data persists.
2. As viewer, open Wireframes; confirm canvas is visible but toolbar/editing disabled.

---

### Ticket 3.4 — PRD Generator (AI, streaming, versioning, export)

**Description:** Generate PRDs from idea context (title, description, brainstorm, analysis, notes) via Claude with streaming, versioning, and Markdown/PDF export so users get a shareable PRD artifact without leaving the app. It matters as the main "output" of the validation workflow.

**Tasks:**

- [ ] Create IdeaPRD model: `idea_id`, `user_id`, `content` (text, Markdown), `version` (integer), `generated_at`, `updated_at`. Version auto-incremented per idea; retain all versions.
- [ ] Build PRD generation job: gather context (idea, brainstorm sessions, analyses, note), call Claude with structured prompt; stream response. Sections without sufficient context output `[Needs input]` — no hallucination.
- [ ] Endpoints: `POST /:username/:slug/prds` (SSE stream), `GET /:username/:slug/prds`, `GET /:username/:slug/prds/:version`, `GET /:username/:slug/prds/:version/export?format=md|pdf`. PDF via server-side render (e.g. pdf-lib or HTML-to-PDF).
- [ ] Next.js: PRD tab. "Generate PRD" starts stream; live Markdown preview updates as content streams. Split-pane: Markdown source (editable) and rendered preview. Version history panel with timestamps and optional AI-generated diff summary; restore previous version. Export buttons: Markdown download, PDF (call export endpoint).
- [ ] Optional: per-section regeneration (replace one section without full doc). Optional: revocable public share link for latest PRD (per HLD).
- [ ] Viewer: can view and export; cannot generate or edit.

**Acceptance criteria:**

- User can generate a PRD; content streams into the UI and is saved as a new version. Document follows PRD template (Overview, Problem, Target Users, etc.); gaps show `[Needs input]`.
- User can edit Markdown and see preview; save updates the current version. Version history lists all versions; user can view or restore a prior version.
- Export Markdown produces a .md file; export PDF produces a PDF. Viewer can view and export but not generate or edit.

**Test plan (manual):**

1. Generate a PRD for an idea with brainstorm and analysis data; confirm streaming and that sections are populated where context exists and `[Needs input]` where not. Edit a section; confirm preview updates and save persists.
2. Generate again (new version); confirm version list shows both. Restore first version; confirm content reverts. Export as Markdown and PDF; open files and confirm content matches.
3. As viewer, open PRD tab; confirm view and export work but generate/edit are disabled.

---

## Milestone 3 completion checklist

- [ ] All four tickets (3.1–3.4) are implemented and accepted.
- [ ] Notes, Tasks, Wireframes, and PRD are functional with correct role behavior and persistence. PRD generation uses idea context and supports versioning and export.
