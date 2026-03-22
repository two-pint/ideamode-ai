# IdeaMode

Monorepo for [IdeaMode](https://ideamode.ai): Rails API, Next.js web app, and Expo mobile app. All Node.js tooling uses **pnpm**.

## Structure

- **`apps/api`** — Rails 8 API (PostgreSQL). Run with `bin/rails s` from `apps/api`.
- **`apps/web`** — Next.js (App Router, TypeScript, Tailwind). Run with `pnpm run dev` from `apps/web` or via root `pnpm dev`.
- **`apps/mobile`** — Expo (React Native). Run with `pnpm exec expo start` from `apps/mobile`.
- **`packages/assets`** — Shared brand assets (icon and logo SVGs). Consumed by web and mobile via workspace dependency `@ideamode/assets`. Do not duplicate these in each app; add new shared assets here.

---

## Getting started (local development)

### Language versions

| Tool    | Version   | Source in repo        |
|---------|-----------|------------------------|
| Ruby    | **3.3.5** | `apps/api/.ruby-version` |
| Node.js | **20.x** (LTS recommended) | Root `package.json` `engines.node` (`>=20`) |
| pnpm    | **9.14.2** | Root `package.json` `packageManager` |

The repo includes a **`.tool-versions`** file for [asdf](https://asdf-vm.com) so `asdf install` picks consistent Ruby and Node versions.

### Install asdf and plugins

1. Install [asdf](https://asdf-vm.com/guide/getting-started.html) using your platform’s instructions (Homebrew on macOS is typical).

2. Add the language plugins:

   ```bash
   asdf plugin add ruby https://github.com/asdf-vm/asdf-ruby.git
   asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
   ```

   On macOS, the Node plugin may need OpenPGP keys so `asdf install nodejs` can verify downloads—follow the [asdf-nodejs README](https://github.com/asdf-vm/asdf-nodejs) if prompted.

3. From the **repository root**, install the pinned versions:

   ```bash
   cd /path/to/ideamode-ai
   asdf install
   ```

4. **pnpm** is not listed in `.tool-versions` (use Node’s **Corepack**; ships with Node 16.13+):

   ```bash
   corepack enable
   corepack prepare pnpm@9.14.2 --activate
   ```

   Confirm: `pnpm -v` should print **9.14.x**.

   If you use **asdf** and see **“No version is set for command pnpm”**, the **asdf `pnpm` plugin** is probably installed. This repo does **not** pin pnpm in `.tool-versions`; use **Corepack** for pnpm instead: **`asdf plugin remove pnpm`**, then **`corepack enable`** and **`corepack prepare pnpm@9.14.2 --activate`** with your active Node. Per-app **`.tool-versions`** files under **`apps/*`** only set **Ruby** / **Node** so versions resolve when your cwd is an app directory (e.g. **`apps/api`**).

### PostgreSQL

The API expects **PostgreSQL** (development DB name `api_development` per `apps/api/config/database.yml`). Install and run it outside asdf, for example:

- **macOS (Homebrew):** `brew install postgresql@16`, then `brew services start postgresql@16` (or follow `brew info postgresql@16`).
- Ensure your OS user can connect via the default local socket (typical on macOS/Linux), or set `API_DATABASE_PASSWORD` / `host` in `database.yml` as needed for your setup.

You do **not** need Redis for local development (Action Cable uses the `async` adapter in development).

### Monorepo install

From the **repo root**:

```bash
pnpm install
```

This installs all workspace packages (web, mobile, shared packages) using the root lockfile.

### API (`apps/api`)

```bash
cd apps/api
bundle install
cp .env.example .env
# Edit `.env` — see [Environment variables](#environment-variables) below
bin/rails db:prepare
bin/rails s
```

- Default: **http://localhost:3000**
- Health check: `GET http://localhost:3000/health`

JWT signing uses `Rails.application.credentials.secret_key_base` when present, otherwise **`JWT_SECRET`** in the environment. For local dev, Rails credentials usually provide `secret_key_base`; if you hit “JWT secret not configured”, set `JWT_SECRET` in `.env` to a long random string.

### Web (`apps/web`)

In a second terminal:

```bash
cd apps/web
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your API origin (default http://localhost:3000)
pnpm run dev
```

- Default: **http://localhost:8080**

### Mobile (`apps/mobile`)

The Expo app targets **personal-workspace parity** with the web app (auth, lists, search, brainstorm/idea detail tabs, invitations). Copy `apps/mobile/.env.example` to `.env` and set **`EXPO_PUBLIC_API_URL`** to your Rails API. On a **physical device**, use your computer’s LAN IP (same Wi‑Fi as the phone), not `localhost`. For **Google sign-in**, the API’s **`FRONTEND_URL`** must match the OAuth redirect your app uses (Expo dev client / redirect URI); see `apps/mobile/app/login.tsx` and the API `.env.example`.

```bash
cd apps/mobile
cp .env.example .env
# Device example: EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
pnpm exec expo start
```

Optional: **`EXPO_PUBLIC_WEB_APP_URL`** points to the Next.js app for “open in browser” (e.g. wireframes); default in dev is `http://localhost:8080`.

---

## Environment variables

### API — `apps/api/.env`

Copy from `apps/api/.env.example`. Loaded in development via `dotenv-rails`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `FRONTEND_URL` | Yes (typical dev) | Browser origin for OAuth redirects, e.g. `http://localhost:8080` |
| `ANTHROPIC_API_KEY` | Yes for AI features | Claude: brainstorm chat, PRD, research, analysis, etc. |
| `GOOGLE_CLIENT_ID` | For Google sign-in | OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | For Google sign-in | OAuth client secret |
| `JWT_SECRET` | If no `secret_key_base` in credentials | Signs API JWTs for the web app |

Optional: `API_DATABASE_PASSWORD`, `REDIS_URL` (production-style cable/queue), `PORT`, etc.—see `apps/api/config` for usage.

### Web — `apps/web/.env.local`

Copy from `apps/web/.env.example`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the Rails API (e.g. `http://localhost:3000`) |

`NEXT_PUBLIC_*` variables are exposed to the browser; keep secrets only on the API.

### Mobile — `apps/mobile/.env`

Copy from `apps/mobile/.env.example`.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Base URL of the Rails API (use LAN IP for a real device) |
| `EXPO_PUBLIC_WEB_APP_URL` | Origin of the web app for deep links such as “open in browser” (wireframes, full editor); defaults to `http://localhost:8080` in `.env.example` |

---

## Root scripts

From repo root:

- `pnpm run build` — Build all apps that define a `build` task.
- `pnpm run dev` — Run dev for all apps (Turbo); or run each app from its directory as above.
- `pnpm run lint` — Lint all apps.
- `pnpm run test` — Test all apps.

---

## Docs

- [High-Level Design](docs/ideamode-hld.md)
- [Milestones & tickets](docs/milestones/README.md)
- [Shared assets plan](docs/shared-assets-plan.md)
