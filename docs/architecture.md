# Architecture

Feature-Sliced Design (FSD) for a **Vite + React 19 + React Router v7** admin panel. This is the source of truth for layering, file placement, and naming. `CLAUDE.md` links here; the `ui-designer` and `refactor-code` skills enforce it.

Admin panel — **no SEO, no marketing pages**. Optimise for data density, fast interactions, and reusable CRUD surfaces.

## Layers (under `src/`)

Dependencies point **downward only**. A layer may import from layers below it, never above or sideways-into-a-sibling's internals.

| Layer        | Path            | Holds                                                                                                                    | May import from           |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| **app**      | `src/app/`      | Composition root: `main.tsx`, router (`app.tsx`), providers, global CSS. Routing only — no business logic.               | views, shared             |
| **views**    | `src/views/`    | Page-level compositions assembled from widgets. Layout + minimal cross-widget state.                                     | widgets, features, shared |
| **widgets**  | `src/widgets/`  | Self-contained blocks that own state, handlers, data fetching, modals (e.g. a data table, an auth form, the app header). | features, shared          |
| **features** | `src/features/` | Hooks and logic shared across 2+ widgets (e.g. `use-auth`, `use-users`).                                                 | shared                    |
| **shared**   | `src/shared/`   | Everything reusable and domain-agnostic (see below).                                                                     | shared (self)             |

**Data flow:** `app/` route → `views/*` → `widgets/*` → `shared/components/ui/*`. Never invert. A widget must not import a view; `app/` imports only views (+ shared for providers/router config).

### `shared/` sublayers

- `components/ui/` — shadcn/ui primitives (new-york style, lucide icons). Keep them here; do not hand-edit beyond additive fixes.
- `custom/` — cross-cutting components built on primitives: `status-badge`, `money`, `date-text`, `detail-grid`, `theme-toggle`, `lang-switcher`, `coming-soon`, data-state blocks (`loading-state`, `empty-state`, `error-state`, `permission-denied`), `can`, etc.
- `hooks/` — generic hooks (`use-debounce`, `use-mock-query`, `use-unsaved-guard`).
- `lib/` — `utils.ts` (`cn`), `mock-api/` (the mock service layer — see below), `http/` (the real-backend axios client — see below), `query/` (TanStack Query key factory, job polling, mutation wrapper — see below), `i18n/` (custom locale/message/formatting layer — see below), `errors/` (central error-code → message-key map), `toast.ts`.
- `config/` — typed environment config (`env.ts`).
- `constants/` — static config as `UPPER_SNAKE_CASE`: `nav-items.ts`, `route-paths.ts`, `page-names.ts`, `permissions.ts`, `app.ts`.
- `types/` — shared TypeScript types/interfaces (`models.ts`, `enums.ts`, `query-types.ts`).
- `styles/` — non-token global CSS (e.g. `tag-styles.css`). Design tokens live in `src/index.css` only.

## Routing (React Router v7)

