import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { getHearing, listHearings } from "@/shared/lib/mock-api/hearing.service";
import {
  createHearing,
  startHearing,
  stopHearing,
  type CreateHearingInput,
} from "@/features/hearings/hearing.service";
import { recordHearingSession } from "@/features/hearings/use-hearing-session";
import type { Hearing } from "@/shared/types/models";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";

/**
 * A case's hearings, oldest first — **mock-backed** (`shared/lib/mock-api/hearing.service`).
 * There is no `GET /cases/{id}/hearings` in the real API yet (guide §17), so
 * this stays on the mock layer for the demo-only widgets that still need a
 * list (`widgets/protocol-workspace/*`, until integration-08). The case-detail
 * "hearings" section and the real lifecycle instead use
 * `useCaseHearingSessions` (`use-hearing-session.ts`) — session-scoped, real
 * hearings only.
 */
export function useHearings(caseId: string): UseMockQueryResult<Hearing[]> {
  return useMockQuery(() => listHearings(caseId), [caseId]);
}

/** A single hearing by id — mock-backed, see `useHearings`'s note above. */
export function useHearing(hearingId: string): UseMockQueryResult<Hearing | null> {
  return useMockQuery(() => getHearing(hearingId), [hearingId]);
}

/**
 * Creates a hearing (guide §9 `POST /cases/{id}/hearings`) and records it in
 * the session carry (`use-hearing-session.ts`) so it's immediately reachable
 * from `views/hearings/hearing-detail.tsx` — there's no GET to refetch it by.
 */
export function useCreateHearing(): UseApiMutationResult<Hearing, CreateHearingInput> {
  return useApiMutation({
    mutationFn: createHearing,
    onSuccess: recordHearingSession,
  });
}

/** Starts a hearing (guide §9 `POST /hearings/{id}/start`) and refreshes its session state. */
export function useStartHearing(): UseApiMutationResult<Hearing, string> {
  return useApiMutation({
    mutationFn: startHearing,
    onSuccess: recordHearingSession,
  });
}

/** Stops a hearing (guide §9 `POST /hearings/{id}/stop`) and refreshes its session state. */
export function useStopHearing(): UseApiMutationResult<Hearing, string> {
  return useApiMutation({
    mutationFn: stopHearing,
    onSuccess: recordHearingSession,
  });
}
