# Icons (web)

## Lucide only

- Use **`lucide-react`** for all icons in `apps/web`.
- Standard sizes:
  - **16px (`size-4`)** — Default inside **Button** (see `[&_svg]:size-4` on `Button`), inline list rows.
  - **20–24px (`size-5` / `size-6`)** — Section headers, empty states, prominent actions.
- Keep **gap-2** (or `gap-1.5` in dense rows) between icon and label.

## Approved non-Lucide exceptions

| Location | Why |
|----------|-----|
| **Google “G”** on login/register | Official multicolor brand mark; no Lucide equivalent. Implemented as inline `<svg>` in those pages only. |
| **Analysis verdict ring** (`analysis-result-sections.tsx`) | Custom circular gauge; not a generic Lucide icon. |

If you add another exception, document it here and get product sign-off per [AGENTS.md](../../AGENTS.md).
