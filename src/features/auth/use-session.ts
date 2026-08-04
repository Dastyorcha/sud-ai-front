import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { me, type SessionUser } from "@/features/auth/auth.service";
import { ApiError } from "@/shared/lib/http/api-error";
import { queryKeys } from "@/shared/lib/query/query-keys";

export interface UseSessionResult {
  user: SessionUser | undefined;
  /** Always true while the temporary public-access mode is enabled. */
  hasSession: boolean;
  query: UseQueryResult<SessionUser, ApiError>;
}

/** Public compatibility identity used for display and existing capability UI. */
export function useSession(): UseSessionResult {
  const query = useQuery<SessionUser, ApiError>({
    queryKey: queryKeys.auth.me(),
    queryFn: me,
    retry: false,
    staleTime: 60_000,
  });

  return { user: query.data, hasSession: true, query };
}
