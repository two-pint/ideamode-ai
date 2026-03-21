# Milestone 4.5 — UI Standardization & Polish

**Goal:** Establish a single visual and interaction language across web (and mobile where applicable): semantic colors (**primary**, **secondary**, **success**, **destructive**), consistent **shadcn** buttons and states, **Lucide-only** icons, and **toasts** for save/delete and other mutations so the app feels cohesive before beta polish.

**Timeline:** End of Week 5 (after M4 deliverables)  
**Depends on:** Milestone 4 (Productivity Layer)  
**Status:** Implemented in repo (see **Delivered** below). Further polish can follow in Milestone 5.

---

## Tickets

### Ticket 4.5.1 — Design tokens & theme semantics

**Description:** Document and implement CSS semantic variables for `primary`, `secondary`, `success`, and `destructive` (plus matching foreground/contrast tokens) in light and dark themes. Align naming with existing shadcn-style variables in [`apps/web/app/globals.css`](../../apps/web/app/globals.css) so components use one source of truth.

**Tasks:**

- [x] Add and document `--success` and `--success-foreground` (and map them in `@theme inline` for Tailwind utilities), consistent with existing `--primary`, `--secondary`, `--destructive` patterns.
- [x] Confirm light/dark values meet contrast for text on filled buttons and for destructive actions.
- [x] Add a short “usage” note in this repo (e.g. in AGENTS.md or a `docs/ui/` snippet): when to use primary vs secondary vs success vs destructive in UI copy and controls.

**Acceptance criteria:**

- Success and destructive (and existing primary/secondary) have defined tokens in both `:root` and `.dark` with documented intent.
- Tailwind can target success colors where needed (e.g. `bg-success` / `text-success-foreground` if mapped).

**Test plan (manual):**

1. Toggle light/dark; confirm primary, secondary, success, and destructive backgrounds/foregrounds look correct on sample buttons or swatch.
2. Verify no regression to existing pages that use `primary`, `secondary`, `destructive` classes.

---

### Ticket 4.5.2 — Buttons & interaction states

**Description:** Standardize on **shadcn** `Button` variants so primary maps to `default`, secondary to `secondary`, destructive actions to `destructive`, and positive confirmation actions can use a dedicated **`success`** variant.

**Tasks:**

- [x] Extend [`apps/web/components/ui/button.tsx`](../../apps/web/components/ui/button.tsx) with a `success` variant using success semantic tokens.
- [x] Audit high-traffic actions (create, save, delete, cancel) and replace ad-hoc classes with the appropriate variant where straightforward.
- [x] Ensure focus-visible ring and disabled styles match across variants.

**Acceptance criteria:**

- `Button` supports at least: `default` (primary), `secondary`, `success`, `destructive`, plus existing `outline` / `ghost` / `link` as needed.
- Destructive flows (e.g. delete) use `variant="destructive"` or equivalent consistently.

**Test plan (manual):**

1. Open pages with primary CTAs, secondary actions, and delete buttons; confirm variants match intent.
2. Tab through buttons; confirm visible focus ring on each variant.

---

### Ticket 4.5.3 — Iconography (Lucide-only)

**Description:** Enforce **Lucide** as the only icon set (web: `lucide-react`; mobile: `lucide-react-native` per AGENTS.md). Reduce mixed or one-off SVGs.

**Tasks:**

- [x] Audit `apps/web` (and mobile app if present) for non-Lucide icons; replace with closest Lucide equivalent or get product exception.
- [x] Document standard sizes (e.g. 16px in buttons via existing `[&_svg]:size-4`, 20–24px in headers) and spacing next to labels.

**Acceptance criteria:**

- New UI uses Lucide only; legacy outliers are listed and tracked if any must remain temporarily.

**Test plan (manual):**

1. Spot-check dashboard, brainstorm detail, idea detail; icons render and align with button/list layouts.

---

### Ticket 4.5.4 — Toasts & mutation feedback

**Description:** Use **Sonner** (shadcn pattern) for lightweight feedback on mutations: saved, deleted, created, updated, and errors so users trust async actions. Milestone 5 Ticket 5.2 may extend coverage; this ticket establishes the pattern and provider.

**Tasks:**

