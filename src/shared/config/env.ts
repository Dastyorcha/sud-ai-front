/**
 * Typed environment config. Every app-code request path stays same-origin
 * relative (`/api/v1/...`) — `apiBaseUrl` is only consumed by the Vite dev
 * proxy (`vite.config.ts`) to forward to the real backend host. Never set
 * axios `baseURL` to `apiBaseUrl` directly (would break the CORS workaround).
 */

/** `/api/v1` — every REST call is mounted under this prefix. */
export const API_PREFIX = "/api/v1";

/** `/hubs/demo-transcript` — the SignalR demo transcript hub. */
export const DEMO_TRANSCRIPT_HUB_PATH = "/hubs/demo-transcript";

/** Real backend host, used only by the dev proxy — defaults to the guide's placeholder. */
const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://example.com";

export const env = {
  apiBaseUrl,
  apiPrefix: API_PREFIX,
} as const;
