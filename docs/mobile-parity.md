# Web → mobile (Expo) parity — personal workspace

This maps primary **web** routes and capabilities to **`apps/mobile`** screens for the personal-workspace scope (`/:username/...`). **Organization routes (`/o/...`)** are out of scope until [Milestone 5](milestones/milestone_5.md).

| Web | Mobile | Notes |
|-----|--------|--------|
| Login / Google OAuth | `app/login.tsx` | Password + Google; API `FRONTEND_URL` must match Expo redirect. |
| Set username | `app/set-username.tsx` | Same contract as web `/auth/set-username`. |
| Dashboard (recent activity) | `app/(tabs)/index.tsx` | Uses `GET /me/recent_access`. |
| Brainstorms list | `app/(tabs)/brainstorms.tsx` | Yours + shared; pull-to-refresh. |
| Ideas list | `app/(tabs)/ideas.tsx` | Yours + shared. |
| Global search | `app/(tabs)/search.tsx` | `GET /me/search`; debounced. |
| Profile | `app/(tabs)/profile.tsx` | Invitations + sign out. |
| Invitations | `app/invitations.tsx` | Accept + decline (`POST /invites/:token/decline`). |
| Brainstorm detail | `app/brainstorm/[username]/[slug].tsx` | Chat, research, notes, resources, sharing; metadata edit; **create idea** (owner). |
| Idea detail | `app/idea/[username]/[slug].tsx` | Discussion, analysis, notes, tasks, PRD, sharing; pinned overview; metadata edit. |
| Idea **Wireframes** (Excalidraw) | **N/A** | Not shipped on mobile; use web for canvas editing. |
| PRD | Idea → PRD tab | Generate + list versions; text-oriented UI. |
| Rich notes (Tiptap JSON) | Notes tabs | JSON / plain text editing; not a full rich editor. |

**Theming:** Mobile follows **system light/dark** via `ThemeProvider` (`useColorScheme`) and semantic tokens aligned with `apps/web/app/globals.css`.

**Deep links / universal links:** Optional; not implemented (open via in-app navigation and lists).
