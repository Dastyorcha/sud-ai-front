# React Admin Template

A ready-to-use admin panel starter — clone it, rename a few things, and start building your own features on top of a working shell, UI kit, i18n, theme, auth stub, and one reference CRUD page.

## Stack

- **Vite** (rolldown-vite) + **React 19** + **TypeScript** strict (`@/*` → `./src/*`)
- **React Router v7** — routing at `src/app/app.tsx`, lazy-loaded pages, mounted under a `/:lang` locale prefix
- **Tailwind CSS v4** (CSS-first, tokens in `src/index.css`) + **shadcn/ui** (new-york) at `src/shared/components/ui/`
- **next-themes** for light/dark, **lucide-react** icons, **sonner** toasts, **react-hook-form** + **zod** forms, **motion** for animation
- A custom lightweight **i18n** layer (`src/shared/lib/i18n/`, no library) — uz/en/ru out of the box, path-prefixed routing, typed `t()`
- No backend — a mock service layer (`src/shared/lib/mock-api/`) with server-shaped functions, ready to swap for real HTTP calls

## Getting started

```bash
npm install
npm run dev
```

Other commands:

- `npm run build` — typecheck + production build
- `npm run typecheck` — `tsc -b`
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier

## What's included

- **App shell** — sidebar, topbar, mobile drawer, theme toggle, language switcher, profile menu (`src/widgets/layout/`)
- **Dashboard** placeholder (`src/views/dashboard/`) — replace with your real KPIs/summary widgets
- **Users** — a full reference CRUD page (`src/views/users/`): searchable table backed by the mock API, row click opens a detail drawer addressed by a `?user=` query param. Copy this pattern for every new section.
- **Auth stub** (`src/features/auth/use-auth.ts`) — always returns a mock signed-in user so the shell is usable immediately; swap in real session logic without touching call sites (`AuthGuard` reads the same hook)
- **RBAC example** (`src/shared/constants/permissions.ts`, `usePermission`, `<Can>`) — a small admin/editor/viewer role × action matrix, frontend-only gate
- **`/tools`** — a live design-system playground (colors, buttons, typography, badges, data states) for verifying visual changes in light + dark before shipping

## Project structure (Feature-Sliced Design)

```
src/
  app/        composition root — router, providers, global CSS
  views/      page-level compositions (one folder per route/section)
  widgets/    self-contained blocks that own state/data-fetching (layout shell, etc.)
  features/   hooks/logic shared across 2+ widgets (auth, users)
  shared/     everything reusable and domain-agnostic
    components/ui/   shadcn primitives
    custom/           cross-cutting components built on primitives
    constants/        route paths, nav items, permissions, app name
    lib/              i18n, mock-api, utils
    types/            shared models/enums
```

Dependencies point downward only: `app → views → widgets → features → shared`. Full details: `docs/architecture.md`.

## Adding a new page

1. Copy the pattern in `src/views/users/` (list + optional detail drawer).
2. Add a route in `src/app/app.tsx` and a path in `src/shared/constants/route-paths.ts`.
3. Add a sidebar entry in `src/shared/constants/nav-items.ts` and a title key in `src/shared/constants/page-names.ts`.
4. Add the new i18n keys to **all three** message files (`src/shared/lib/i18n/messages/{uz,en,ru}.ts`).
5. Add a mock service under `src/shared/lib/mock-api/` (server-shaped, so swapping in a real API later is a drop-in).

## Internationalization

Ships with `uz`/`en`/`ru`. If your project only needs one language, drop the extra locales from `src/shared/lib/i18n/locale.ts` and the corresponding message files — the mechanism (typed `t()`, `/:lang` routing) still works with a single locale. Full spec: `docs/i18n.md`.

## Rename the template for your project

- `src/shared/constants/app.ts` — `APP_NAME`
- `index.html` — `<title>`
- `package.json` — `name`

## Docs

- `docs/architecture.md` — FSD layering, routing, naming, tokens, admin-panel patterns
- `docs/i18n.md` — locale model, message shape, `t()` API
- `docs/codemap.md` — one line per source file
- `docs/agentic-workflow.md`, `docs/claude-hooks.md`, `docs/claude-skills.md` — the AI-driven development workflow this repo is set up for (Claude Code agents, hooks, skills)

## Deploying to your own repo

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```
