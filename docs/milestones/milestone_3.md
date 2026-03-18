# Milestone 3 — Idea AI Value

**Goal:** Discussion chat with Claude (critical/evaluative mode, streaming) and structured validation analysis (competitor, TAM, PMF, full report) with real web search data. All runs are versioned. If an idea was created from a brainstorm, brainstorm context (chat history, notes, research) is included in discussion and analysis prompts. This is the core reason to move from brainstorm to idea.

**Timeline:** Weeks 3–4  
**Depends on:** Milestone 2 (Brainstorm Features)

---

## Tickets

### Ticket 3.1 — Discussion Chat (backend & streaming)

**Description:** Reuse ChatSession model with `idea_id` set (same table as brainstorm chat). Implement streaming chat with Claude via SSE for **ideas**. System prompt is a critical thinking partner — pressure-tests assumptions, asks hard questions, helps articulate problem and customer; not a cheerleader. If the idea has a linked brainstorm (`brainstorm_id`), include brainstorm chat history and notes in the system prompt context. Pinned messages and session history behave as in brainstorm chat.

**Tasks:**

- [ ] Use existing ChatSession model; create sessions with `idea_id` set (brainstorm_id null) for idea discussion. Same endpoints pattern: `POST /:username/:slug/discussion/sessions`, `POST /:username/:slug/discussion/sessions/:id/messages` (SSE), `GET /:username/:slug/discussion/sessions` when slug is an idea.
- [ ] Design system prompt so Claude acts as a critical thinking partner for ideas (challenges assumptions, asks hard questions, helps articulate problem and target customer) — not affirmative only.
- [ ] When idea has `brainstorm_id`: load linked brainstorm's chat sessions and note content; inject into system prompt or context so Claude can reference prior exploration.
- [ ] Append user message and streamed assistant message to session `messages`; persist full history. Support "pin message to Overview" (display on idea Overview tab).
- [ ] Enforce authorization: only owner and collaborators can create/post; viewers read-only.

**Acceptance criteria:**

- User (owner/collaborator) can start a discussion session on an idea and send messages; responses stream in via SSE. Message history is persisted.
- For an idea created from a brainstorm, discussion responses can reference or build on brainstorm context (e.g. "You mentioned in your brainstorm that …").
- Pinning a message stores it and it appears on the idea Overview tab. Unauthorized users cannot post messages.

**Test plan (manual):**

1. Open an idea (with no linked brainstorm); go to Discussion tab. Send "What assumptions am I making?" Confirm response streams in and is saved; confirm critical/questioning tone.
2. Open an idea that was created from a brainstorm; send a message. Confirm response can reference brainstorm content if relevant. Pin a message; confirm it appears on Overview.
3. As viewer, open Discussion tab; confirm read-only. Start a new session; confirm previous session is archived.

---

### Ticket 3.2 — Analysis Engine (Claude, web search, Sidekiq)

**Description:** Implement IdeaAnalysis model, analysis types (competitor, tam, pmf, full), Claude API with web search tool, structured JSON output per HLD schema, and Sidekiq job with progress streaming. If the idea has a linked brainstorm, include brainstorm research results (and optionally notes) as context for the analysis. Versioned, reproducible validation reports.

**Tasks:**

- [ ] Create IdeaAnalysis model: `idea_id`, `analysis_type` (competitor | tam | pmf | full), `result` (jsonb), `created_at`. Multiple runs per idea retained (versioned).
- [ ] Integrate Claude API with web search tool enabled for all analysis calls.
- [ ] Define and enforce structured JSON output schema for each analysis type (competitor_analysis, market_size, pmf_signals, verdict) per HLD schema.
- [ ] Full report runs competitor + tam + pmf in one job and produces combined verdict (score, recommendation, key_risks, next_steps).
- [ ] When idea has `brainstorm_id`: load linked brainstorm's BrainstormResearch results (and optionally note); pass as context to analysis prompt so Claude can use prior research.
- [ ] Enqueue analysis run as a Sidekiq job; stream progress (e.g. "Running competitor analysis…", "Running TAM…") to frontend via SSE or polling.
- [ ] Endpoints: `POST /:username/:slug/analyses` (trigger run, return job id or stream), `GET /:username/:slug/analyses`, `GET /:username/:slug/analyses/:id`.
- [ ] Support annotating an analysis result (e.g. store annotations in a separate field or in result; allow add/edit).

