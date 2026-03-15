# IdeaMode

Monorepo for [IdeaMode](https://ideamode.ai): Rails API, Next.js web app, and Expo mobile app. All Node.js tooling uses **pnpm**.

## Structure

- **`apps/api`** — Rails 8 API (PostgreSQL). Run with `bin/rails s` from `apps/api`.
- **`apps/web`** — Next.js (App Router, TypeScript, Tailwind). Run with `pnpm run dev` from `apps/web` or via root `pnpm dev`.
- **`apps/mobile`** — Expo (React Native). Run with `pnpm exec expo start` from `apps/mobile`.
- **`packages/assets`** — Shared brand assets (icon and logo SVGs). Consumed by web and mobile via workspace dependency `@ideamode/assets`. Do not duplicate these in each app; add new shared assets here.

## Setup

1. **Install dependencies (root):**
   ```bash
   pnpm install
   ```

2. **API (Rails):**
   ```bash
   cd apps/api
   bundle install
   bin/rails db:prepare
   bin/rails s
   ```
   Default: http://localhost:3000. Health check: `GET /health`.

3. **Web:**
   ```bash
   cd apps/web
   pnpm run dev
   ```
   Default: http://localhost:8080. Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3000`) in `.env.local` to point at the API.

4. **Mobile:**
   ```bash
   cd apps/mobile
   pnpm exec expo start
   ```
   Set `EXPO_PUBLIC_API_URL` in `.env` or app config to point at the API (e.g. your machine’s IP for a physical device).

## Root scripts

From repo root:

- `pnpm run build` — Build all apps that define a `build` task.
- `pnpm run dev` — Run dev for all apps (Turbo); or run each app from its directory as above.
- `pnpm run lint` — Lint all apps.
- `pnpm run test` — Test all apps.

## Docs

- [High-Level Design](docs/ideamode-hld.md)
- [Milestones & tickets](docs/milestones/README.md)
- [Shared assets plan](docs/shared-assets-plan.md)
