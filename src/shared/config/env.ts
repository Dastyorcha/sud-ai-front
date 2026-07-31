/**
 * Typed environment config (handoff §1). The backend exposes REST under
 * `<origin>/api/v1` and non-REST surfaces (SignalR hub, health probes) under
 * the bare `<origin>`, so the two are kept as separate env vars:
 *
 *   VITE_API_ORIGIN   = https://api.beezy.uz          # health + SignalR hub
 *   VITE_API_BASE_URL = https://api.beezy.uz/api/v1   # REST
 *
 * Dev vs prod switch: in dev every request path stays same-origin relative
 * (`/api/v1/...`, `/hubs/...`) and the Vite dev proxy (`vite.config.ts`)
 * forwards to the real host — so the backend needs no CORS. In prod there is
 * no proxy, so requests go straight to the absolute origin (§2: the backend
 * must allowlist the app origin). `serverOrigin` encodes that switch.
 */

/** `/api/v1` — every REST call is mounted under this prefix (added by callers). */
export const API_PREFIX = "/api/v1";

/** `/hubs/demo-transcript` — the SignalR demo transcript hub (not under `/api/v1`). */
export const DEMO_TRANSCRIPT_HUB_PATH = "/hubs/demo-transcript";

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, "");

/** `VITE_API_ORIGIN` — bare backend origin (host), no `/api/v1`. */
const apiOrigin = stripTrailingSlash((import.meta.env.VITE_API_ORIGIN as string | undefined) ?? "");

/** `VITE_API_BASE_URL` — REST base, i.e. `<origin>/api/v1`. */
const apiBaseUrl = stripTrailingSlash(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
);

/** Backend origin with the `/api/v1` suffix removed (callers re-add it). */
const resolvedOrigin = apiOrigin || apiBaseUrl.replace(/\/api\/v1$/, "");

/**
 * The origin every request resolves against:
 * - dev  → `""` (relative → Vite dev proxy, no CORS needed)
 * - prod → the absolute backend origin (no `/api/v1`; callers add `API_PREFIX`,
 *   the hub adds `DEMO_TRANSCRIPT_HUB_PATH` — never doubled, §1)
 */
const serverOrigin = import.meta.env.DEV ? "" : resolvedOrigin;

export const env = {
  /** Raw `VITE_API_ORIGIN` (health/readiness probes live here, §4). */
  apiOrigin,
  /** Raw `VITE_API_BASE_URL` (documentation / connectivity display). */
  apiBaseUrl,
  /** axios `baseURL` — relative in dev, absolute origin in prod. */
  restBaseUrl: serverOrigin,
  /** SignalR hub origin — relative in dev, absolute in prod. */
  hubOrigin: serverOrigin,
  apiPrefix: API_PREFIX,
} as const;
