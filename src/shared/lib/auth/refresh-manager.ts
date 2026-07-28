import type { InternalAxiosRequestConfig } from "axios";
import { apiClient, setUnauthorizedHandler } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import {
  forceLogoutRedirect,
  getAccessToken,
  getRefreshToken,
  hasValidRefreshToken,
  setTokens,
  type AuthTokens,
} from "@/shared/lib/auth/token-store";

/**
 * Single-flight token refresh + `401` retry (guide §2, mandatory). Lives in
 * `shared/` (not `features/auth/auth.service.ts`) because it's wired
 * directly into `api-client.ts`'s response interceptor and FSD forbids a
 * `shared/` module importing `features/` — so it keeps its own minimal copy
 * of the `POST /auth/refresh` call instead of reusing the service.
 */

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<void> | null = null;

function isAuthEndpoint(url: string | undefined): boolean {
  return Boolean(url) && (url!.includes("/auth/login") || url!.includes("/auth/refresh"));
}

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

/**
 * `api-client`'s injected `401` handler: skips auth endpoints and
 * already-retried requests (never loops), refreshes once (single-flight, via
 * `refreshSession`), retries the original request with the new access
 * token, and forces a logout + redirect on any failure along the way (no
 * refresh token, or the refresh call itself fails).
 */
async function handleUnauthorized(original: InternalAxiosRequestConfig) {
  const config = original as RetryableConfig;

  if (isAuthEndpoint(config.url) || config._retry || !hasValidRefreshToken()) {
    forceLogoutRedirect();
    return undefined;
  }

  config._retry = true;
  try {
    await refreshSession();
  } catch {
    forceLogoutRedirect();
    return undefined;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return apiClient(config);
}

setUnauthorizedHandler(handleUnauthorized);
