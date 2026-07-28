import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getCase } from "@/features/cases/case.service";
import type { CourtCase } from "@/shared/types/models";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { ApiError } from "@/shared/lib/http/api-error";

export interface UseCaseResult {
  data: CourtCase | undefined;
  isLoading: boolean;
  error: ApiError | null;
  query: UseQueryResult<CourtCase, ApiError>;
}

/** Single-case hook over `case.service.getCase` (guide §8 `GET /cases/{id}`). */
export function useCase(caseId: string): UseCaseResult {
  const query = useQuery<CourtCase, ApiError>({
    queryKey: queryKeys.cases.detail(caseId),
    queryFn: () => getCase(caseId),
    enabled: Boolean(caseId),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    query,
  };
}
