# Semantic UI (web)

Use **shadcn** primitives in `apps/web` with these **semantic roles** so CTAs stay consistent.

## CSS variables (`apps/web/app/globals.css`)

| Token | Role |
|--------|------|
| `--primary` / `--primary-foreground` | Main brand actions, default **Button** (`variant="default"`). |
| `--secondary` / `--secondary-foreground` | Lower-emphasis actions: cancel-adjacent, alternate paths (`variant="secondary"`). |
| `--success` / `--success-foreground` | Positive completion: “saved”, “done”, safe confirmations (`variant="success"` on **Button**). |
| `--destructive` / `--destructive-foreground` | Irreversible or dangerous actions: delete, remove access (`variant="destructive"`). |

Tailwind v4 maps these to utilities such as `bg-primary`, `text-destructive`, `bg-success`, `text-success-foreground`.

## When to use which **Button** variant

- **`default`** — Primary submit / main CTA on a surface (Save, Generate, Add, Continue).
- **`secondary`** — Secondary action on the same surface (Back, Cancel when paired with a primary).
- **`outline`** — Tertiary actions, toolbars, dense rows (Export, optional actions).
- **`ghost`** — Icon-only or low-weight actions (toolbar toggles). Pair with `text-destructive` / `hover:bg-destructive/10` for **remove** icon buttons if a full `destructive` fill is too heavy.
- **`success`** — Explicit positive confirmation (e.g. “Mark complete” emphasis); use sparingly so it stays meaningful.
- **`destructive`** — Delete resource, remove member, cancel invite when the action is clearly harmful or irreversible.

## Errors and validation

- Prefer **`text-destructive`** for inline form/section errors (maps to theme).
- For mutations, also use **Sonner** (`@/lib/toast`) so users get feedback even when not looking at the form.

## Toasts

- Import helpers from [`apps/web/lib/toast.ts`](../../apps/web/lib/toast.ts) or `import { toast } from "sonner"` for one-offs.
- Autosave flows should use **`toastAutosaveSuccess` / `toastAutosaveError`** with the matching `toastIds` scope so messages coalesce.
