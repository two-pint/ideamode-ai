# Milestone 2 — Brainstorm Features

**Goal:** Brainstorm-specific AI and productivity: chat with Claude in exploratory mode, lightweight research tools (market lookup, competitor spot, trend signal), notes per brainstorm, and "Create Idea from Brainstorm" flow. Built first so users can start exploring concepts immediately. The brainstorm remains fully usable after spawning an idea.

**Timeline:** Weeks 2–3  
**Depends on:** Milestone 1 (Foundation)

---

## Tickets

### Ticket 2.1 — Shared Brainstorm Chat (backend & streaming, @ideabot trigger)

**Description:** Implement one **shared chat thread per brainstorm**: owner and collaborators (and the AI) participate in the same conversation. The AI (Ideabot) is invoked **only when a message contains @ideabot** — otherwise the message is saved but no Claude call is made, reducing unnecessary API usage. ChatSession supports both brainstorms and ideas (exactly one of `brainstorm_id` or `idea_id` set). System prompt is exploratory and curious. Users can pin messages to Overview. This primes the concept for "Create Idea" in 2.4.

**Tasks:**

- [x] Create ChatSession model: `brainstorm_id` (nullable), `idea_id` (nullable), `messages` (jsonb array), timestamps. Check constraint: exactly one of `brainstorm_id` or `idea_id` set. One session per brainstorm (shared thread). Each message: `role` (user | assistant), `user_id` (nullable; set for user messages), `content`, `id`.
- [x] **@ideabot trigger:** When posting a message, invoke Claude and stream via SSE only if the message content contains `@ideabot`. If not, persist the user message and return success without calling the API.
- [x] Design system prompt so Claude acts as a creative thinking partner (explore possibilities, ask generative questions). Include linked resources (Ticket 2.6) in context when present.
- [x] Implement endpoints: `GET /:username/brainstorms/:slug/chat/session`, `POST /:username/brainstorms/:slug/chat/session/messages` (body: content; stream SSE only when message contains @ideabot), `POST /:username/brainstorms/:slug/chat/session/pin` (body: message_id). Persist user message always; append assistant message when @ideabot triggered.
- [x] Support "pin message to Overview" (store pinned message id or content; display on brainstorm Overview tab).
- [x] Enforce authorization: only owner and collaborators can post; viewers read-only.

**Acceptance criteria:**

- Owner/collaborator can send messages in the shared thread; each message shows who sent it (user or Ideabot).
- Messages **without** @ideabot are saved and shown in the thread but do **not** trigger an AI response or SSE.
- Messages **with** @ideabot stream an assistant reply via SSE and the reply is persisted.
- Message history is persisted; reloading the Chat tab shows full thread with attribution.
- Pinning a message stores it and it appears on the brainstorm Overview tab. Unauthorized users cannot post.

**Test plan (manual):**

1. Open a brainstorm as owner; go to Chat tab. Send "I have a rough idea" (no @ideabot). Confirm message appears in thread with no AI response. Send "@ideabot help me think it through." Confirm response streams in and is saved; refresh and confirm history shows both messages and reply.
2. As a collaborator, send a message with @ideabot; confirm reply streams and thread shows both users' messages and Ideabot.
3. Pin one message; go to Overview tab. Confirm pinned insight is visible.
4. Open the same brainstorm as a viewer; confirm chat is read-only (no send or @ideabot trigger).

---

### Ticket 2.2 — Brainstorm Research (backend)

**Description:** Implement BrainstormResearch model and lightweight AI research (market_lookup, competitor_spot, trend_signal) with Claude and web search. Results are saved and viewable; simpler structure than full Idea Analysis. This gives users quick signal-gathering during exploration without committing to a full validation report.

**Tasks:**

- [x] Create BrainstormResearch model: `brainstorm_id`, `research_type` (market_lookup | competitor_spot | trend_signal), `query`, `result` (jsonb), `created_at`. Multiple runs per brainstorm retained.
- [x] Integrate Claude API with web search tool for each research type. Define lightweight structured output (summary, links, key takeaways) — not the full HLD analysis schema.
- [x] Endpoints: `POST /:username/:slug/research` (body: research_type, query; trigger run), `GET /:username/:slug/research`, `GET /:username/:slug/research/:id`. Authorize owner/collaborator for POST; viewer can GET.
- [x] Each research type: market_lookup (products/trends in a space), competitor_spot (names, URLs, one-line descriptions), trend_signal (demand signals, qualitative summary with caveats).

