# Milestone 0 — Base App Architecture

**Goal:** Establish a Turborepo monorepo containing a Rails 8 API, a Next.js web app, and an Expo mobile app so all clients share one repo and consistent tooling.

**Timeline:** Week 1  
**Depends on:** None

---

## Tickets

### Ticket 0.1 — Turborepo monorepo setup

**Description:** Create the root Turborepo with workspaces for `api`, `web`, and `mobile`. This gives a single repo for all IdeaMode apps, shared scripts, and cached builds. It matters because it keeps backend and frontends in sync, simplifies CI, and allows shared TypeScript types and configs later.

**Tasks:**

- [x] Initialize a new Turborepo at the repo root (e.g. `pnpm dlx create-turbo@latest` or manual `turbo` setup). Use pnpm as the package manager.
- [x] Configure `turbo.json` with a pipeline that defines build/dev/lint/test for each workspace.
- [x] Add `apps/api`, `apps/web`, and `apps/mobile` to `pnpm-workspace.yaml`; add `packages/*` so shared packages (e.g. assets) are in the workspace.
- [x] Add a root `package.json` with scripts: `build`, `dev`, `lint`, `test` that run via Turbo.
- [x] Add a root `.gitignore` covering all three apps (node_modules, .next, dist, build, .expo, tmp, log, .env\*).
- [x] Create `packages/assets` (or `packages/brand`) as the shared-assets package; move `ideamode_icon.svg` and `ideamode_logo.svg` from repo root into it. Add a short README listing each file and where it’s used (see [Shared assets plan](../shared-assets-plan.md)).
- [x] Document in root README how to install dependencies and run all apps from the repo root, and that brand assets live in `packages/assets`.

**Acceptance criteria:**

- From repo root, `pnpm run build` (or `pnpm build`) runs the build pipeline for all apps that support it.
- From repo root, `pnpm run dev` (or `pnpm dev`) can start dev mode for api, web, and mobile (or documented per-app commands).
- Each app lives under `apps/<name>` and is referenced correctly in the Turbo pipeline. Shared assets live in `packages/assets` (icon and logo SVGs); web and mobile consume them via workspace dependency.
- New clone can run `pnpm install` at root and then build/run each app from root or from `apps/<name>`.

**Test plan (manual):**

1. Clone repo, run `pnpm install` at root. Confirm no errors.
2. Run `pnpm run build` at root. Confirm api, web, and mobile build (or skip mobile if build not configured yet) without errors.
3. Run `pnpm run dev` (or per-app dev). Confirm api and web dev servers start; confirm mobile can be started from `apps/mobile` if applicable.
4. Change a file in `apps/web`, run build again. Confirm Turbo cache is used where expected (optional: check turbo output).

---

### Ticket 0.2 — Rails 8 API application

**Description:** Add a Rails 8 API-only application under `apps/api` with PostgreSQL, minimal config, and a health endpoint. This is the backend for the Next.js and Expo clients. Getting the API in the monorepo first ensures the contract (e.g. JSON, health check) is the single source of truth for all clients.

**Tasks:**

- [x] Create a new Rails 8 application in `apps/api` with API-only mode (`--api`).
- [x] Configure PostgreSQL as the database (database.yml and env-based URL if needed).
- [x] Add a health check route (e.g. `GET /health` or `GET /up`) that returns 200 and a simple payload (e.g. `{ "status": "ok" }`).
- [x] Ensure CORS is configured to allow requests from the Next.js origin (and optionally Expo dev) in development.
- [x] Add a root route or minimal readme in the API app describing how to run it (`bin/rails s`, port, etc.).
- [x] Wire the API into the Turborepo pipeline (e.g. script that runs `bundle install` and `bin/rails db:prepare` for build, and `bin/rails s` for dev if desired, or document manual steps).

**Acceptance criteria:**

- `apps/api` is a valid Rails 8 API app that boots without errors.
- `GET /health` (or chosen path) returns 200 and JSON.
- Database can be created and migrated (or schema loaded) with `bin/rails db:prepare` (or equivalent).
- From repo root or `apps/api`, running the Rails server allows the Next.js app to call the health endpoint without CORS errors in dev.

**Test plan (manual):**

1. From `apps/api`, run `bundle install`, `bin/rails db:create db:migrate` (or `db:prepare`). Confirm no errors.
2. Start Rails with `bin/rails s`. Open `http://localhost:3000/health` (or configured port/path). Confirm 200 and JSON body.
3. Start the Next.js app and, from the browser or a small fetch in a page, call the API health URL. Confirm no CORS error and correct response.
4. Stop and restart the API; confirm it boots cleanly.

