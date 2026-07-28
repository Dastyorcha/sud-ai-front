# Integration 00 — Real backend API integration overview

- **Status:** idea
- **Size:** large (split into integration-01 … integration-11)
- **Author model:** Opus 4.8 (planner)
- **Reference:** `FRONTEND_INTEGRATION_GUIDE.md` (LexKotib backend API contract, `/api/v1`)

## Goal

Replace every mock service in `src/shared/lib/mock-api/` with the real LexKotib
REST + SignalR backend, using **axios** (HTTP) and **TanStack Query** (fetching,
caching, polling, single-flight refresh). No feature is mocked after this
sequence — the whole guide's contract is implemented exactly as written.

## Base URL & environment

- API base URL: `https://example.com` (placeholder — swap for the real host).
- API prefix: `/api/v1`. SignalR hub: `/hubs/demo-transcript`.
- Because the backend has **no CORS** yet (guide §1), the Vite dev server proxies
  `/api` and `/hubs` to the base URL. All app code calls **same-origin relative**
  paths (`/api/v1/...`) so dev-proxy and same-origin prod both work unchanged.

## Ground rules (apply to every plan below)

- **All real.** No mock service survives; `src/shared/lib/mock-api/` is deleted in
  integration-11. Hooks call real services through TanStack Query.
- **Types are the source of truth.** Reuse existing `src/shared/types/models.ts` +
  `enums.ts`; where the guide's response shape differs (PascalCase enums,
  `version` fields, paged envelope), adapt the types in the owning plan and keep
  `docs/codemap.md` synced in the same commit.
- **Every error localized.** All API errors pass through the extended error mapper
  (integration-01) → `t()` key; never show a raw code/server string. Persist
  `X-Request-ID` for monitoring.
- **Optimistic concurrency everywhere the guide requires it** (§16): store the
  `version` from every GET, send it as `expectedVersion`, write the new version
  back on success, refetch + warn on `409 CONCURRENCY_CONFLICT`.
- **Jobs poll to terminal state** (`Succeeded`/`Failed`) at 1–2s intervals via a
  shared TanStack Query polling helper (integration-02).
- **Uploads/downloads** use `FormData` (no manual `Content-Type`) and blob
  handling (integration-05, -08) — never open a `storageKey` directly.
- Copy through i18n `t()` (uz/en/ru); routes via `ROUTE_PATHS`; shadcn primitives
  only; verify light + dark.

## Guide → plan mapping (nothing from the guide is dropped)

| Guide section                                        | Plan                                         |
| ---------------------------------------------------- | -------------------------------------------- |
| §1 env/base/CORS, §3 error format, §16 concurrency   | `integration-01-http-client-and-errors.md`   |
| Fetching/caching/job-polling infra, provider         | `integration-02-query-layer-and-jobs.md`     |
| §2 auth/session, §7 auth endpoints, roles            | `integration-03-auth-session-and-roles.md`   |
| §8 cases & participants, §17 judge-list gap          | `integration-04-cases-and-participants.md`   |
| §9 hearing, audio upload, transcribe, transcript GET | `integration-05-hearings-audio.md`           |
| §10 transcript editor, speakers, validate, approve   | `integration-06-transcript-editor.md`        |
| §11 procedural events                                | `integration-07-procedural-events.md`        |
| §12 templates & documents lifecycle                  | `integration-08-documents.md`                |
| §13 audit logs                                       | `integration-09-audit.md`                    |
| §14 SignalR demo transcript hub                      | `integration-10-signalr-demo-hub.md`         |
| §4 enums, §17 API gaps, §18 acceptance, mock removal | `integration-11-enums-cleanup-acceptance.md` |

## Suggested order

01 (http+errors) → 02 (query+jobs) → 03 (auth) → 04 (cases/participants) →
05 (hearings/audio) → 06 (transcript) → 07 (events) → 08 (documents) →
09 (audit) → 10 (signalr) → 11 (enums/cleanup/acceptance).

01–03 are prerequisites for everything; 04–09 are independent slices; 10 is
optional-independent; 11 lands last (it deletes the mocks and runs the §18
acceptance checklist).

## New dependencies (all need user approval at implementation time)

- `axios` — HTTP client with interceptors.
- `@tanstack/react-query` — fetching/caching/polling.
- `@microsoft/signalr` — demo transcript hub (integration-10 only).

## Cross-cutting risks

- Backend has no CORS/user-list/hearing-GET endpoints yet (§17). Plans handle
  these gaps explicitly (dev proxy, routing-state carry, manual judge UUID) and
  flag each as backend follow-up — never invent an endpoint.
- Enum casing flips from the repo's `UPPER_SNAKE` mocks to the API's `PascalCase`;
  a single mapping module (integration-11) reconciles enum values + i18n label
  keys once, so no plan hard-codes casing.
