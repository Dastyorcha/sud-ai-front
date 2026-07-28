import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { listCases, type CaseListFilters } from "@/features/cases/case.service";
import type { CourtCase } from "@/shared/types/models";
import type { Paginated } from "@/shared/types/query-types";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { ApiError } from "@/shared/lib/http/api-error";

export interface UseCasesParams {
  filters?: CaseListFilters;
  page?: number;
  pageSize?: number;
}

export interface UseCasesResult {
  data: Paginated<CourtCase> | undefined;
  isLoading: boolean;
  error: ApiError | null;
  query: UseQueryResult<Paginated<CourtCase>, ApiError>;
}

/**
 * Case-list hook over `case.service.listCases` (guide §8 `GET /cases`) —
 * re-fetches when the server-side filters (`caseNumber`, `courtName`,
 * `status`) or page change. Debounce free-text input at the call site.
 */
export function useCases({
  filters,
  page = 1,
  pageSize = 20,
}: UseCasesParams = {}): UseCasesResult {
  const params = { filters, page, pageSize };
  const query = useQuery<Paginated<CourtCase>, ApiError>({
    queryKey: queryKeys.cases.list(params),
    queryFn: () => listCases(params),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    query,
  };
}
