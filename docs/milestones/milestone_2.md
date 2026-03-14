# Milestone 2 — Core AI Value

**Goal:** Brainstorm chat with Claude (streaming) and structured validation analysis (competitor, TAM, PMF, full report) with real web search data. All runs are versioned. Users can brainstorm, run analysis, and view structured results. This is the primary differentiator of IdeaMode.

**Timeline:** Weeks 2–3  
**Depends on:** Milestone 1 (Foundation)

---

## Tickets

### Ticket 2.1 — Brainstorm Chat (backend & streaming)

**Description:** Implement BrainstormSession model and streaming chat with Claude via Server-Sent Events so users can have a critical-thinking dialogue about their idea before running formal validation. It matters because it captures reasoning and assumptions in one place and primes the idea for analysis and PRD generation.

**Tasks:**

- [ ] Create BrainstormSession model: `idea_id`, `user_id`, `messages` (jsonb array), timestamps. Associate with idea and user.
- [ ] Design system prompt so Claude acts as a critical thinking partner (challenges assumptions, asks hard questions, helps articulate problem and customer)—not a cheerleader.
- [ ] Implement endpoint `POST /:username/:slug/brainstorm/sessions` to create a session; `POST /:username/:slug/brainstorm/sessions/:id/messages` (or equivalent) to send a user message and stream assistant response via SSE.
- [ ] Append user message and streamed assistant message to session `messages`; persist full message history.
- [ ] Support "pin message to Overview" (store pinned message id or content on idea or session; display on Overview tab per HLD).
- [ ] Enforce authorization: only owner and collaborators can create/post; viewers read-only (or no access to brainstorm depending on product choice).

**Acceptance criteria:**

- User (owner/collaborator) can start a brainstorm session and send messages; responses stream in via SSE and appear in the UI in real time.
- Message history is persisted; reloading the brainstorm tab shows previous messages.
- Pinning a message stores it and it appears on the idea Overview tab.
- System prompt produces critical, questioning responses rather than purely affirmative ones. Unauthorized users cannot post messages.

**Test plan (manual):**

1. Open an idea as owner; go to Brainstorm tab. Send "What assumptions am I making?" Confirm response streams in and is saved; refresh and confirm history is intact.
2. Pin one message; go to Overview tab. Confirm pinned insight is visible.
3. Open the same idea as a viewer; confirm brainstorm is read-only or inaccessible per spec.
4. Start a new session (if UI supports multiple sessions); confirm previous session is archived and new messages don’t mix with old.

---

### Ticket 2.2 — Analysis Engine (Claude, web search, Sidekiq)

**Description:** Implement IdeaAnalysis model, analysis types (competitor, tam, pmf, full), Claude API with web search tool, structured JSON output, and Sidekiq job with progress streaming so users get versioned, reproducible validation reports. This is the core "validation" value: real signals, not just model knowledge.

**Tasks:**

- [ ] Create IdeaAnalysis model: `idea_id`, `analysis_type` (competitor | tam | pmf | full), `result` (jsonb), `created_at`. Multiple runs per idea are retained (versioned).
- [ ] Integrate Claude API with web search tool enabled for all analysis calls.
- [ ] Define and enforce structured JSON output schema for each analysis type (competitor_analysis, market_size, pmf_signals, verdict) per HLD schema.
- [ ] Full report runs competitor + tam + pmf in one job and produces combined verdict (score, recommendation, key_risks, next_steps).
- [ ] Enqueue analysis run as a Sidekiq job; stream progress (e.g. "Running competitor analysis…", "Running TAM…") to frontend via SSE or polling.
- [ ] Endpoints: `POST /:username/:slug/analyses` (trigger run, return job id or stream), `GET /:username/:slug/analyses`, `GET /:username/:slug/analyses/:id`.
- [ ] Support annotating an analysis result (e.g. store annotations in a separate field or in result; allow add/edit).

**Acceptance criteria:**

- User can trigger competitor, tam, pmf, or full analysis; job runs in background and frontend can show progress.
- Each run produces valid JSON matching the HLD schema; result is stored and returned by `GET /analyses/:id`.
- Full report includes competitor, market size, PMF, and verdict in one result. Multiple runs are kept; listing analyses returns history with timestamps.
- Annotations can be added to a result and persisted. Unauthorized users cannot trigger or access analyses (404 for idea access).

**Test plan (manual):**

1. Trigger a competitor analysis; confirm job starts and progress updates (or polling shows completion). Open result; confirm JSON has competitors, saturation_score, whitespace.
2. Trigger a full report; confirm all sections (competitor, TAM, PMF, verdict) are present and verdict has score and recommendation.
3. Run analysis again; confirm a second record is created and both are visible in history. Compare two runs.
4. Add an annotation to a result; reload and confirm it is saved. As viewer, confirm analysis is read-only or access denied per spec.

---

### Ticket 2.3 — Analysis UI

**Description:** Build the Analysis tab in the Next.js app: run buttons per type, version selector, verdict banner, competitor cards, TAM/SAM display, PMF sections, next steps, and loading skeleton so users can run and consume validation without leaving the idea. This surfaces the engine in a clear, scannable way.

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

## Milestone 2 completion checklist

- [ ] All three tickets (2.1–2.3) are implemented and accepted.
- [ ] Users can brainstorm with streaming responses and pin insights to Overview.
- [ ] Users can run all analysis types, see versioned results, and consume them in the Analysis UI with correct role behavior.
