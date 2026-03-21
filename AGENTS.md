# Agent instructions

## React Server Components

**Do not use React Server Components (RSC).**

- All React components in this project must be **Client Components** (components that run on the client and can use hooks, browser APIs, and interactivity).
- Use `"use client"` at the top of components when required by the framework (e.g. Next.js App Router) for any component that uses client-only features.
- Do not rely on Server Components by default; do not design features around RSC-only patterns. Prefer client-side rendering for UI components.
- When adding or modifying pages and components in `apps/web` (Next.js), keep components client-compatible and avoid Server Component–only behavior.

This rule applies to all code generation, refactors, and suggestions in this repo.

---

## UI components (web)

**Use shadcn/ui when a suitable component exists.**

- In `apps/web`, prefer [shadcn/ui](https://ui.shadcn.com) components from `@/components/ui` (e.g. Button, Card, Dialog, Input). Add new components with `pnpm dlx shadcn@latest add <component>` from the `apps/web` directory.
- Do not introduce other UI libraries (e.g. MUI, Chakra) for pieces that shadcn can cover. Use shadcn first; only reach for a different library if shadcn has no equivalent.

---

## Icons

**Use Lucide only.**

- **Web:** Use `lucide-react` for all icons. Do not use other icon sets (e.g. Heroicons, Feather, custom SVGs) unless there is no Lucide equivalent and the product owner approves.
- **Mobile:** Use `lucide-react-native` for all icons. Same rule: Lucide only.
- **Sizes and documented exceptions:** See [docs/ui/icons.md](./docs/ui/icons.md).

## Semantic colors & buttons (web)

- **Primary / secondary / success / destructive** are defined as CSS variables in `apps/web/app/globals.css` and mapped for Tailwind (`bg-success`, `text-destructive`, etc.).
- Use **Button** variants consistently: `default` (primary), `secondary`, `success`, `destructive`, plus `outline` / `ghost` / `link` as needed.
- Full guidance: [docs/ui/semantic-ui.md](./docs/ui/semantic-ui.md).

---

## Component size and structure

**Keep React and React Native component files small and focused.**

- Prefer one primary responsibility per file: one component (or one screen) per file, with small, focused subcomponents extracted into their own files when they grow.
- Extract reusable logic into custom hooks, and move non-trivial sub-UIs into separate components rather than inlining large blocks of JSX.
- Avoid files that mix many components, long blocks of markup, and large style objects. Split screens into smaller presentational components and keep styles (e.g. `StyleSheet`, `className` usage) close to the component that uses them.
- Smaller files are easier to read, debug, and change. When a file gets long (e.g. well over 100–150 lines), consider splitting by feature or by section of the UI.