- The router lives at `src/app/app.tsx`, wrapped by `src/app/providers.tsx` (TanStack Query `QueryProvider` + `next-themes` `ThemeProvider` + `sonner` `Toaster`) in `src/main.tsx`. Pages are **lazy-loaded** (`lazy(() => import(...))`) for code-splitting.
- Every route is mounted under a `/:lang` locale prefix (`/uz/...`, `/en/...`, `/ru/...`) — `/` redirects to the preferred locale, an unsupported `:lang` renders the 404. See **Internationalization (i18n)** below and `docs/i18n.md`.
- Route strings come from `src/shared/constants/route-paths.ts` (`ROUTE_PATHS`; parametrised/detail routes via `buildRoute.*`) — these are **locale-less**; never hardcode a path in a `<Route>` or `<Link>`. Build a concrete, navigable URL with `withLocale(locale, ROUTE_PATHS.X)`.
- Page/route display names come from `src/shared/constants/page-names.ts` (`PAGE_NAMES`, keyed by `ROUTE_PATHS` key) as **i18n message keys** — resolve with `t(PAGE_NAMES.KEY)`.
- Primary navigation is `src/shared/constants/nav-items.ts` (`NAV_ITEMS`) — one entry per sidebar link, each carrying a `labelKey` resolved via `t()`. Add an entry here for every new product section.
- Domain enums live in `src/shared/types/enums.ts` (`USER_ROLE`, `SORT_DIRECTION`). Enum IDs are the backend-shared technical values; UI labels live in the i18n message tree under `enums.*` (keyed by the same enum values) — never a `*_LABELS` map, never a free-text label.
- Protected admin routes (dashboard, users) render inside `<AuthGuard><AppShell/></AuthGuard>` — dashboard is the shell's index route. `AuthGuard` (`src/widgets/layout/auth-guard/`) reads the stub `useAuth` (`src/features/auth/use-auth.ts`) and redirects to `withLocale(locale, ROUTE_PATHS.LOGIN)` when unauthenticated (always passes today; swap in real session logic later without touching call sites). `/403`, `/404` (`ROUTE_PATHS.FORBIDDEN`/`NOT_FOUND`), and `/maintenance` are bare system views (`src/views/errors/`), outside the shell. Auth routes (login, register, reset) sit outside both the shell and `MainLayout`. `/tools` and the legacy catch-all stay under the pre-FSD `MainLayout` (public header/footer, dev-only playground).
- In-app navigation uses `Link` / `useNavigate` from `react-router-dom`, always with a `withLocale()`-built path.

### App shell (`src/widgets/layout/`)

