import { useEffect, useState } from "react";
import { listCases, type CaseFilters } from "@/shared/lib/mock-api/court-case.service";
import type { CourtCase } from "@/shared/types/models";
import type { Paginated } from "@/shared/types/query-types";

export interface UseCasesParams {
  filters?: Partial<CaseFilters>;
  page?: number;
  pageSize?: number;
}

export interface UseCasesResult {
  data: Paginated<CourtCase> | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Consumer hook over `court-case.service.listCases` — powers the case list.
 * Re-fetches when the (server-style) filters or page change. No react-query;
 * plain `useState`/`useEffect` per the mock-api pattern (see `use-users.ts`).
 * `search` is passed straight through; debounce it at the call site.
 */
export function useCases({ filters, page = 1, pageSize }: UseCasesParams = {}): UseCasesResult {
  const [data, setData] = useState<Paginated<CourtCase> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const search = filters?.search ?? "";
  const status = filters?.status;
  const caseType = filters?.caseType;
  const courtType = filters?.courtType;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listCases({ filters: { search, status, caseType, courtType }, page, pageSize })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Failed to load cases"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, caseType, courtType, page, pageSize]);

  return { data, isLoading, error };
}
