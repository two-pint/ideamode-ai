# IdeaMode — Personas & product fit

This document maps **who the product is for**, **what they need** (must-have vs nice-to-have), and **how the current build** aligns. It complements the [High-Level Design](./ideamode-hld.md) and [milestones](./milestones/README.md). Update it when positioning or roadmap shifts.

---

## Persona A — Solo founder / indie builder

**Job to be done:** Capture sparks, think with AI, and turn the best thread into something shippable (PRD, tasks) without fighting the tool.

| Priority | Need | Fit with current build |
|----------|------|-------------------------|
| **Must-have** | Fast capture + resume | **Strong:** dashboard with recent activity, global search (`GET /me/search`), command-palette entry in the app shell. |
| **Must-have** | One place to “mess around” vs “commit” | **Strong:** brainstorm vs idea split; optional link from brainstorm → idea. |
| **Must-have** | AI that stays in context | **Strong:** chat, research, discussion, analysis, PRD flows on resource detail pages. |
| **Must-have** | Reliable authenticated experience | **Strong:** Google SSO, username claim, session-backed API. |
| **Nice-to-have** | Mobile capture | **Gap:** Expo app is still minimal; marketing copy may oversell phone “capture” until mobile ships. |
| **Nice-to-have** | Search inside long chats / PRD / notes blobs | **Out of scope for M4.6:** [milestone 4.6](./milestones/milestone_4_6.md) covers **titles** and the short **description** field on brainstorms/ideas; full-text in transcripts and documents is later. |
| **Nice-to-have** | Theme / long-session comfort | **Present:** light/dark on web. |

**Verdict:** Best fit today. No org requirement; sharing is optional; core loop (explore → validate → document) is implemented on web.

---

## Persona B — Small team (2–10)

**Job to be done:** A few people see the same brainstorms and ideas, collaborate, and avoid re-inviting or re-sharing on every new artifact.

| Priority | Need | Fit with current build |
|----------|------|-------------------------|
| **Must-have** | Invite + access control | **Strong:** per-resource members and invites (brainstorms and ideas). |
| **Must-have** | Discover teammates’ work | **Good:** permission-aware global search; lists that separate owned vs shared (e.g. brainstorm board). |
| **Must-have** | Clear ownership of URLs / spaces | **Adequate but fiddly:** everything is under `/:username/...`; there is no shared team namespace yet. |
| **Must-have** | Onboarding a new teammate | **Weak:** no org directory; sharing is largely per-resource or via links. |
| **Nice-to-have** | Billing / seats | **Not in scope** for [milestone 5](./milestones/milestone_5.md) MVP. |
| **Nice-to-have** | Org-wide defaults (visibility, templates) | **Not shipped** until organizations exist. |

**Verdict:** Works for project-sized groups comfortable with GitHub-style sharing. Friction grows with many resources, turnover, or a need for “the Acme workspace” — addressed by [milestone 5 — Organizations](./milestones/milestone_5.md).

---

## Persona C — Enterprise (later)

**Job to be done:** Trust, compliance, administration, and predictable cost at larger scale.

| Priority | Need | Fit with current build |
|----------|------|-------------------------|
| **Must-have (later)** | Org-owned content + admin roles | **Planned:** organizations, membership, `/o/[orgSlug]/...` routes; see [milestone 5](./milestones/milestone_5.md). |
| **Must-have (later)** | SSO (SAML/OIDC), SCIM, domain claim | Not part of current milestone scope; typical follow-on to orgs. |
| **Must-have (later)** | Audit log, export, retention | Not documented as shipped scope in current milestones. |
| **Must-have (later)** | Security narrative | **Partial today:** unauthorized access returns 404; enterprise needs explicit policy, reporting, and procurement artifacts. |
| **Nice-to-have** | Mobile for field / exec use | Depends on real mobile product work. |

**Verdict:** Roadmap points toward orgs first; full enterprise fit is a later chapter (identity, billing, compliance).

---

## Cross-persona capability matrix

| Capability | Solo | Small team | Enterprise (later) |
|------------|------|------------|----------------------|
| Core brainstorm + idea workflows | Must | Must | Must |
| AI surfaces (chat, PRD, analysis, etc.) | Must | Must | Must |
| Sharing / invites | Nice | Must | Must |
| Global search (permission-aware, titles) | Must | Must | Must |
| Org / team workspace | Nice | Must at scale | Must |
| Search inside transcripts / long content | Nice | Nice | Often must |
| Mobile capture | Nice | Nice | Nice–must |
| Billing / SSO / audit | — | Nice | Must |

---

## How to use this doc

- **ICP (today):** Lead with solo builders and tight teams; describe “team workspace” as **on the roadmap** ([milestone 5](./milestones/milestone_5.md)), not as fully shipped.
- **Sequencing:** [Global search](./milestones/milestone_4_6.md) before orgs helps both solos (findability) and small teams (shared discovery) without committing to multitenancy first.
- **Positioning risk:** “Capture” on mobile should match the actual Expo app experience, or copy should qualify it until mobile is substantive.

---

## Related docs

- [High-Level Design](./ideamode-hld.md) — product vision and architecture
- [Milestones & tickets](./milestones/README.md) — delivery breakdown
- [Milestone 4.6 — Global Search](./milestones/milestone_4_6.md) — search scope and limits
- [Milestone 5 — Organizations](./milestones/milestone_5.md) — team workspace plan
