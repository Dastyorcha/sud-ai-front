# API integration reference

The LexKotib backend integration (`plans/done/integration-00-overview.md` …
`integration-11-enums-cleanup-acceptance.md`) replaced most mock services
with real REST + SignalR calls. This is the reference for the live contract,
the endpoint map, the known backend gaps, and the concurrency convention.
Source of truth for the contract itself is the backend's
`FRONTEND_INTEGRATION_GUIDE.md`; this doc records how the frontend implements
it and where it deliberately still diverges.

## Base URL & environment

Two separate env vars (handoff §1) — the origin is not the REST base:

- `VITE_API_ORIGIN` — bare backend origin (`https://api.beezy.uz`). SignalR hub
  (`/hubs/...`) and health probes (`/health/*`, `GET /api/v1/system`) live here.
- `VITE_API_BASE_URL` — REST base, i.e. `<origin>/api/v1`
  (`https://api.beezy.uz/api/v1`). `.env.example` ships the real production
  values directly — `cp .env.example .env` to point at the live backend; no
  placeholder swap needed.
- API prefix: `/api/v1` (`src/shared/config/env.ts`'s `API_PREFIX`, appended by
  every service). SignalR hub path: `/hubs/demo-transcript`
  (`DEMO_TRANSCRIPT_HUB_PATH`). **Never add `/api/v1` twice** — `apiClient`'s
  `baseURL` carries only the origin; callers add `API_PREFIX`.
- **Dev vs prod switch** (`env.restBaseUrl` / `env.hubOrigin`, gated on
  `import.meta.env.DEV`):
  - **Dev** → `""` (relative). The Vite dev server (`vite.config.ts`) proxies
    same-origin `/api`, `/hubs` and `/health` to the origin (derived from
    `VITE_API_ORIGIN`, or `VITE_API_BASE_URL` with `/api/v1` stripped), so the
    backend needs no CORS.
  - **Prod** → the absolute backend origin. There is no proxy, so the backend
    **must** allowlist the exact app origin (§2/§3). Never set
    `Access-Control-Allow-Origin: *`.

## Startup connectivity (`src/features/system/`)

Boot-time reachability probe (handoff §4), non-blocking:

- `system.service.ts` — `getSystemInfo()` (`GET /api/v1/system`, public),
  `checkBackendReachable()` (never throws → `boolean`), and an optional
  `checkHealthReady()` (`GET /health/ready` at the bare origin).
- `use-backend-connectivity.ts` / `backend-connectivity-probe.tsx` — the probe
  runs once on mount inside `LocaleProvider`; on failure it shows a persistent,
  retryable "can't reach server" toast (`showBackendUnreachable`,
  `system.unreachable*` i18n keys) and dismisses it once a probe succeeds. It
  never gates rendering — the login flow still surfaces its own auth errors.

## HTTP client (`src/shared/lib/http/`)

- `api-client.ts` — single axios instance (`apiClient`). Request interceptor
  sets `Accept: application/json`, a fresh `X-Request-ID` per call
  (`request-id.ts`), and `Authorization: Bearer <token>` from an injectable
  getter (`setAccessTokenGetter`, wired once by the auth store). Response
  interceptor captures `X-Request-ID` and normalizes every rejection through
  `parseApiError`.
- `api-error.ts` — `ApiError { status, code, title?, detail?, requestId?,
fieldErrors? }` + `parseApiError()`. Distinguishes: RFC 7807
  `ProblemDetails` with a `code` field, ASP.NET `ValidationProblemDetails`
  (`errors` map → `code: "validation_error"` + `fieldErrors`), an empty-body
  error (falls back to a status-derived code: `400→validation_error`,
  `401→unauthorized`, `403→forbidden`, `404→not_found`, `409→conflict`,
  `5xx→server_error`), and network/timeout failures (`status: 0`,
  `network_error`/`timeout`).
