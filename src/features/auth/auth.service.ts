import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { AuthTokens } from "@/shared/lib/auth/token-store";
import type { ApiRole } from "@/shared/constants/court-permissions";

/**
 * Raw `/auth/*` calls (guide §7) — no persistence here, that's
 * `shared/lib/auth/token-store.ts`. `refresh-manager.ts`'s single-flight 401
 * handler keeps its own copy of the refresh call (it's a `shared/` module
 * and can't import this `features/` one — FSD).
 */

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthMeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: ApiRole;
}

/** Current session's profile (guide §7.4), with a convenience `fullName`. */
export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: ApiRole;
}

/** `POST /auth/login` (guide §7.1) — returns the initial token pair. */
export async function login(input: LoginInput): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>(`${API_PREFIX}/auth/login`, input);
  return data;
}

/** `POST /auth/refresh` (guide §7.2) — rotates both tokens. */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>(`${API_PREFIX}/auth/refresh`, { refreshToken });
  return data;
}

/**
 * `POST /auth/logout` (guide §7.3) — `204` even if the backend can't find
 * the token; callers always clear the local session regardless of outcome
 * (see `features/auth/use-logout.ts`).
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post(`${API_PREFIX}/auth/logout`, { refreshToken });
}

/** `GET /auth/me` (guide §7.4) — current session's profile + role. */
export async function me(): Promise<SessionUser> {
  const { data } = await apiClient.get<AuthMeResponse>(`${API_PREFIX}/auth/me`);
  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    role: data.role,
  };
}
