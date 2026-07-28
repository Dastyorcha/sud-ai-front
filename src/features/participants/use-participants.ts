import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  createParticipant,
  deactivateParticipant,
  listParticipants,
  updateParticipant,
  type CreateParticipantInput,
  type UpdateParticipantInput,
} from "@/features/participants/participant.service";
import type { Participant } from "@/shared/types/models";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { ApiError } from "@/shared/lib/http/api-error";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";

export interface UseParticipantsResult {
  data: Participant[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  query: UseQueryResult<Participant[], ApiError>;
}

/**
 * A case's participants (guide §8 `GET /cases/{id}/participants`). No
 * `GET /participants/{id}` exists (guide §17) — this list is the only source
 * of participant data; edit/detail views must read a single participant out
 * of it rather than fetching by id. Defaults to active-only (deactivated
 * participants — soft `DELETE` — drop out of the case-detail table).
 */
export function useParticipants(caseId: string, isActive = true): UseParticipantsResult {
  const query = useQuery<Participant[], ApiError>({
    queryKey: queryKeys.participants.list(caseId),
    queryFn: () => listParticipants(caseId, { isActive }),
    enabled: Boolean(caseId),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
    query,
  };
}

/** Adds a participant (guide §8 `POST /cases/{id}/participants`). */
export function useCreateParticipant(
  caseId: string
): UseApiMutationResult<Participant, CreateParticipantInput> {
  return useApiMutation({
    mutationFn: createParticipant,
    invalidateKeys: [queryKeys.participants.list(caseId)],
  });
}

/** Patches a participant (guide §8 `PATCH /participants/{id}`). */
export function useUpdateParticipant(
  caseId: string
): UseApiMutationResult<Participant, { id: string; patch: UpdateParticipantInput }> {
  return useApiMutation({
    mutationFn: ({ id, patch }) => updateParticipant(id, patch),
    invalidateKeys: [queryKeys.participants.list(caseId)],
  });
}

/** Deactivates a participant (guide §8 `DELETE /participants/{id}` — soft delete). */
export function useDeactivateParticipant(caseId: string): UseApiMutationResult<void, string> {
  return useApiMutation({
    mutationFn: deactivateParticipant,
    invalidateKeys: [queryKeys.participants.list(caseId)],
  });
}
