# IdeaMode — Milestones & Tickets

This folder breaks the [High-Level Design](../ideamode-hld.md) into **logical milestones** and **tickets**. All Node.js tooling (Turborepo, Next.js, Expo) uses **pnpm** — run `pnpm install`, `pnpm run build`, `pnpm run dev`, etc. from the repo root or app directories. Each milestone is in its own markdown file; each ticket includes a title, description, detailed tasks (with checkboxes), acceptance criteria, and test plans for manual review.

## Milestone order

| # | File | Goal | Depends on |
|---|------|------|------------|
| 0 | [milestone_0.md](./milestone_0.md) | **Base app architecture** — Turborepo, Rails 8 API, Next.js web, Expo mobile | — |
| 1 | [milestone_1.md](./milestone_1.md) | **Foundation** — Auth (Google SSO), Ideas CRUD, Membership, Dashboard & nav | M0 |
| 2 | [milestone_2.md](./milestone_2.md) | **Core AI value** — Brainstorm chat, Analysis engine, Analysis UI | M1 |
| 3 | [milestone_3.md](./milestone_3.md) | **Productivity layer** — Notes, Tasks, Wireframes, PRD generator | M2 |
| 4 | [milestone_4.md](./milestone_4.md) | **Polish & beta** — Onboarding, responsive/error polish, beta invite gate | M3 |

## Ticket structure (per ticket)

- **Title** — Short name for the ticket
- **Description** — What the ticket is for and why it matters
- **Tasks** — Detailed checklist of work (implementer checks off)
- **Acceptance criteria** — Conditions that must hold for the ticket to be done
- **Test plan** — Steps for reviewers to perform during manual testing

## Quick reference

- **Milestone 0:** 4 tickets (Turborepo, Rails API, Next.js, Expo)
- **Milestone 1:** 4 tickets (Auth, Ideas CRUD, Membership, Dashboard)
- **Milestone 2:** 3 tickets (Brainstorm, Analysis engine, Analysis UI)
- **Milestone 3:** 4 tickets (Notes, Tasks, Wireframes, PRD)
- **Milestone 4:** 3 tickets (Onboarding, Responsive/error, Beta gate)

**Total: 5 milestones, 18 tickets.**
