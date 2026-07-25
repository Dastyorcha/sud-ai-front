import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { getHearing, listHearings } from "@/shared/lib/mock-api/hearing.service";
import type { Hearing } from "@/shared/types/models";

/** A case's hearings, oldest first. */
export function useHearings(caseId: string): UseMockQueryResult<Hearing[]> {
  return useMockQuery(() => listHearings(caseId), [caseId]);
}

/** A single hearing by id. */
export function useHearing(hearingId: string): UseMockQueryResult<Hearing | null> {
  return useMockQuery(() => getHearing(hearingId), [hearingId]);
}
