import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { listParticipants } from "@/shared/lib/mock-api/participant.service";
import type { Participant } from "@/shared/types/models";

export type UseParticipantsResult = UseMockQueryResult<Participant[]>;

/** Consumer hook over `participant.service.listParticipants` — a case's parties. */
export function useParticipants(caseId: string): UseParticipantsResult {
  return useMockQuery(() => listParticipants(caseId), [caseId]);
}
