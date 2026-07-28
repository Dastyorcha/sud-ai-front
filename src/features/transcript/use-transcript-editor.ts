/**
 * Segment list + human-edit/verify mutations for the real transcript editor
 * (integration guide §10, §16). The list query is the single source of
 * truth for each segment's current `version` — `useApiMutation` invalidates
 * it after every success (and after a `409 CONCURRENCY_CONFLICT`), so the
 * next edit/verify always reads the freshest version off `segments` rather
 * than a value cached in component state.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getTranscript } from "@/features/hearings/hearing.service";
import {
  editSegmentText,
  verifySegment,
  type EditSegmentInput,
  type VerifySegmentInput,
} from "@/features/transcript/transcript.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import { ApiError } from "@/shared/lib/http/api-error";
import type { TranscriptSegment } from "@/shared/types/models";

export interface UseTranscriptEditorResult {
  segments: TranscriptSegment[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  query: UseQueryResult<TranscriptSegment[], ApiError>;
  editSegment: UseApiMutationResult<TranscriptSegment, { segmentId: string } & EditSegmentInput>;
  verifySegmentMutation: UseApiMutationResult<
    TranscriptSegment,
    { segmentId: string } & VerifySegmentInput
  >;
}

/**
 * Loads a hearing's transcript segments and exposes the edit/verify
 * mutations, both `expectedVersion`-gated (guide §16). `reloadKey` lets the
 * caller force a refetch (e.g. once a transcription job succeeds).
 */
export function useTranscriptEditor(
  hearingId: string,
  reloadKey?: number
): UseTranscriptEditorResult {
  const query = useQuery<TranscriptSegment[], ApiError>({
    queryKey: [...queryKeys.transcript.segments(hearingId), reloadKey],
    queryFn: () => getTranscript(hearingId),
    enabled: Boolean(hearingId),
  });

  const editSegment = useApiMutation<TranscriptSegment, { segmentId: string } & EditSegmentInput>({
    mutationFn: ({ segmentId, ...input }) => editSegmentText(segmentId, input),
    invalidateKeys: [queryKeys.transcript.segments(hearingId)],
  });

  const verifySegmentMutation = useApiMutation<
    TranscriptSegment,
    { segmentId: string } & VerifySegmentInput
  >({
    mutationFn: ({ segmentId, ...input }) => verifySegment(segmentId, input),
    invalidateKeys: [queryKeys.transcript.segments(hearingId)],
  });

  return {
    segments: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
    query,
    editSegment,
    verifySegmentMutation,
  };
}
