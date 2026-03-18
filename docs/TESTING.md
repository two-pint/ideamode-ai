# Testing

This document describes how to run the test suites for the ideamode monorepo.

## API (Rails)

The API uses Rails’ built-in **Minitest** framework.

### Prerequisites

- Ruby 3.x and Bundler
- PostgreSQL running locally (test database)

### Setup

```bash
cd apps/api
bundle install
# Create and migrate test database (uses config/database.yml test section)
bin/rails db:create db:schema:load RAILS_ENV=test
```

### Run tests

```bash
cd apps/api
bin/rails test
# Or from repo root:
pnpm --filter api test
```

### What’s covered

- **Models:** `User`, `Idea`, `Brainstorm`, `IdeaAnalysis` (validations, defaults, `accessible_by?` / `editable_by?`)
- **Services:** `JwtService` (encode/decode, invalid token handling)
- **Jobs:** `IdeaAnalysisJob` (success, error response, exception handling; service stubbed)
- **Controllers:** Health, Auth (register, login, me), IdeaAnalyses (PATCH annotations with JSON)

Helper methods in `test/test_helper.rb`: `create_user`, `create_brainstorm`, `create_idea` for building records in tests.

---

## Web (Next.js)

The web app uses **Vitest** with **React Testing Library** and **jsdom**.

### Prerequisites

- Node 20+ and pnpm
- Dependencies installed (including devDependencies for tests)

### Setup

```bash
cd apps/web
pnpm install
```

### Run tests

```bash
cd apps/web
pnpm test          # single run
pnpm test:watch    # watch mode
# Or from repo root:
pnpm --filter web test
```

### What’s covered

- **lib/utils.ts:** `cn()` (merge, conditionals, Tailwind-style override)
- **lib/api.ts:** `ApiError`, `apiFetch` (error handling, success response, auth header, 204)
- **hooks/use-debounce.ts:** callback after delay, reset on value change, no callback on unmount
- **components/ui/button.tsx:** render, onClick, disabled, variant/size classes
- **components/analysis-result-sections.tsx:** `AnalysisResultView` (running, pending, error, empty, verdict)

---

## CI

To run all tests from the repo root:

```bash
pnpm test
```

This uses Turbo to run the `test` script in each workspace (`api`, `web`). Ensure the API test database exists and is migrated before CI (e.g. in your pipeline: `cd apps/api && bin/rails db:create db:schema:load RAILS_ENV=test`).
