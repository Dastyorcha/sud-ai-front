# LexKotib AI frontend

The frontend for **LexKotib AI** — an AI-assisted
court transcription and documentation panel. Judges/clerks run a hearing,
capture and edit its transcript, extract procedural events, and generate
court documents from verified sources. Integrates against the LexKotib REST +
SignalR backend (`docs/api-integration.md`).

## Stack

- **Vite** (rolldown-vite) + **React 19** + **TypeScript** strict (`@/*` → `./src/*`)
- **React Router v7** — routing at `src/app/app.tsx`, lazy-loaded pages, mounted under a `/:lang` locale prefix
- **Tailwind CSS v4** (CSS-first, tokens in `src/index.css`) + **shadcn/ui** (new-york) at `src/shared/components/ui/`
- **next-themes** for light/dark, **lucide-react** icons, **sonner** toasts, **react-hook-form** + **zod** forms, **motion** for animation
- A custom lightweight **i18n** layer (`src/shared/lib/i18n/`, no library) — uz/en/ru, path-prefixed routing, typed `t()`
- **axios** + **TanStack Query** against the real LexKotib API (`src/shared/lib/http/`, `src/features/*/*.service.ts`); **SignalR** for the live demo transcript hub. A few endpoints still not shipped by the backend stay mock-backed (`src/shared/lib/mock-api/`) — see `docs/api-integration.md`'s gap register.

## Getting started

```bash
npm install
cp .env.example .env   # already the real backend; override VITE_API_ORIGIN/VITE_API_BASE_URL to point elsewhere
npm run dev
```

Other commands:

- `npm run build` — typecheck + production build
- `npm run typecheck` — `tsc -b`
- `npm run lint` — ESLint
- `npm run format` / `npm run format:check` — Prettier

## What's included

- **App shell** — sidebar, topbar, mobile drawer, theme toggle, language switcher, profile menu (`src/widgets/layout/`)
- **Auth** — real login/refresh/logout against the backend (`src/features/auth/`), single-flight `401` refresh with rotation, role/case-level access gating
- **Cases, participants, hearings** — case CRUD, participant management, hearing lifecycle (start/stop/upload/transcribe)
- **Transcript editor** — segment editing, verification, bulk speaker mapping, canonical approval gate
- **Procedural events** — extract/review/verify against the transcript
- **Documents** — generate from verified sources, review/approve/changes-request flow, DOCX/PDF export
- **Live session** — SignalR demo transcript hub (LongPolling, pending backend WS auth)
- **`/tools`** — a live design-system playground (colors, buttons, typography, badges, data states) for verifying visual changes in light + dark before shipping

## Project structure (Feature-Sliced Design)

```
src/
  app/        composition root — router, providers, global CSS
  views/      page-level compositions (one folder per route/section)
  widgets/    self-contained blocks that own state/data-fetching (layout shell, etc.)
  features/   hooks/logic shared across 2+ widgets (auth, cases, hearings, transcript, events, documents, system, …)
  shared/     everything reusable and domain-agnostic
    components/ui/   shadcn primitives
    custom/           cross-cutting components built on primitives
    constants/        route paths, nav items, permissions, app name
    lib/              http client, auth, i18n, query, mock-api (backend gaps only), utils
    types/            shared models/enums
```

Dependencies point downward only: `app → views → widgets → features → shared`. Full details: `docs/architecture.md`.

## Adding a new page

1. Copy the pattern in an existing view under `src/views/`.
2. Add a route in `src/app/app.tsx` and a path in `src/shared/constants/route-paths.ts`.
3. Add a sidebar entry in `src/shared/constants/nav-items.ts` and a title key in `src/shared/constants/page-names.ts`.
4. Add the new i18n keys to **all three** message files (`src/shared/lib/i18n/messages/{uz,en,ru}.ts`).
5. Add a `*.service.ts` under the relevant `src/features/<domain>/` (real `apiClient` calls) — only fall back to `src/shared/lib/mock-api/` for an endpoint the backend hasn't shipped yet.

## Internationalization

Ships with `uz`/`en`/`ru`. Full spec: `docs/i18n.md`.

## Production cutover

`VITE_API_ORIGIN` (SignalR hub + health probes) and `VITE_API_BASE_URL`
(REST, `<origin>/api/v1`) — see `.env.example` and `docs/api-integration.md`.
In dev both proxy through Vite (`vite.config.ts`), so the backend needs no
CORS; in prod the app talks to the absolute origin directly, so the backend
must allowlist the deployed app origin. Full handoff: `FRONTEND_PRODUCTION_HANDOFF.md`.

## Docs

- `docs/architecture.md` — FSD layering, routing, naming, tokens, admin-panel patterns
- `docs/api-integration.md` — backend endpoint map, base URL/proxy, gap register, concurrency
- `docs/i18n.md` — locale model, message shape, `t()` API
- `docs/codemap.md` — one line per source file
- `docs/agentic-workflow.md`, `docs/claude-hooks.md`, `docs/claude-skills.md` — the AI-driven development workflow this repo is set up for (Claude Code agents, hooks, skills)
