import { useEffect, useState } from "react";
import { getCase } from "@/shared/lib/mock-api/court-case.service";
import type { CourtCase } from "@/shared/types/models";

export interface UseCaseResult {
  data: CourtCase | null;
  isLoading: boolean;
  error: Error | null;
}

/** Consumer hook over `court-case.service.getCase` — a single case by id. */
export function useCase(caseId: string): UseCaseResult {
  const [data, setData] = useState<CourtCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getCase(caseId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Failed to load case"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return { data, isLoading, error };
}
