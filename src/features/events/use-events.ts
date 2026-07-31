/**
 * Procedural events list + extract/edit/verify mutations for the real events
 * panel (integration guide §11, §16). The list query is the single source of
 * truth for each event's current `version` — `useApiMutation` invalidates it
 * after every success (and after a `409 CONCURRENCY_CONFLICT`), so the next
 * edit/verify always reads the freshest version off `events` rather than a
 * value cached in component state.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  extractEvents,
  listEvents,
  editEvent,
  verifyEvent,
  type EditEventInput,
  type VerifyEventInput,
} from "@/features/events/event.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import { ApiError } from "@/shared/lib/http/api-error";
import type { ProceduralEvent } from "@/shared/types/models";

export interface UseEventsResult {
  events: ProceduralEvent[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  query: UseQueryResult<ProceduralEvent[], ApiError>;
  extract: UseApiMutationResult<ProceduralEvent[], void>;
  editEventMutation: UseApiMutationResult<ProceduralEvent, { eventId: string } & EditEventInput>;
  verifyEventMutation: UseApiMutationResult<
    ProceduralEvent,
    { eventId: string } & VerifyEventInput
  >;
}

/**
 * Loads a hearing's procedural events (`GET /hearings/{id}/events`, guide
 * §11) and exposes extract/edit/verify. Extract is idempotent — calling it
 * again on an already-extracted hearing just returns the current list — and
 * shares the same query key as the list, so a successful extraction
 * refreshes the list in place. Edit/verify are `expectedVersion`-gated
 * (guide §16).
 */
export function useEvents(hearingId: string): UseEventsResult {
  const query = useQuery<ProceduralEvent[], ApiError>({
    queryKey: queryKeys.events.list(hearingId),
    queryFn: () => listEvents(hearingId),
    enabled: Boolean(hearingId),
  });

  const extract = useApiMutation<ProceduralEvent[], void>({
    mutationFn: () => extractEvents(hearingId),
    invalidateKeys: [queryKeys.events.list(hearingId)],
  });

  const editEventMutation = useApiMutation<ProceduralEvent, { eventId: string } & EditEventInput>({
    mutationFn: ({ eventId, ...input }) => editEvent(eventId, input),
    invalidateKeys: [queryKeys.events.list(hearingId)],
  });

  const verifyEventMutation = useApiMutation<
    ProceduralEvent,
    { eventId: string } & VerifyEventInput
  >({
    mutationFn: ({ eventId, ...input }) => verifyEvent(eventId, input),
    invalidateKeys: [queryKeys.events.list(hearingId)],
  });

  return {
    events: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
    query,
    extract,
    editEventMutation,
    verifyEventMutation,
  };
}
