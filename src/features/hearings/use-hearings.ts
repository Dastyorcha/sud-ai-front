import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  createHearing,
  getHearing,
  listCaseHearings,
  startHearing,
  stopHearing,
  type CreateHearingInput,
} from "@/features/hearings/hearing.service";
import type { Hearing } from "@/shared/types/models";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import { queryKeys } from "@/shared/lib/query/query-keys";
import type { ApiError } from "@/shared/lib/http/api-error";

/** A case's persisted hearings, newest first. */
export function useHearings(caseId: string): UseQueryResult<Hearing[], ApiError> {
  return useQuery<Hearing[], ApiError>({
    queryKey: queryKeys.hearings.list(caseId),
    queryFn: () => listCaseHearings(caseId),
    enabled: Boolean(caseId),
  });
}

/** A single persisted hearing by id. */
export function useHearing(hearingId: string): UseQueryResult<Hearing, ApiError> {
  return useQuery<Hearing, ApiError>({
    queryKey: queryKeys.hearings.detail(hearingId),
    queryFn: () => getHearing(hearingId),
    enabled: Boolean(hearingId),
  });
}

/**
 * Creates a hearing (guide §9 `POST /cases/{id}/hearings`).
 */
export function useCreateHearing(): UseApiMutationResult<Hearing, CreateHearingInput> {
  return useApiMutation({
    mutationFn: createHearing,
    invalidateKeys: [],
  });
}

/** Starts a hearing (guide §9 `POST /hearings/{id}/start`) and refreshes its session state. */
export function useStartHearing(): UseApiMutationResult<Hearing, string> {
  return useApiMutation({
    mutationFn: startHearing,
  });
}

/** Stops a hearing (guide §9 `POST /hearings/{id}/stop`) and refreshes its session state. */
export function useStopHearing(): UseApiMutationResult<Hearing, string> {
  return useApiMutation({
    mutationFn: stopHearing,
  });
}
