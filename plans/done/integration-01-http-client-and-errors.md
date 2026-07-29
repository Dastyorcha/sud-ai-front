# Integration 01 — Axios client, dev proxy & error contract

- **Status:** done
- **Size:** medium
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §1 (env/base/CORS), §3 (error format), §16 (concurrency)

## Goal

Stand up the single axios instance every service uses — same-origin `/api/v1`
base, Bearer auth, `X-Request-ID`, and a parser that turns both RFC
ProblemDetails and ASP.NET ValidationProblemDetails into one typed `ApiError`
mapped to a localized `t()` key.

## Scope & non-goals

- **In scope:** axios instance + request/response interceptors, dev-server proxy
  for `/api` + `/hubs`, `env` config, `ApiError` type, error parser, extended
  error-code → message-key map, request-id capture. Token attach/refresh wiring
  is stubbed here and completed in integration-03.
- **Out of scope:** any endpoint call, TanStack Query setup (integration-02),
  refresh rotation logic (integration-03).

## Affected files

| Path (FSD layer)                          | New? | Intent                                                    |
| ----------------------------------------- | ---- | --------------------------------------------------------- |
| `vite.config.ts`                          | no   | `server.proxy` for `/api` + `/hubs` → `VITE_API_BASE_URL` |
| `.env.example`                            | yes  | `VITE_API_BASE_URL=https://example.com`                   |
| `src/shared/config/env.ts`                | yes  | typed env reader (base URL, api prefix `/api/v1`)         |
| `src/shared/lib/http/api-client.ts`       | yes  | the axios instance + interceptors                         |
| `src/shared/lib/http/api-error.ts`        | yes  | `ApiError` class + `parseApiError` (both problem shapes)  |
| `src/shared/lib/http/request-id.ts`       | yes  | generate/read `X-Request-ID`, expose last id for logging  |
| `src/shared/lib/errors/error-map.ts`      | no   | extend `ErrorCode` union with guide `code` values         |
| `src/shared/lib/i18n/messages/*.ts`       | no   | add `errors.codes.*` keys for new codes (uz/en/ru)        |
| `docs/codemap.md`, `docs/architecture.md` | no   | document the `shared/lib/http` layer + env config         |

## Design notes

- **Base URL.** `env.apiBaseUrl` defaults to `https://example.com`; axios
  `baseURL` is `''` (relative) so requests hit `/api/v1/...` same-origin. The dev
  proxy (below) forwards to the real host; prod is same-origin behind a reverse
  proxy. This is the guide's recommended CORS workaround (§1) — never set
  `Access-Control-Allow-Origin: *` client-side.
- **Dev proxy** in `vite.config.ts`:
  ```ts
  server: {
    proxy: {
      "/api":  { target: env.VITE_API_BASE_URL, changeOrigin: true, secure: false },
      "/hubs": { target: env.VITE_API_BASE_URL, changeOrigin: true, ws: true },
    },
  }
  ```
- **Request interceptor:** set `Accept: application/json`; attach
  `Authorization: Bearer <accessToken>` from the token store (integration-03
  fills the store; here it reads an injectable getter so this plan builds/tests
  standalone); attach a fresh `X-Request-ID` (UUID) per request.
- **Response interceptor:** on every response (success or error) capture the
  response `X-Request-ID` header into `request-id.ts` for monitoring. On error,
  throw `parseApiError(error)`.
- **`ApiError`** carries: `status`, `code` (guide `code` or derived), `title`,
  `detail`, `requestId`, `fieldErrors?` (from ValidationProblemDetails `errors`).
  `parseApiError` handles: (a) ProblemDetails body with `code`; (b)
  ValidationProblemDetails with `errors` map → `code: "validation_error"`,
  populate `fieldErrors`; (c) empty-body `401/403` (guide §3 warns bodies may be
  absent) → synthesize code from status; (d) network/timeout → `network_error`.
- **Status → code fallback** (guide §3 table): 400→`validation_error`,
  401→`unauthorized`, 403→`forbidden`, 404→`not_found`, 409→use body `code`
  (e.g. `CONCURRENCY_CONFLICT`) else `conflict`, 500→`server_error`.
- **error-map.ts:** extend `ErrorCode` with the concrete guide codes used in UI
  (`CONCURRENCY_CONFLICT`, `TRANSCRIPT_LOCKED`, `CASE_NUMBER_EXISTS`,
  `INVALID_CREDENTIALS`, `unauthorized`, `timeout`, …). Keep the existing generic
  fallbacks. `errorMessageKey(ApiError)` reads `.code`. Uppercase server codes map
  to `errors.codes.<lower_snake>` keys.

## Steps

1. [x] Add `src/shared/config/env.ts` + `.env.example` (base URL `https://example.com`, prefix) — `feat: typed env config for api base url`
2. [x] Add dev proxy for `/api` + `/hubs` in `vite.config.ts` — `feat: proxy api and hubs to backend in dev`
3. [x] Add `api-error.ts` (`ApiError` + `parseApiError` for both problem shapes + empty-body + network) — `feat: typed api error parser`
4. [x] Add `request-id.ts` (UUID gen + last-response-id capture) — `feat: x-request-id generation and capture`
5. [x] Add `api-client.ts` axios instance with request/response interceptors (token getter injectable, request-id, error parse) — `feat: axios api client with interceptors`
6. [x] Extend `error-map.ts` `ErrorCode` union + add `errors.codes.*` keys in uz/en/ru — `feat: map backend error codes to localized keys`
7. [x] docs: sync `docs/codemap.md` + `docs/architecture.md` (new `shared/lib/http` layer, env) — `docs: document http client layer`

## Risks / ripple / escalation

- Shared surface: introduces the layer all later plans depend on — get the
  `ApiError`/interceptor shape right first.
- New dependency: `axios` (needs user approval).
- Escalation: if the deploy topology isn't same-origin reverse-proxy, the base-URL
  strategy must change — confirm with user before prod build.
- Rollback: layer is additive; nothing imports it until integration-03+.

## Verification

- `npx tsc -b` clean, `npm run lint` clean.
- Unit-check `parseApiError` against the guide's three sample bodies (§3) +
  an empty-body 403 + a network error.
- `npm run dev`: a hand `fetch('/api/v1/system')` through the proxy returns the
  `{ service, apiVersion }` payload from `example.com`.