- [x] Add via shadcn: from `apps/web`, run `pnpm dlx shadcn@latest add sonner` (installs `sonner` and `components/ui/sonner.tsx`). **Do not use `next-themes` for IdeaMode** — wire `Toaster` to [`apps/web/lib/theme-context.tsx`](../../apps/web/lib/theme-context.tsx) and mount once in [`apps/web/components/providers.tsx`](../../apps/web/components/providers.tsx).
- [x] Expose a small helper (e.g. `toastSuccess`, `toastError`) or document `import { toast } from "sonner"` conventions to avoid duplicate wrappers.
- [x] Wire toasts for representative flows: e.g. note auto-save success/failure, task add/toggle/delete, wireframe/PRD save if applicable.
- [x] Prefer success toasts after explicit save; debounce or throttle noisy auto-save toasts if needed (e.g. “Saved” once per idle burst, not per keystroke).

**Acceptance criteria:**

- Toaster is present app-wide; theme matches light/dark toggle.
- At least the agreed “high-traffic” flows show success or error toasts; destructive deletes confirm with a toast or existing confirmation plus toast on completion.

**Test plan (manual):**

1. Perform save and delete in wired flows; confirm success and error toasts.
2. Toggle dark mode; confirm toast styling matches theme.

---

## Milestone 4.5 completion checklist

- [x] Semantic colors (primary, secondary, success, destructive) are defined and usable.
- [x] `Button` variants are standardized, including `success` and `destructive`.
- [x] Lucide-only icon policy is applied or exceptions are documented.
- [x] Sonner toasts are integrated and cover baseline mutation feedback; M5 can expand breadth.

---

## Delivered (implementation map)

| Area | Location |
|------|-----------|
| **Tokens** | [`apps/web/app/globals.css`](../../apps/web/app/globals.css) — `--success` / `--success-foreground`, `@theme` → `color-success*` |
| **Semantic docs** | [`docs/ui/semantic-ui.md`](../ui/semantic-ui.md), links from [`AGENTS.md`](../../AGENTS.md) |
| **Icons doc & exceptions** | [`docs/ui/icons.md`](../ui/icons.md) |
| **Button `success`** | [`apps/web/components/ui/button.tsx`](../../apps/web/components/ui/button.tsx) |
| **Badge `secondary` / `outline`** | [`apps/web/components/ui/badge.tsx`](../../apps/web/components/ui/badge.tsx) (for analysis UI, etc.) |
| **Toaster + theme** | [`apps/web/components/ui/sonner.tsx`](../../apps/web/components/ui/sonner.tsx), [`apps/web/components/providers.tsx`](../../apps/web/components/providers.tsx) |
| **Toast helpers** | [`apps/web/lib/toast.ts`](../../apps/web/lib/toast.ts) — `toastAutosave*` + stable ids for notes/wireframes |
| **Autosave toasts** | [`idea-notes-editor.tsx`](../../apps/web/components/idea-notes-editor.tsx), [`brainstorm-notes-editor.tsx`](../../apps/web/components/brainstorm-notes-editor.tsx), [`idea-wireframes-tab.tsx`](../../apps/web/components/idea-wireframes-tab.tsx) |
| **Tasks / PRD** | [`idea-tasks-tab.tsx`](../../apps/web/components/idea-tasks-tab.tsx), [`idea-prd-tab.tsx`](../../apps/web/components/idea-prd-tab.tsx) |
| **Overview save/delete** | [`ideas/[slug]/page.tsx`](../../apps/web/app/[username]/ideas/[slug]/page.tsx), [`brainstorms/[slug]/page.tsx`](../../apps/web/app/[username]/brainstorms/[slug]/page.tsx) — `variant="destructive"` for delete |
| **Resources & sharing** | [`brainstorm-resources.tsx`](../../apps/web/components/brainstorm-resources.tsx), [`share-dialog.tsx`](../../apps/web/components/share-dialog.tsx), [`resource-access-list.tsx`](../../apps/web/components/resource-access-list.tsx) |

**Follow-ups (optional, M5 or later):** Broader toast coverage (modals, dashboard), full `text-red-*` → `text-destructive` pass, and any remaining icon SVG audits outside documented exceptions.
