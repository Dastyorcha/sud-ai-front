import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { listCases, type CaseFilters } from "@/shared/lib/mock-api/court-case.service";
import type { CourtCase } from "@/shared/types/models";
import type { Paginated } from "@/shared/types/query-types";

export interface UseCasesParams {
  filters?: Partial<CaseFilters>;
  page?: number;
  pageSize?: number;
}

export type UseCasesResult = UseMockQueryResult<Paginated<CourtCase>>;

/**
 * Case-list hook over `court-case.service.listCases` — re-fetches when the
 * (server-style) filters or page change. `search` is passed straight through;
 * debounce it at the call site.
 */
export function useCases({ filters, page = 1, pageSize }: UseCasesParams = {}): UseCasesResult {
  const search = filters?.search ?? "";
  const status = filters?.status;
  const caseType = filters?.caseType;
  const courtType = filters?.courtType;

  return useMockQuery(
    () => listCases({ filters: { search, status, caseType, courtType }, page, pageSize }),
    [search, status, caseType, courtType, page, pageSize],
  );
}