- `shared/lib/errors/error-map.ts` — `errorMessageKey(error)` normalizes
  `ApiError.code` to `lower_snake` and resolves an `errors.codes.*` i18n key.
  The UI never renders a raw `code`/`title`/`detail` string.
- `shared/lib/auth/refresh-manager.ts` — single-flight `401` handling: one
  in-flight `refreshSession()` promise is shared by every concurrent `401`;
  auth endpoints and already-retried requests skip straight to
  `forceLogoutRedirect()` (never loops).

## Query layer (`src/shared/lib/query/`)

- `query-keys.ts` — the single `queryKeys` factory every feature hook and
  `useApiMutation`'s `invalidateKeys` read from.
- `use-api-mutation.ts` — wraps `useMutation`: on `409 CONCURRENCY_CONFLICT`
  invalidates + toasts a localized "refresh and retry" message; any other
  `ApiError` toasts `errorMessageKey(error)`; never auto-retries.
- `use-job-polling.ts` — `useJobPolling(jobId)` polls `GET /jobs/{id}` every
  1.5s via `refetchInterval` until `status` is `Succeeded`/`Failed`, then
  stops (`refetchInterval` returns `false`).

## Endpoint map (guide-numbered)

| Guide §         | Endpoints                                                                                                                                                                                                 | Frontend service                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| §7 auth         | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`                                                                                                                             | `features/auth/auth.service.ts`                        |
| §8 cases        | `GET/POST /cases`, `GET/PATCH /cases/{id}`, `POST /cases/{id}/archive`                                                                                                                                    | `features/cases/case.service.ts`                       |
| §8 participants | `GET/POST /cases/{id}/participants`, `PATCH/DELETE /participants/{id}`                                                                                                                                    | `features/participants/participant.service.ts`         |
| §9 hearings     | `POST /cases/{id}/hearings`, `POST /hearings/{id}/audio`, `POST /hearings/{id}/transcribe`, `POST /hearings/{id}/start`, `POST /hearings/{id}/stop`, `GET /hearings/{id}/transcript`                      | `features/hearings/hearing.service.ts`                 |
| §9/§10 jobs     | `GET /jobs/{id}`                                                                                                                                                                                          | `shared/lib/query/use-job-polling.ts`                  |
| §10 transcript  | `PATCH /transcript-segments/{id}`, `POST /transcript-segments/{id}/verify`, `PUT /hearings/{id}/speakers`, `POST /hearings/{id}/transcript/validate`, `POST /hearings/{id}/transcript/approve`            | `features/transcript/transcript.service.ts`            |
| §11 events      | `POST /hearings/{id}/events/extract`, `GET /hearings/{id}/events`, `PATCH /events/{id}`, `POST /events/{id}/verify`                                                                                       | `features/events/event.service.ts`                     |
| §12 templates   | `GET /document-templates`, `POST /document-templates`                                                                                                                                                     | `features/documents/template.service.ts`               |
| §12 documents   | `POST /cases/{id}/documents/generate`, `GET/PATCH /documents/{id}`, `POST /documents/{id}/{submit-review,request-changes,approve,export}`, `GET /documents/{id}/download`, `GET /documents/{id}/versions` | `features/documents/document.service.ts`               |
| §13 audit       | `GET /audit-logs`                                                                                                                                                                                         | `features/audit/audit.service.ts`                      |
| §14 SignalR     | `/hubs/demo-transcript` (`PublishMockSegment` → `TranscriptSegmentReceived`)                                                                                                                              | `features/live-session/demo-hub.ts`, `use-demo-hub.ts` |

## §17 gap register (backend follow-ups)

Each row: what's missing, how the frontend copes today, and where.

| Gap                                                           | Frontend workaround                                                                                                                                                                                                                                                                           | Where                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| No user/judge list endpoint                                   | `judgeId` isn't collected by the new-case wizard; `CreateCaseInput.judgeId` is optional and omitted on create, left for a later assignment step                                                                                                                                               | `features/cases/case.service.ts` (`CreateCaseInput`), `features/case-create/use-create-case.ts` |
| No AI document-analysis endpoint                              | Wizard's final step calls a mock `analyzeCaseDocuments` (filename-based draft) instead of a real backend AI pass; result is always shown editable before submit                                                                                                                               | `features/case-create/ai-case-analysis.service.ts`                                              |
| No `GET /hearings` list/detail                                | Stays on `shared/lib/mock-api/hearing.service.ts`; hearing state carried via routing/session where possible on the real route                                                                                                                                                                 | `features/hearings/use-hearings.ts`, `widgets/protocol-workspace/*`, `features/live-session/*`  |
| No `device-check`/`pause`/`resume` hearing transitions        | Real `HearingStatus` never programmatically sets `DeviceCheck`/`Paused`; listed in `HEARING_STATUS` for completeness only                                                                                                                                                                     | `features/hearings/hearing.service.ts`, `shared/types/enums.ts`                                 |
| No audio track list/download endpoint                         | Not surfaced — audio upload is one-shot via `POST /hearings/{id}/audio`                                                                                                                                                                                                                       | `features/hearings/hearing.service.ts`                                                          |
| No case-level document list endpoint                          | Real document flow is hearing-scoped instead (`features/protocol/protocol-panel.tsx`); the generated document's id has no lookup endpoint either, so it's carried in `sessionStorage` per hearing (`useHearingDocumentId`); `widgets/documents-workspace/*` stays on the mock case-level list | `features/protocol/protocol-panel.tsx`, `widgets/documents-workspace/*`                         |
| No PDF download endpoint, only `pdfStorageKey`                | PDF export is job-only (exported-state badge, no download link); `pdfStorageKey`/`storageKey` are never rendered as URLs anywhere                                                                                                                                                             | `features/documents/document.service.ts`                                                        |
| `PATCH` document content-edit returns no regeneration `jobId` | Callers re-GET/poll until `docxStorageKey` changes instead of tracking a job                                                                                                                                                                                                                  | `features/documents/document.service.ts`                                                        |
| No template update/deactivate/download endpoints              | Template catalogue is create + list only                                                                                                                                                                                                                                                      | `features/documents/template.service.ts`                                                        |
| No `GET /participants/{id}`                                   | List-only; edits go through the case's participant list, not a direct fetch-by-id                                                                                                                                                                                                             | `features/participants/participant.service.ts`                                                  |
| No CORS                                                       | Dev: Vite proxy (`/api`, `/hubs`, `/health`) → origin, relative paths. Prod: absolute origin, backend must allowlist the app origin (`env.restBaseUrl`/`hubOrigin`, gated on `import.meta.env.DEV`)                                                                                           | `vite.config.ts`, `shared/config/env.ts`                                                        |
| SignalR WebSocket auth not implemented                        | Hub transport hard-pinned to `HttpTransportType.LongPolling` (`demo-hub.ts`) until the backend's JWT handler reads the WS `access_token` query param                                                                                                                                          | `features/live-session/demo-hub.ts`                                                             |

## Mock layer retained after integration-11 — why

`src/shared/lib/mock-api/` is **not** fully deleted. Every remaining file has
a genuine consumer with no live endpoint to replace it (per-file detail in
`docs/codemap.md`'s "Shared — mock API / data layer" section):

- **`hearing.service.ts` + `job.service.ts` + `data/hearings.ts`** — no
  `GET /hearings` list/detail endpoint exists (gap register above). Consumed
  by `features/hearings/use-hearings.ts` (`useHearings`/`useHearing`),
  `features/live-session/live-hearing-panel.tsx`,
  `widgets/protocol-workspace/*`, `shared/hooks/use-job.ts`.
- **`transcript.service.ts` + `data/transcript-segments.ts`** — powers the
  legacy `features/transcript/transcript-panel.tsx` and
  `widgets/speakers-panel/speakers-panel.tsx`, superseded by
  `features/transcript/real-transcript-panel.tsx` on the real
  `/hearings/:hearingId` route but still reachable from
  `protocol-workspace`.
- **`document.service.ts` + `data/documents.ts`** — no case-level document
  list endpoint; powers `widgets/documents-workspace/*`,
  `widgets/document-editor/*`, `widgets/template-selector/*`. The real
  document flow is hearing-scoped instead
  (`features/protocol/protocol-panel.tsx`, `features/documents/document.service.ts`).
- **`court-case.service.ts` + `participant.service.ts` + `data/court-cases.ts`
  - `data/participants.ts`** — kept only for `views/cases/case-new.tsx`,
    superseded by the real `widgets/new-case-wizard/*` (via
    `features/case-create/use-create-case.ts`) but still reachable from the
    cases list.
- **`user.service.ts` + `data/users.ts` + `data/organization.ts`** — powers
  `views/users/*`, the template's reference CRUD example, out of the
  LexKotib guide's scope entirely.
- **`copilot.service.ts` + `data/copilot.ts`** — the judge-copilot
  ("Sudya maslahatchisi") feature has no real Lex.uz/LLM backend at all.
- **`data/court-users.ts`** — mock judge/user picker data for
  `vocabulary-panel.tsx`/`case-detail.tsx`/`case-new.tsx` (no judge-list
  endpoint, gap register above).
- **`use-mock-query.ts`** (`shared/hooks/`) — the generic loader every
  surviving mock consumer hook above still uses.

Deleted in integration-11 (zero remaining consumers once the real events/audit
services shipped): `event.service.ts`, `data/procedural-events.ts`,
`data/audit-logs.ts`.

## Enum casing (guide §4)

`shared/types/enums.ts` stores the API's canonical PascalCase values for any
enum fully on the real API path (`CASE_STATUS`, `PARTICIPANT_ROLE`,
`PROCEDURAL_EVENT_TYPE`, `EVENT_REVIEW_STATUS`), and keeps the mock layer's
UPPER_SNAKE values alongside PascalCase where a still-mock consumer
genuinely needs them (`HEARING_STATUS`, `SEGMENT_STATUS`, `DOCUMENT_TYPE`,
`DOCUMENT_STATUS`, and `CASE_STATUS`'s mock-only `ACTIVE`/`ARCHIVED` for
`case-new.tsx`). Enums with no real-API consumer at all stay mock-only
UPPER_SNAKE (`COURT_ROLE` — the real session roles are `court-permissions.ts`'s
`ApiRole`; `JOB_STATUS` — the real job poller has its own local `JobStatus`
type in `use-job-polling.ts`; `TEMPLATE_STATUS`, `CASE_STAGE`, `COURT_TYPE`,
`CASE_TYPE`, `CRITICAL_FIELD_TYPE`, `EXPORT_FORMAT`). i18n `enums.*` label
keys mirror the exact enum values in all three locales — see `docs/i18n.md`.

## Concurrency (guide §16)

Every resource that carries a `version` field follows the same pattern:

1. A `GET` response includes `version`.
2. A mutation sends the **last-known** `version` as `expectedVersion` in its
   request body.
3. On success, the cache/local state is updated with the response's new
   `version`.
4. On `409 CONCURRENCY_CONFLICT`, `useApiMutation` invalidates the resource's
   query key and toasts a localized "refresh and retry" message — it never
   silently overwrites.

Resources versioned this way: transcript segments (`PATCH
/transcript-segments/{id}`), transcript approve (`POST
/hearings/{id}/transcript/approve`), procedural events (`PATCH /events/{id}`,
`POST /events/{id}/verify`), and every document lifecycle mutation (`PATCH
/documents/{id}`, submit-review/request-changes/approve/export). Cases and
participants are not versioned by the guide — `archiveCase`/case `PATCH` are
unconditional.
