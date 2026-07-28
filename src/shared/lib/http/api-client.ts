import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { createRequestId, setLastRequestId } from "@/shared/lib/http/request-id";
import { parseApiError } from "@/shared/lib/http/api-error";

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
 * The single axios instance every service imports. `baseURL` stays relative
 * (`""`) — callers pass same-origin paths (`/api/v1/...`); the Vite dev proxy
 * forwards to the real host and prod sits behind a same-origin reverse proxy
 * (guide §1's CORS workaround — never `Access-Control-Allow-Origin: *`).
 */
export const apiClient = axios.create({
  baseURL: "",
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
  (error: unknown) => {
    const apiError = parseApiError(error);
    setLastRequestId(apiError.requestId);
    return Promise.reject(apiError);
  }
);
