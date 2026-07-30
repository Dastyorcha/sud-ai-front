import axios, { isAxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { createRequestId, setLastRequestId } from "@/shared/lib/http/request-id";
import { parseApiError } from "@/shared/lib/http/api-error";
import { env } from "@/shared/config/env";

/**
 * Reads the current access token, or `undefined` when signed out. Defaults to
 * a no-op; integration-03's auth store calls `setAccessTokenGetter` once at
 * app init so this module builds/tests standalone before auth exists.
 */
export type AccessTokenGetter = () => string | undefined;

let getAccessToken: AccessTokenGetter = () => undefined;

/** Wires the real token getter — called once by the auth store (integration-03). */
export function setAccessTokenGetter(getter: AccessTokenGetter): void {
  getAccessToken = getter;
}

/**
 * Handles a `401` that survived `parseApiError` — return the retried
 * request's response to recover, or `undefined` to let the `401` propagate
 * as-is. Wired once by `shared/lib/auth/refresh-manager.ts` (single-flight
 * refresh-then-retry, guide §2); defaults to a no-op so this module stays
 * standalone/testable before auth exists.
 */
export type UnauthorizedHandler = (
  originalRequest: InternalAxiosRequestConfig
) => Promise<AxiosResponse | undefined>;

let handleUnauthorized: UnauthorizedHandler = () => Promise.resolve(undefined);

/** Wires the real 401 handler — called once by `refresh-manager` at app init. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  handleUnauthorized = handler;
}

/**
 * The single axios instance every service imports. Callers pass paths prefixed
 * with `API_PREFIX` (`/api/v1/...`); `baseURL` supplies only the origin, so the
 * `/api/v1` prefix is applied exactly once (handoff §1). It resolves to `""`
 * (relative → Vite dev proxy) in dev and to the absolute backend origin in prod.
 */
export const apiClient = axios.create({
  baseURL: env.restBaseUrl,
  timeout: 30_000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set("Accept", "application/json");
  config.headers.set("X-Request-ID", createRequestId());

  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    setLastRequestId(response.headers["x-request-id"] as string | undefined);
    return response;
  },
  async (error: unknown) => {
    const apiError = parseApiError(error);
    setLastRequestId(apiError.requestId);

    if (apiError.status === 401 && isAxiosError(error) && error.config) {
      const retried = await handleUnauthorized(error.config);
      if (retried) return retried;
    }

    return Promise.reject(apiError);
  }
);
