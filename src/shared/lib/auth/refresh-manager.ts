import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import { getRefreshToken, setTokens, type AuthTokens } from "@/shared/lib/auth/token-store";

/**
 * Single-flight token refresh (guide §2, mandatory). Lives in `shared/` (not
 * `features/auth/auth.service.ts`) because `api-client.ts`'s response
 * interceptor calls it directly (see `handleUnauthorized`, wired in the
 * `401`-retry step) and FSD forbids a `shared/` module importing
 * `features/` — so it keeps its own minimal copy of the `POST /auth/refresh`
 * call instead of reusing the service.
 */

let refreshPromise: Promise<void> | null = null;

/** Raw `POST /auth/refresh` (guide §7.2) — see the module doc for why this
 * isn't shared with `features/auth/auth.service.ts`. */
async function requestRefresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>(`${API_PREFIX}/auth/refresh`, {
    refreshToken,
  });
  return data;
}

async function performRefresh(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("no_refresh_token");
  const tokens = await requestRefresh(refreshToken);
  setTokens(tokens);
}

/**
 * Refreshes the access/refresh token pair. Concurrent callers (two `401`s
 * firing back-to-back) share the same in-flight promise instead of racing —
 * rotation would invalidate a second parallel `/auth/refresh` call anyway.
 * The `api-client` `401` handler is the primary caller.
 */
export function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
