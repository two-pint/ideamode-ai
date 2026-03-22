# IdeaMode — Milestones & Tickets

This folder breaks the [High-Level Design](../ideamode-hld.md) into **logical milestones** and **tickets**. All Node.js tooling (Turborepo, Next.js, Expo) uses **pnpm** — run `pnpm install`, `pnpm run build`, `pnpm run dev`, etc. from the repo root or app directories. Each milestone is in its own markdown file; each ticket includes a title, description, detailed tasks (with checkboxes), acceptance criteria, and test plans for manual review.

## Milestone order

| # | File | Goal | Depends on |
|---|------|------|------------|
| 0 | [milestone_0.md](./milestone_0.md) | **Base app architecture** — Turborepo, Rails 8 API, Next.js web, Expo mobile | — |
| 1 | [milestone_1.md](./milestone_1.md) | **Foundation** — Auth, Brainstorms CRUD, Ideas CRUD, Membership (both), Dashboard (two tabs) & nav | M0 |
| 2 | [milestone_2.md](./milestone_2.md) | **Brainstorm features** — Shared chat (@ideabot trigger), Linked resources, Research, Notes, Create idea from brainstorm, Research UI | M1 |
| 3 | [milestone_3.md](./milestone_3.md) | **Idea AI value** — Discussion chat, Analysis engine, Analysis UI | M2 |
| 4 | [milestone_4.md](./milestone_4.md) | **Productivity layer** — Notes (ideas), Tasks, Wireframes, PRD generator | M3 |
| 4.5 | [milestone_4_5.md](./milestone_4_5.md) | **UI standardization** — Semantic colors, buttons, Lucide icons, mutation toasts | M4 |
| 5 | [milestone_5.md](./milestone_5.md) | **Organizations** — Orgs, org membership, org-scoped brainstorms & ideas (`/o/...`) | M4.5 |
| 6 | [milestone_6.md](./milestone_6.md) | **Polish & beta** — Onboarding, responsive/error polish, beta invite gate | M4.5 |

## Ticket structure (per ticket)

- **Title** — Short name for the ticket
- **Description** — What the ticket is for and why it matters
- **Tasks** — Detailed checklist of work (implementer checks off)
- **Acceptance criteria** — Conditions that must hold for the ticket to be done
- **Test plan** — Steps for reviewers to perform during manual testing

## Quick reference

- **Milestone 0:** 4 tickets (Turborepo, Rails API, Next.js, Expo)
- **Milestone 1:** 5 tickets (Auth, Brainstorms CRUD, Ideas CRUD, Membership, Dashboard & nav)
- **Milestone 2:** 6 tickets (Shared brainstorm chat with @ideabot, Linked resources, Brainstorm research, Brainstorm notes, Create idea from brainstorm, Research UI)
- **Milestone 3:** 3 tickets (Discussion chat, Analysis engine, Analysis UI)
- **Milestone 4:** 4 tickets (Notes ideas, Tasks, Wireframes, PRD)
- **Milestone 4.5:** 4 tickets (Design tokens, Buttons, Lucide icons, Toasts)
- **Milestone 5:** 3 tickets (Organizations & membership backend, Org-scoped brainstorms & ideas backend, Organizations UI)
- **Milestone 6:** 3 tickets (Onboarding, Responsive/error, Beta gate)

**Total: 8 milestone docs, 32 tickets.**