**Acceptance criteria:**

- User can trigger each research type with a query; result is stored and returned. Listing research returns history with timestamps.
- Results contain structured data (e.g. summary, list of competitors or links) suitable for simple UI display. Unauthorized users cannot run research; viewers can view results.

**Test plan (manual):**

1. In a brainstorm, run a market lookup (e.g. "task management tools for small teams"). Confirm result is saved and has summary/links. Run competitor spot and trend signal; confirm both save and return valid structure.
2. View research history; select an older run; confirm result loads. As viewer, confirm read-only access to research list and results.

---

### Ticket 2.3 — Brainstorm Notes

**Description:** Add a single rich-text note per brainstorm using Tiptap, stored as JSON and auto-saved. Same editor capabilities as idea notes (headings, bold, italic, lists, links, code, blockquote). Notes feed into "Create Idea" context and keep brainstorm content in one place.

**Tasks:**

- [x] Create BrainstormNote model: `brainstorm_id`, `user_id` (last editor), `content` (jsonb for Tiptap JSON), `updated_at`. One note per brainstorm (upsert by brainstorm_id).
- [x] Endpoints: `GET /:username/:slug/note` (return note or empty when slug is brainstorm), `PUT /:username/:slug/note` (body: content JSON). Authorize owner/collaborator for write; viewer read-only.
- [x] Next.js: Notes tab in brainstorm detail with Tiptap editor. Toolbar for headings, bold, italic, lists, links, code, blockquote. Serialize to Tiptap JSON and send on save.
- [x] Auto-save: debounce 1.5s after last change; show last-saved timestamp. Viewer: read-only rendering of note content.

**Acceptance criteria:**

- Owner/collaborator can type in brainstorm Notes tab; content auto-saves after 1.5s idle and last-saved time updates. Refresh shows persisted content with formatting preserved.
- Single note per brainstorm. Viewer sees content but cannot edit.

**Test plan (manual):**

1. Open brainstorm Notes tab; type and apply bold, list, link. Wait for auto-save; confirm "Last saved at …" updates. Refresh; confirm content and formatting are intact.
2. As viewer, open Notes; confirm read-only and no save control.

---

### Ticket 2.4 — Create Idea from Brainstorm

**Description:** Allow brainstorm owner to create a new idea seeded with brainstorm title, description, and context (chat history and notes available for downstream use on the idea). New idea has `brainstorm_id` set; brainstorm is not archived or locked. Optional carry-over of brainstorm members to the idea. Idea Overview shows "From Brainstorm" link back to the source.

**Tasks:**

- [x] Backend: `POST /:username/:slug/create-idea` (when slug is a brainstorm). Body: title, description (editable from brainstorm defaults), slug (preview, editable), optional `member_ids` to carry over. Create Idea with `user_id` = current user, `brainstorm_id` = this brainstorm, slug/title/description from body. Create IdeaMembers for selected members if any.
- [x] Next.js: "Create Idea" button on brainstorm Overview tab (owner only). Modal pre-populated with brainstorm title and description; slug preview auto-generated; checkboxes per brainstorm member (all unchecked by default). On submit, call create-idea endpoint; redirect to new idea detail.
- [x] Idea detail Overview tab: when `brainstorm_id` is set, show "From Brainstorm: [title]" link that navigates to the brainstorm. Brainstorm detail Overview: when ideas exist with this brainstorm_id, show "Related Ideas" list with links (optional for M2).

**Acceptance criteria:**

- Owner can click "Create Idea" from a brainstorm; modal shows pre-filled title/description and slug; owner can edit and optionally select members to carry over. On create, idea is created with brainstorm_id set and user is redirected to idea detail.
- Brainstorm remains fully editable; no status change or lock. Idea Overview shows "From Brainstorm" link; navigating to it opens the source brainstorm.
- Creating an idea with a slug that already exists for that user (brainstorm or idea) returns validation error.

**Test plan (manual):**

