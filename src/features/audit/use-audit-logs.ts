import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  listAuditLogs,
  type AuditLogFilters,
  type AuditLogsPage,
} from "@/features/audit/audit.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { ApiError } from "@/shared/lib/http/api-error";

export interface UseAuditLogsParams {
  filters?: AuditLogFilters;
  page?: number;
  pageSize?: number;
  /** Set `false` while the caller isn't allowed to see this data (e.g. non-Administrator). */
  enabled?: boolean;
}

export interface UseAuditLogsResult {
  data: AuditLogsPage | undefined;
  isLoading: boolean;
  error: ApiError | null;
  query: UseQueryResult<AuditLogsPage, ApiError>;
}

/**
 * Audit-log list hook over `audit.service.listAuditLogs` (guide §13
 * `GET /audit-logs`) — re-fetches on filter/page change. `enabled` lets the
 * admin view skip the request entirely for non-Administrator sessions
 * instead of relying only on the `403` fallback.
 */
export function useAuditLogs({
  filters,
  page = 1,
  pageSize = 50,
  enabled = true,
}: UseAuditLogsParams = {}): UseAuditLogsResult {
  const params = { filters, page, pageSize };
  const query = useQuery<AuditLogsPage, ApiError>({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => listAuditLogs(params),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    query,
  };
}
