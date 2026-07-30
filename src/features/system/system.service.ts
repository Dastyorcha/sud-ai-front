import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX, env } from "@/shared/config/env";

/**
 * Startup connectivity probe (handoff §4). `GET /api/v1/system` is public and
 * cheap, so it doubles as the boot-time reachability check; `/health/ready`
 * lives at the bare origin (outside `/api/v1`) and is a secondary signal. Both
 * are non-blocking — the app still renders and lets the login flow surface auth
 * errors; this only decides whether to show the "can't reach server" banner.
 */

/** `GET /api/v1/system` response (handoff §4). */
export interface SystemInfo {
  service: string;
  apiVersion: string;
}

/** Reads `GET /api/v1/system`. Rejects (via `parseApiError`) when unreachable. */
export async function getSystemInfo(): Promise<SystemInfo> {
  const { data } = await apiClient.get<SystemInfo>(`${API_PREFIX}/system`);
  return data;
}

/**
 * Boot-time reachability check. Resolves `true` when the backend answers
 * `GET /api/v1/system`, `false` on any network/HTTP failure — never throws, so
 * callers can probe without a try/catch.
 */
export async function checkBackendReachable(): Promise<boolean> {
  try {
    await getSystemInfo();
    return true;
  } catch {
    return false;
  }
}

/**
 * Optional `GET /health/ready` probe against the bare origin (`env.hubOrigin`
 * — relative in dev via the `/health` proxy, absolute in prod). Resolves
 * `true` on `2xx`, `false` otherwise. Not wired into boot by default; available
 * for a deeper readiness check when needed.
 */
export async function checkHealthReady(): Promise<boolean> {
  try {
    const response = await fetch(`${env.hubOrigin}/health/ready`, {
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}
