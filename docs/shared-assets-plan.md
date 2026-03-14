# Shared assets plan

**Purpose:** Single source of truth for brand and shared assets (logo, icon, etc.) used across the Next.js web app and Expo mobile app. The Rails API does not serve these; they are build-time assets for the clients.

---

## Where shared assets live

Use a **shared package** in the Turborepo so web and mobile both depend on it and get the same files:

```
packages/
  assets/                    # or "brand" — shared brand & UI assets
    package.json             # name: "@ideamode/assets" (or "@repo/assets")
    ideamode_icon.svg        # app icon (favicon, PWA, Expo app icon, nav)
    ideamode_logo.svg        # full logo (header, marketing, login, splash)
    README.md                # what each file is for, usage notes
```

**Why a package instead of repo root or per-app copies?**

- **Single source of truth** — one place to update; no sync script or duplicated SVGs.
- **Workspace dependency** — `apps/web` and `apps/mobile` add `@ideamode/assets` (or `workspace:*`); bundlers resolve paths to the package.
- **Scales** — easy to add more shared assets later (e.g. illustrations, shared images, design tokens).
- **Fits Turborepo** — `packages/` is the usual place for shared code and assets.

**Alternative (simpler but less scalable):** Root-level `assets/brand/` with `ideamode_icon.svg` and `ideamode_logo.svg`, and each app references them via path (e.g. `../../assets/brand/`). Use this only if you want to avoid a package; then document the path contract and any copy step for mobile.

---

## Asset inventory

| File | Role | Used in web | Used in mobile |
|------|------|-------------|-----------------|
| `ideamode_icon.svg` | App icon — square/symbol only | Favicon, PWA icons, sidebar/header when space is tight | App icon, splash (if desired), tab bar | 
| `ideamode_logo.svg` | Full logo — wordmark + symbol | Header, login/marketing, footer | Splash screen, login/auth screen, header |

**Web (Next.js):**

- **Icon:** `<link rel="icon">` in `app/layout.tsx` or `app/head.tsx`; PWA manifest; optional compact nav/header.
- **Logo:** Login/marketing page, app header/sidebar (link to dashboard), 404/error pages.

**Mobile (Expo):**

- **Icon:** `app.json` / `app.config.*` `icon` field (Expo can use SVG or you export PNG from it); optional tab bar.
- **Logo:** Splash screen image, auth/login screen, header.

Exporting for native: Expo’s app icon usually wants a PNG (e.g. 1024×1024). Generate from `ideamode_icon.svg` and keep the PNGs in the same package (e.g. `packages/assets/icon-1024.png`) or in `apps/mobile/assets/` with a note that the source is the SVG in the shared package.

---

## Package contract

- **Package name:** `@ideamode/assets` (or `@repo/assets` if you prefer repo-scoped naming).
- **Contents:** SVGs (and any exported PNGs) are static files; no `main` entry required. Apps import by path:
  - Web: `import logo from '@ideamode/assets/ideamode_logo.svg'` (with Next.js or bundler SVG support) or put them in `public/` at build time by copying from the package.
  - Mobile: Metro can resolve `@ideamode/assets/ideamode_logo.svg` if the package is in the workspace and metro is configured to watch the package.
- **README in package:** Short note listing each file, its role (icon vs logo), and where it’s used (web/mobile).

---

## Checklist for Milestone 0

When setting up the monorepo:

1. Create `packages/assets` with `package.json` (name, private, no main).
2. Move `ideamode_icon.svg` and `ideamode_logo.svg` from repo root into `packages/assets/`.
3. Add `packages/assets` to `pnpm-workspace.yaml` (e.g. `packages: ['apps/*', 'packages/*']`).
4. In `apps/web` and `apps/mobile`, add dependency `"@ideamode/assets": "workspace:*"` and use the assets as above.
5. Document in root README that brand assets live in `packages/assets` and are consumed by web and mobile.

---

## Future additions

- **Illustrations:** e.g. empty states, onboarding, place in `packages/assets/illustrations/`.
- **App icon PNGs:** Export from `ideamode_icon.svg` for 1024, 512, 192, etc.; add to `packages/assets/` or to each app with a note that source is the SVG.
- **Design tokens:** If you later add a `packages/tokens` for colors/spacing, keep it separate from image/svg assets; this doc stays for visual assets only.
