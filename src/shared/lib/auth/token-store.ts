import { setAccessTokenGetter } from "@/shared/lib/http/api-client";
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY } from "@/shared/lib/i18n/locale";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";

/**
 * Persisted JWT session (guide §2). Kept as a plain module singleton (not a
 * React hook) so both React code (`use-session.ts`) and non-React code
 * (`api-client.ts`'s interceptor via `refresh-manager.ts`) share one source
 * of truth. Persists to `localStorage` so a refresh survives a page reload.
 */

const STORAGE_KEY = "lexkotib:auth-tokens";
/** Treat the access token as expired slightly before its real expiry so a
 * request never races a stale token mid-flight. */
const EXPIRY_SKEW_MS = 5_000;

export interface AuthTokens {
  accessToken: string;
  /** ISO 8601. */
  accessTokenExpiresAt: string;
  refreshToken: string;
  /** ISO 8601. */
  refreshTokenExpiresAt: string;
}

function readStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function writeStoredTokens(next: AuthTokens | null): void {
  try {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode / quota) — session just won't survive reload.
  }
}

let tokens: AuthTokens | null = readStoredTokens();
/** Guards against redirecting more than once when several in-flight
 * requests 401 in the same burst (each calls `forceLogoutRedirect`). */
let hasRedirected = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** Persists a fresh token pair — on login, or on a `/auth/refresh` rotation. */
export function setTokens(next: AuthTokens): void {
  tokens = next;
  hasRedirected = false;
  writeStoredTokens(next);
  notify();
}

/** Drops the local session without navigating. Callers that also need to
 * redirect use `forceLogoutRedirect`. */
export function clearTokens(): void {
  tokens = null;
  writeStoredTokens(null);
  notify();
}

export function getAccessToken(): string | undefined {
  return tokens?.accessToken;
}

export function getRefreshToken(): string | undefined {
  return tokens?.refreshToken;
}

function parseExpiry(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

/** Whether the current access token is missing or expired (with a small safety skew). */
export function isAccessTokenExpired(): boolean {
  const expiresAt = parseExpiry(tokens?.accessTokenExpiresAt);
  return expiresAt === undefined || Date.now() >= expiresAt - EXPIRY_SKEW_MS;
}

/** Whether a refresh token exists and hasn't expired — the source of truth
 * for "is there a session" (silent access-token refresh handles the rest). */
export function hasValidRefreshToken(): boolean {
  const expiresAt = parseExpiry(tokens?.refreshTokenExpiresAt);
  return Boolean(tokens?.refreshToken) && expiresAt !== undefined && Date.now() < expiresAt;
}

/** `useSyncExternalStore` subscription — re-renders session-dependent UI on
 * login/logout/refresh. */
export function subscribeTokens(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Clears the session and hard-redirects to `LOGIN` (guide §2) — used when a
 * refresh fails, or a `401` can't be recovered another way. A full
 * `window.location` navigation (not a SPA `navigate()`) so it works from
 * non-React code and always leaves a clean slate (module state, React Query
 * cache) for the next login. Idempotent across a burst of failing requests.
 */
export function forceLogoutRedirect(): void {
  clearTokens();
  if (hasRedirected) return;
  hasRedirected = true;
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  const locale = isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
  window.location.assign(withLocale(locale, ROUTE_PATHS.LOGIN));
}

// Wires the real token getter into the standalone http client — see
// `api-client.ts`'s `setAccessTokenGetter` stub comment.
setAccessTokenGetter(getAccessToken);
