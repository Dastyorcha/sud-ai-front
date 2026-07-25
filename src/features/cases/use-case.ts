import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { getCase } from "@/shared/lib/mock-api/court-case.service";
import type { CourtCase } from "@/shared/types/models";

export type UseCaseResult = UseMockQueryResult<CourtCase | null>;

/** Consumer hook over `court-case.service.getCase` — a single case by id. */
export function useCase(caseId: string): UseCaseResult {
  return useMockQuery(() => getCase(caseId), [caseId]);
}