1. In a brainstorm with title "My Concept," click "Create Idea." Confirm modal has title "My Concept" and description; change slug to "my-concept-v1," submit. Confirm redirect to idea and idea has "From Brainstorm: My Concept" on Overview. Click link; confirm brainstorm opens.
2. Create another idea from the same brainstorm with a different title/slug; confirm both ideas exist and both link to same brainstorm. Confirm brainstorm still has Chat, Research, Notes usable.
3. Optionally carry over one member; confirm that user appears as member on the new idea.

---

### Ticket 2.5 — Brainstorm Research UI

**Description:** Build the Research tab in the Next.js app for brainstorms: action buttons per research type (Market Lookup, Competitor Spot, Trend Signal), research history list with timestamps, result cards (summary, links, key takeaways), and loading skeleton while a run is in progress. Surfaces the research engine in a clear, scannable way.

**Tasks:**

- [x] Research tab: buttons or form to run each research type (Market Lookup, Competitor Spot, Trend Signal) with optional query input. Disable or show loading while a run is in progress.
- [x] Research history: list past runs by date; selecting one loads that result.
- [x] Result cards: display summary, links, and key takeaways from the stored JSON. Simple layout — not as heavy as Idea Analysis UI.
- [x] Loading skeleton while research is running; empty state when no research has been run.
- [x] Viewer role: show all content read-only; hide run buttons.

**Acceptance criteria:**

- User can start each research type from the UI and see progress until completion. Completed result is displayed; history allows switching between past runs.
- Result content renders from stored JSON without errors. No run button for viewers; all content is read-only for them.

**Test plan (manual):**

1. Open Research tab with no prior runs. Run a market lookup; confirm loading state, then result appears with summary and links. Run competitor spot and trend signal; confirm both display correctly.
2. Run another market lookup; switch between runs in history. Confirm data changes correctly.
3. As viewer, open Research tab; confirm run buttons are hidden and existing results are visible read-only.

---

### Ticket 2.6 — Brainstorm Linked Resources

**Description:** Allow users to attach URLs (including YouTube) to a brainstorm. Resources appear as a reference list for everyone with access and are included as targeted context when the AI is invoked (chat when @ideabot is used, and later research / Create Idea). This gives the AI concrete references to use in responses.

**Tasks:**

- [x] Create BrainstormResource model: `brainstorm_id`, `url` (required), `title` (optional), `resource_type` (url | youtube), `notes` (optional), timestamps. Infer `resource_type` from URL (e.g. youtube.com, youtu.be) when not provided.
- [x] Backend: CRUD endpoints under `/:username/brainstorms/:slug/resources` (GET list, POST create, PATCH update, DELETE). Authorize using existing brainstorm access (owner/collaborator write; viewer read-only).
- [x] Next.js: Resources section on brainstorm detail (e.g. Overview or dedicated area). Form to add link (URL, optional title/notes); list resources with edit/delete. Optional: show icon or label for YouTube vs generic URL.
- [x] When building chat context for @ideabot (Ticket 2.1), include linked resources in the request (e.g. system prompt or context block: "Reference material: [title]: [url]").

**Acceptance criteria:**

- Owner/collaborator can add, edit (title/notes), and remove linked resources. List is visible to all users with access.
- Resources are included in AI context when a message contains @ideabot; Claude can reference them in replies. Viewer can see resources but cannot add/edit/delete.

**Test plan (manual):**

1. In a brainstorm, add a URL (e.g. a YouTube link and a generic article). Confirm both appear in the resources list; edit title on one, add notes on another. Delete one resource; confirm it is removed.
2. Send a message with @ideabot that references the topic of a linked resource; confirm the reply can use or reference that material. As viewer, confirm resources list is read-only.

---

## Milestone 2 completion checklist

- [x] All six tickets (2.1–2.6) are implemented and accepted.
- [x] Users can chat in a shared brainstorm thread; @ideabot in a message triggers streaming AI responses; messages without @ideabot are saved only. Pinned insights appear on Overview.
- [x] Users can add and manage linked resources (URLs, YouTube); resources are shown in the UI and included in AI context when @ideabot is used.
- [x] Users can run brainstorm research (market lookup, competitor spot, trend signal), see results and history, and use the Research UI with correct role behavior.
- [x] Users can take notes in brainstorms with Tiptap and auto-save.
- [x] Owners can create an idea from a brainstorm with context and optional member carry-over; idea links back to brainstorm; brainstorm remains usable.
