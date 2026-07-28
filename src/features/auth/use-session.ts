import { useEffect, useSyncExternalStore } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { me, type SessionUser } from "@/features/auth/auth.service";
import {
  forceLogoutRedirect,
  hasValidRefreshToken,
  subscribeTokens,
} from "@/shared/lib/auth/token-store";
import { ApiError } from "@/shared/lib/http/api-error";
import { queryKeys } from "@/shared/lib/query/query-keys";

/**
 * `/auth/me` codes that mean "this session can never recover" (guide §2/
 * §7.4) — distinct from a plain expired-access-token `401`, which
 * `api-client`'s interceptor already resolved with a silent refresh before
 * an error ever reaches this hook.
 */
const UNRECOVERABLE_CODES = new Set(["invalid_access_token", "user_not_available"]);

export interface UseSessionResult {
  user: SessionUser | undefined;
  /** Whether a (possibly not-yet-verified) refresh token exists locally. */
  hasSession: boolean;
  query: UseQueryResult<SessionUser, ApiError>;
}

/**
 * Current session over `GET /auth/me` (guide §7.4) — the source of truth for
 * `useCourtAuth()`'s role/`can()`. Only runs while a refresh token exists
 * (`hasSession`); forces a logout on `INVALID_ACCESS_TOKEN`/
 * `USER_NOT_AVAILABLE` (both already-refreshed-once 401s that still failed).
 */
export function useSession(): UseSessionResult {
  const hasSession = useSyncExternalStore(
    subscribeTokens,
    hasValidRefreshToken,
    hasValidRefreshToken
  );

  const query = useQuery<SessionUser, ApiError>({
    queryKey: queryKeys.auth.me(),
    queryFn: me,
    enabled: hasSession,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    const error = query.error;
    if (error instanceof ApiError && UNRECOVERABLE_CODES.has(error.code.toLowerCase())) {
      forceLogoutRedirect();
    }
  }, [query.error]);

  return { user: query.data, hasSession, query };
}
