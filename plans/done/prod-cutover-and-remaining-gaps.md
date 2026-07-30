# Plan: Production cutover + closing the remaining handoff gaps

Source: `FRONTEND_PRODUCTION_HANDOFF.md` (LexKotib) + `docs/api-integration.md` §17 gap register.

## Status (2026-07-30)

- **Item 1 — origin/base-URL split — DONE.** `env.apiOrigin` + `env.restBaseUrl`/`hubOrigin`
  (relative in dev via proxy, absolute in prod via `import.meta.env.DEV`); `api-client` baseURL,
  `demo-hub` URL, `vite.config` proxy (target = origin, `/health` added) and `.env.example` updated.
  No double `/api/v1`. `npm run build` + typecheck green.
- **Item 2 — startup connectivity probe — DONE.** `features/system/` (`getSystemInfo`,
  `checkBackendReachable`, `checkHealthReady`) + `useBackendConnectivity` + headless
  `BackendConnectivityProbe` (mounted in `LocaleProvider`); persistent retryable
  "can't reach server" toast, non-blocking. `system.unreachable*` i18n keys (uz/en/ru).
- **Item 3 — CORS coordination — EXTERNAL/PENDING.** Non-code. Handoff §12 checkboxes flipped for
  what's implemented; the "send app origin to backend" box stays open until the prod app origin is fixed.
- **Item 4 — mock→real swaps — DEFERRED (not actionable).** Every endpoint in the table
  (hearings GET/list, case documents, participant detail, judge/user picker, PDF download)
  is still missing on the backend (handoff §11). These stay mock-backed and land as one small
  PR each when the endpoint ships. Nothing blocks go-live.

Go-live is unblocked: set `VITE_API_ORIGIN` + `VITE_API_BASE_URL` to the prod hosts and have the
backend allowlist the app origin (Item 3).

## Context — what is ALREADY done (do not rebuild)

Verified in the current `feat/api-integration-real-backend` branch:

- HTTP client (`src/shared/lib/http/api-client.ts`) — axios, `X-Request-ID`, `Accept`, `Bearer` injection, response error normalisation.
- Auth (`src/features/auth/*`, `src/shared/lib/auth/*`) — login/refresh/logout/me, token-store persistence, **single-flight 401 refresh with rotation**, `AuthGuard` wiring.
- Errors (`src/shared/lib/http/api-error.ts`, `errors/error-map.ts`) — RFC 7807 + `ValidationProblemDetails`, empty-body fallbacks, i18n code mapping, toasts.
- React Query (`src/app/providers/query-provider.tsx`, `lib/query/*`) — no-4xx retry, mutation wrapper, `409 CONCURRENCY_CONFLICT` handling.
- `expectedVersion` — transcript, events, documents.
- Uploads (FormData) + Blob download + job polling (`use-job-polling.ts`, cancel on unmount).
- SignalR demo hub — `@microsoft/signalr`, LongPolling pinned (`features/live-session/demo-hub.ts`).

The checklist is therefore ~90% complete. What remains is **the production go-live wiring** and **the mock→real swaps that are blocked on backend endpoints**.

---

## Item 1 — Production origin / base-URL split (BLOCKS go-live)

**Problem.** Today axios `baseURL` is `""` (relative) and everything rides the Vite dev proxy (`vite.config.ts` maps `/api` and `/hubs` → `apiBaseUrl`). That only works in dev. Production has no proxy and the handoff (§1) requires **two separate values**:

```
VITE_API_ORIGIN   = https://api.beezy.uz          # health + SignalR hub
VITE_API_BASE_URL = https://api.beezy.uz/api/v1   # REST
```

The repo currently has only `VITE_API_BASE_URL` and uses it as the _dev-proxy target_, not the axios base.

**Steps.**

1. `src/shared/config/env.ts` — add `apiOrigin` (`VITE_API_ORIGIN`). Keep `apiBaseUrl`. Add a derived `restBaseUrl`:
   - dev → `""` (relative, keep proxy)
   - prod → `env.apiBaseUrl` (absolute) — but guard against the double `/api/v1` (§1: never add the prefix twice).
2. `api-client.ts` — set `baseURL: restBaseUrl`. Confirm `API_PREFIX` is not double-applied.
3. SignalR (`demo-hub.ts`) — build the hub URL from `apiOrigin` in prod, keep `/hubs/...` proxy in dev.
4. Health/connectivity — see Item 2.
5. `.env.example` — document both vars with the real prod values as comments; keep placeholders.
6. `vite.config.ts` proxy stays as the dev-only path (unchanged).

**Escalation.** This touches shared HTTP + config — confirm the dev/prod switch strategy (env flag vs `import.meta.env.PROD`) with the user before implementing.

**Acceptance.** `npm run build` served without the dev proxy talks to `https://api.beezy.uz`; dev still works via proxy; no double `/api/v1`.

---

## Item 2 — Startup connectivity / health probe (handoff §4)

**Problem.** Handoff §4 wants a minimal connectivity check (`GET /api/v1/system`, optionally `/health/ready`). No boot-time probe was found.

**Steps.**

1. Add `system.service.ts` (`GET /system` → `{ service, apiVersion }`) + optional `GET /health/ready` against `apiOrigin`.
2. Surface a non-blocking "backend unreachable" banner/toast when it fails (reuse existing toast + i18n `errors.codes.*`).
3. Do NOT gate the whole app on it — login flow already handles auth failures.

**Acceptance.** With the API down, the user sees a clear "cannot reach server" state instead of silent blank screens.

---

## Item 3 — CORS go-live coordination (external, non-code)

Handoff §2. Once the production frontend origin is fixed (e.g. `https://app.beezy.uz`), send the exact origin to the backend team for the allowlist. No `*`. Until then, dev proxy / same-origin reverse proxy is the workaround. **Tracking-only checklist item** — flip the handoff §12 checkbox when done.

---

## Item 4 — Mock→real swaps, gated on backend endpoints (§17 gap register)

These stay mock-backed until the backend ships the endpoint. Keep the mock adapter per-file; swap behind the existing service seam when the endpoint lands. One small PR each:

| Gap                      | Endpoint needed                                | Mock today      |
| ------------------------ | ---------------------------------------------- | --------------- |
| Hearing list/detail      | `GET /hearings`, `GET /hearings/{id}`          | `mock-api/*`    |
| Case-level document list | `GET /cases/{id}/documents`                    | `mock-api/*`    |
| Participant detail       | `GET /participants/{id}`                       | `mock-api/*`    |
| Judge/user picker        | user/judge list endpoint                       | `mock-api/*`    |
| PDF download             | real PDF download (only `pdfStorageKey` today) | export job only |

**Plan.** For each: replace the mock call inside the `*.service.ts` with a real `apiClient` call, delete the corresponding `mock-api` entry, update `docs/api-integration.md` §17 + `docs/codemap.md`. No UI change expected (services already return the real shape).

**Acceptance.** `mock-api/` shrinks to empty; §17 gap register cleared.

---

## Sequencing

1. Item 1 (unblocks everything prod) → 2 → 3 (coordination, parallel).
2. Item 4 rows land individually as backend endpoints appear — not blocking go-live.

## Out of scope / follow-ups

- `expectedVersion` for cases/participants — only if backend adds versioning there.
- `X-Request-ID` → real monitoring sink (Sentry etc.) — currently captured on `ApiError` only.
- Production realtime audio / WebSocket auth — backend not ready (LongPolling pinned).