---

### Ticket 0.3 — Next.js web application

**Description:** Add a Next.js application under `apps/web` with App Router, TypeScript, and Tailwind CSS using the product theme (zinc-50 background, zinc-900 text, light mode only). This is the primary web client for IdeaMode and must match the HLD stack and design from day one.

**Tasks:**

- [x] Create a new Next.js app in `apps/web` with App Router and TypeScript.
- [x] Install and configure Tailwind CSS.
- [x] Apply global styles: background `zinc-50`, primary text `zinc-900`, light mode only (no dark mode or theme toggle).
- [x] Add a minimal root layout and a home or placeholder page that renders with the correct background and text color.
- [x] Configure the app to use the API base URL via environment variable (e.g. `NEXT_PUBLIC_API_URL`) and document it in README or .env.example.
- [x] Integrate the web app into the Turborepo pipeline (build and dev scripts). Add dependency on `@ideamode/assets` (or `@repo/assets`); use `ideamode_icon.svg` for favicon and `ideamode_logo.svg` for header/login/marketing as needed.

**Acceptance criteria:**

- Next.js app runs with `pnpm run dev` from `apps/web` (or via root turbo dev).
- App uses Tailwind; the main content area has background zinc-50 and text zinc-900.
- No dark mode or theme switcher is present.
- Environment variable for API URL is documented and used where the app will call the API (e.g. health check or future auth).

**Test plan (manual):**

1. From `apps/web`, run `pnpm install` and `pnpm run dev`. Open the app in the browser. Confirm the page has a light gray background (zinc-50) and dark gray text (zinc-900).
2. Resize the window; confirm layout doesn’t break (minimal check).
3. Set `NEXT_PUBLIC_API_URL` to the Rails API URL. If a health-check or API call exists on the placeholder page, confirm it hits the API and displays or logs success.
4. Confirm there is no dark mode toggle and no `dark:` Tailwind classes in the main layout.

---

### Ticket 0.4 — Expo mobile application

**Description:** Add an Expo (React Native) application under `apps/mobile` with TypeScript and config to call the same Rails API. This establishes the mobile client early so the API can be designed with web and mobile in mind; actual features will be built in later milestones.

**Tasks:**

- [x] Create a new Expo app in `apps/mobile` (e.g. `pnpm dlx create-expo-app` or equivalent) with TypeScript.
- [x] Configure the app to read the API base URL from environment (e.g. `EXPO_PUBLIC_API_URL` or app config) so it can call the same Rails API as the web app.
- [x] Add a minimal screen that displays a message (e.g. "IdeaMode Mobile") and optionally calls the API health endpoint to verify connectivity.
- [x] Document how to run the app (Expo Go, dev build) and how to set the API URL for local and staging.
- [x] Add dependency on `@ideamode/assets`; use icon for app icon (and export PNG for native if needed) and logo for splash/auth/header.
- [x] Integrate the mobile app into the Turborepo pipeline (e.g. build script that runs `pnpm exec expo prebuild` or equivalent if needed; at minimum document `pnpm exec expo start` from `apps/mobile`).

**Acceptance criteria:**

- `apps/mobile` is a valid Expo app that runs with `pnpm exec expo start` from `apps/mobile`.
- The app loads in Expo Go (or a dev build) and shows the placeholder screen.
- API base URL is configurable via env or app config; when set to the running Rails API, the health check (if implemented) succeeds.
- Root README or `apps/mobile/README.md` explains how to run the mobile app and point it at the API.

**Test plan (manual):**

1. From `apps/mobile`, run `pnpm install` and `pnpm exec expo start`. Open the app in Expo Go on a device or simulator. Confirm the placeholder screen appears.
2. Set the API URL to the running Rails server. If the app has a health-check button or auto-call, confirm it returns success (or that the request reaches the API).
3. Confirm the app is listed in the root Turborepo config and that root-level docs mention the mobile app.

---

## Milestone 0 completion checklist

- [x] All four tickets (0.1–0.4) are implemented and accepted.
- [x] From a fresh clone, a developer can run `pnpm install` at root, start the API and web app, and open the web app with correct theme and API connectivity.
- [x] Mobile app runs and can be pointed at the same API.
- [x] Root README describes the monorepo layout and how to run each app.

---

**Status: Complete** (built March 2026)