**Acceptance criteria:**

- User can trigger competitor, tam, pmf, or full analysis; job runs in background and frontend can show progress.
- Each run produces valid JSON matching the HLD schema; result is stored and returned by `GET /analyses/:id`.
- Full report includes competitor, market size, PMF, and verdict in one result. Multiple runs are kept; listing analyses returns history with timestamps.
- For an idea with a linked brainstorm, analysis can reference or use brainstorm research context. Annotations can be added to a result and persisted. Unauthorized users cannot trigger or access analyses (404 for idea access).

**Test plan (manual):**

1. Trigger a competitor analysis; confirm job starts and progress updates (or polling shows completion). Open result; confirm JSON has competitors, saturation_score, whitespace.
2. Trigger a full report on an idea that was created from a brainstorm; confirm all sections present and verdict has score and recommendation. Optionally confirm analysis references brainstorm research if applicable.
3. Run analysis again; confirm a second record is created and both are visible in history. Add an annotation; reload and confirm it is saved. As viewer, confirm analysis is read-only or access denied per spec.

---

### Ticket 3.3 — Analysis UI

**Description:** Build the Analysis tab in the Next.js app for ideas: run buttons per type, version selector, verdict banner, competitor cards, TAM/SAM display, PMF sections, next steps, and loading skeleton. Surfaces the engine in a clear, scannable way. Viewer sees all content read-only; run buttons hidden.

**Tasks:**

- [ ] Analysis tab: buttons to run each analysis type (Competitor, TAM, PMF, Full Report). Disable or show loading while a job is running.
- [ ] Version/history selector: list past runs by date; selecting one loads that result.
- [ ] Verdict banner: score ring (e.g. 0–100), recommendation text, key risks list, next steps list. Use Recharts or similar if needed for score visualization.
- [ ] Competitor cards: for each competitor show name, strengths/weaknesses as tag chips, pricing. Summary and whitespace above or below.
- [ ] TAM/SAM display with confidence indicator (low/medium/high).
- [ ] PMF signals: collapsible sections for demand evidence, pain point strength, willingness-to-pay, etc.
- [ ] Loading skeleton while analysis job is in progress; empty state when no analyses have been run.
- [ ] Viewer role: show all content read-only; hide run buttons.

**Acceptance criteria:**

- User can start each analysis type from the UI and see progress until completion. Completed result is selected and displayed.
- Verdict, competitors, TAM/SAM, and PMF sections render from the stored JSON without errors. Score and recommendation are prominent.
- Switching version in history updates the displayed result. No run button for viewers; all content is read-only for them.

**Test plan (manual):**

1. Open Analysis tab with no prior runs. Click "Run Full Report"; confirm loading state, then result appears with verdict, competitors, TAM/SAM, PMF.
2. Run a second analysis; switch between "Version 1" and "Version 2" in history. Confirm data changes correctly.
3. As viewer, open Analysis tab; confirm run buttons are hidden and existing results are visible read-only.
4. Resize window; confirm layout is usable on small and large screens (responsive).

---

## Milestone 3 completion checklist

- [ ] All three tickets (3.1–3.3) are implemented and accepted.
- [ ] Users can discuss ideas with streaming responses and pin insights to Overview; linked brainstorm context is used when present.
- [ ] Users can run all analysis types, see versioned results, and consume them in the Analysis UI with correct role behavior. Linked brainstorm research is used as context when present.