- `AppShell` (`app-shell/app-shell.tsx`) composes a fixed dark sidebar on desktop (`md:` breakpoint), a `Sheet` drawer with the same `Sidebar` content on mobile (state owned by `AppShell`), the `AppHeader`, a scrollable `<Outlet>` for the active view, and the `AppFooter`.
- `Sidebar` (`sidebar/sidebar.tsx`) renders the brand (`APP_NAME` + a mark), the `NAV_ITEMS` rows (`sidebar-nav-item.tsx`, active state by matching `useLocation().pathname` against `withLocale(locale, item.path)`), and a footer line. Uses the `sidebar`/`sidebar-accent`/`sidebar-foreground`/… tokens (dark regardless of the app's light/dark theme).
- `AppHeader` (`src/widgets/app-header/app-header.tsx`) is the court header: mobile menu button (opens the `Sheet`), a gold logo lockup (`APP_NAME`/`APP_FULL_NAME`), a breadcrumb (dashboard → active case number, matched off the URL with `matchPath(ROUTE_PATHS.CASE_DETAIL)` — no router change needed), `ThemeToggle`, `LangSwitcher`, and a user block (avatar initials, name, role) sourced from `useCourtAuth`. Supersedes the old `Topbar`.
- `AppFooter` (`src/widgets/app-footer/app-footer.tsx`) is the status footer under the routed content: a status dot (`status-ok`/`-warning`/`-error` tokens), last-updated timestamp, `APP_VERSION`, and the product tagline — all through `t()`.
- `src/views/dashboard/dashboard.tsx` renders a shared `ComingSoon` (`src/shared/custom/coming-soon.tsx`) — replace it with real KPI/summary widgets when you build the dashboard out. `src/views/users/users.tsx` is the real reference CRUD page — see "Admin-panel patterns" below.

## Internationalization (i18n)

Full spec: `docs/i18n.md`. A lightweight **custom** layer — no library:

- Locales: `uz` (default), `en`, `ru`, as the first URL path segment (`/:lang/*`).
- `src/shared/lib/i18n/` — `locale.ts` (`Locale`, `LOCALES`, `isLocale`), `messages/{uz,en,ru}.ts` (uz is the source of truth; en/ru are typed against it so a missing key is a compile error), `locale-context.tsx` (`LocaleProvider`, `useTranslation()` → `{ locale, t, formatMoney, formatDate, formatNumber }`), `format.ts` (`Intl`-based).
- `t("namespace.key", vars?)` is dot-path, typed (autocomplete + typo-safety via a template-literal key union), falls back to `uz` then the raw key.
- `src/shared/custom/lang-switcher.tsx` swaps the `:lang` segment, preserves the rest of the path + query, persists the choice to `localStorage`.
- Every user-facing string goes through `t()` — no hardcoded copy in new views/widgets. Drop the `ru`/`uz` locales (keep the mechanism) if your project only needs one language.

## Naming (no exceptions)

| Kind                     | Convention           | Example                         |
| ------------------------ | -------------------- | ------------------------------- |
| Files & folders          | **kebab-case**       | `login-form.tsx`, `data-table/` |
| Components, types, enums | **PascalCase**       | `LoginForm`, `TableColumn`      |
| Variables & functions    | **camelCase**        | `activeTab`, `formatDate`       |
| Hooks                    | `use` + camelCase    | `useAuth`, `useUsers`           |
| Constants                | **UPPER_SNAKE_CASE** | `ROUTE_PATHS`, `NAV_ITEMS`      |

**One component per file.** A secondary component sharing a file moves to its own kebab-case file — co-located in the widget folder if only that widget uses it, else `shared/custom/`.

> Migration note: the repo predates this convention in a couple of legacy files (camelCase files, `pages/` + `components/pages/`). `refactor-code` migrates touched files to kebab-case + FSD incrementally — do not mass-rename in unrelated changes.

## Tokens & theming

- Design tokens (colors, radius, fonts) live in **`src/index.css`** only (`@theme inline` maps `--color-*` → the `--*` vars defined in `:root` + `.dark`). Never hardcode hex/rgb/oklch in components.
- Dark mode via `.dark` on the root element, managed by `next-themes`. Use semantic tokens (`bg-background`, `text-foreground`, `border-border`) — never `dark:` literals in app code.
- **Color families** (light + dark defined):
  - shadcn base: `background`, `foreground`, `card`, `popover`, `primary` (+ `primary-foreground`, `primary-soft`), `secondary`, `muted` (+ `muted-foreground`), `accent` (+ `accent-foreground`), `border`, `input`, `ring`.
  - status: `destructive` (+ `-foreground`, `-soft`), `success` (+ `-foreground`, `-soft`), `warning` (+ `-foreground`, `-soft`).
  - charts: `chart-1..5`; risk badges: `risk-low..critical`.
  - sidebar: `sidebar` (dark nav surface) + `sidebar-foreground`/`-primary`/`-accent`/`-border`/`-ring`.
  - court theme (mockup): `gold` (+ `-foreground`, `-soft`) accent; `stage-1..6` (case pipeline badges); `speaker-1..4` (transcript diarization); `status-ok`/`status-warning`/`status-error` (system status dot — distinct from form `success`/`warning`/`destructive`).
  - fonts: `font-sans` (Inter, system fallback), `font-serif` (Noto Serif, system fallback) — system/self-hosted fallback stacks only, no font package or external `<link>`.
- A new token → add it in `@theme inline` **and** `:root` **and** `.dark`, then use the utility; add a swatch to `/tools`.
- Full UI ruleset: `.claude/skills/ui-designer/SKILL.md`.

## The `/tools` playground

`/tools` (`src/pages/tools/toolsPage.tsx`) is the live showcase of every token, primitive, and widget — the admin-panel equivalent of a design playground, shown only on localhost (see `src/app/app.tsx`). **Verify every visual change here in both light and dark mode before finishing.** When you add a token, primitive, or reusable widget, add it to the playground in the same change (see the style-change sync rule in `ui-designer`).

## Mock API / data layer (`src/shared/lib/mock-api/`)

Until a real backend exists, every screen reads from an **in-memory mock service layer** that behaves like a server: every call is `async` with a simulated ~250ms latency (`delay.ts`) so loading states are always exercised.

- **Domain models** (`src/shared/types/models.ts`) hold `Organization` and `User` — the example entities. Add your real entities here, backend-shaped (ISO date strings, enum IDs from `enums.ts`) so a real API is a drop-in swap later. `src/shared/types/query-types.ts` holds the generic `ListParams<TFilters, TField>` / `Paginated<T>` request/response shapes for server-style list endpoints.
- **`data/`** holds the seed dataset: `organization.ts`, `users.ts`. `data/index.ts` is the single import surface — add new seed files there as you add entities.
- **`user.service.ts`** reads from `data/` and exposes server-shaped async functions (`listUsers`, `getUser`). Add one `*.service.ts` per entity, following the same pattern.
- **Swap-to-real-API note:** every service function's signature and return shape is deliberately API-shaped. Replacing the mock layer later means rewriting each service function's body to call `fetch`/an HTTP client instead of reading the in-memory arrays — call sites (feature hooks, widgets) do not change.
- **Consumer hooks** (`src/features/users/use-users.ts`, `src/shared/hooks/use-mock-query.ts`) wrap the services with plain `useState`/`useEffect` (`{ data, isLoading, error }` or `{ data, isLoading, error, refetch }`) — no `react-query`, by design (no extra dependency for a mock-only layer). `use-mock-query.ts` is the generic loader — pass it any `() => Promise<T>` and a dependency array.

## HTTP client / real-backend layer (`src/shared/lib/http/`)

The LexKotib backend integration (see `plans/idea/integration-*.md`) is landing
service-by-service alongside the mock layer; `shared/lib/http/` is the shared
foundation every real service imports:

- `api-client.ts` — the single axios instance (`apiClient`). `baseURL` stays
  `""` (relative); every call passes a same-origin path prefixed with
  `src/shared/config/env.ts`'s `API_PREFIX` (`/api/v1/...`) so the Vite dev
  proxy and a same-origin prod reverse proxy both work unchanged (no
  `Access-Control-Allow-Origin: *`). The request interceptor sets `Accept`, a
  fresh `X-Request-ID` (`request-id.ts`), and `Authorization: Bearer <token>`
  from an **injectable** token getter (`setAccessTokenGetter`) — the real auth
  store wires this once at app init; until then it's a no-op so this layer
  builds/tests standalone. The response interceptor captures the response's
  `X-Request-ID` and rejects with a parsed `ApiError`.
- `api-error.ts` — `ApiError` (`status`, `code`, `title`, `detail`,
  `requestId`, `fieldErrors?`) + `parseApiError()`, which normalizes an axios
  rejection into one shape: RFC ProblemDetails with a `code`, ASP.NET
  `ValidationProblemDetails` (`errors` map → `code: "validation_error"` +
  `fieldErrors`), an empty-body error (status → fallback code), or a
  network/timeout failure (`network_error/timeout`, `status: 0`).
- `request-id.ts` — `createRequestId()` (UUID per outgoing request) +
  `setLastRequestId`/`getLastRequestId` (last captured response id, for
  logs/support correlation).
- Errors are never shown raw: `ApiError.code` (backend `UPPER_SNAKE` or a
  derived fallback) resolves through `src/shared/lib/errors/error-map.ts`'s
  `errorMessageKey()` (case-insensitive) to an `errors.codes.*` i18n key.
- Dev proxy: `vite.config.ts` forwards `/api` and `/hubs` to
  `env.apiBaseUrl` (`VITE_API_BASE_URL`, see `.env.example`) — the backend has
  no CORS yet, so this is the sanctioned same-origin workaround (never set
  CORS headers client-side).

## Query layer (`src/shared/lib/query/`, `src/app/providers/query-provider.tsx`)

Real-service feature hooks (integration-04 onward) use **TanStack Query**
instead of `use-mock-query` — both coexist until integration-11 deletes the
mock layer.

- `src/app/providers/query-provider.tsx` — the single `QueryClient` (mounted
  in `AppProviders`). Defaults: `staleTime: 30_000`, `retry` only on a
  network/timeout or 5xx `ApiError` (never a 4xx, capped at 2 attempts),
  `refetchOnWindowFocus: false`. Mutations never auto-retry — error handling
  (including the 409 concurrency path) is `useApiMutation`'s job, not a
  global `onError`. Dev-only `ReactQueryDevtools` is lazy-imported.
- `query-keys.ts` — the `queryKeys` factory (cases, participants, hearings,
  transcript, events, documents, audit, jobs, users). Every feature hook's
  `queryKey` and every `useApiMutation`'s `invalidateKeys` read from here so
  keys always agree.
- `use-job-polling.ts` — `useJobPolling(jobId)` polls `GET /jobs/{id}` (guide
  §9/§12) every 1.5s via `refetchInterval` until `status` is
  `Succeeded`/`Failed`, then stops. Returns `{ job, isTerminal, isSucceeded,
isFailed }`; on `Failed`, read `job.errorCode`/`job.errorMessageSafe`.
  `JobStatus ∈ Queued | Processing | Succeeded | Failed` and
  `JobType ∈ FinalTranscription | DocumentGeneration | DocumentPdfExport` are
  the real API's PascalCase values — distinct from the mock `enums.ts`
  `JobStatus` (`QUEUED`/`RUNNING`/...) until integration-11 reconciles them.
- `use-api-mutation.ts` — `useApiMutation` wraps `useMutation`: on success it
  invalidates the caller's `invalidateKeys`; on an `ApiError` with
  `code === "CONCURRENCY_CONFLICT"` it also invalidates `invalidateKeys` (the
  resource changed under the caller — guide §16.4) and toasts the localized
  message; any other `ApiError` just toasts `errorMessageKey(error)`. Exposes
  `fieldErrors` from a 400 validation error for inline form binding. Never
  auto-retries.
- **Paging envelope** — `src/shared/types/query-types.ts`'s `Paginated<T>` is
  `{ items, page, pageSize, totalCount }` (guide §5); `totalPages()` derives
  the page count. The audit endpoint (§13) returns `total` instead — adapted
  at that service's boundary (integration-09), not modeled in this type.
- **Concurrency convention** (guide §16) — a resource hook stores `version`
  from its `GET`; a mutation sends `expectedVersion`; on success the cache is
  updated with the response's new `version`. Each feature plan states which
  mutations carry `expectedVersion`.

## Admin-panel patterns

- **Data views** define loading + empty + error states explicitly, via `LoadingState`/`EmptyState`/`ErrorState` (`src/shared/custom/`).
- **Tables**: shadcn `Table` primitives (`src/shared/components/ui/table.tsx`); column config as typed constants for anything non-trivial.
- **Forms**: `react-hook-form` + `zod` resolver + shadcn primitives; validate on blur; errors say how to fix.
- **Auth**: token/session handled in a `use-auth` feature; route guards live in `widgets/layout/auth-guard`.
- **Permissions**: `src/shared/constants/permissions.ts` (`PERMISSIONS`) is a typed `UserRole` × action matrix (an admin/editor/viewer example — extend the roles and actions for your project); `src/features/auth/use-permission.ts` (`usePermission().can(action)`) reads the current role from `useAuth`, and `src/shared/custom/can.tsx` (`<Can action="...">`) gates rendering by it. This is a **frontend-only** convenience gate — a real backend must be the actual enforcement point; never treat a hidden button as security.
- **No SEO surface** — do not add meta tags, OG, sitemap, or hreflang anywhere.
- **Reference implementation — users list (`src/views/users/`):** `users.tsx` composes a debounced search input over `useUsers()` (mock-api-backed) and a `Table`; row click opens `user-detail.tsx`, a `Sheet` drawer addressed by the `?user=` query param (`DETAIL_PARAM.user`, `buildRoute.userDetail`) and fetched independently via `use-mock-query` + `getUser`. Copy this pattern — search/table/drawer over a mock service — for every new CRUD section.
