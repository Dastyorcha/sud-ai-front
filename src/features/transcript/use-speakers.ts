/**
 * Speaker→participant mapping for the real transcript editor (integration
 * guide §10, §16). `mapSpeaker` covers both the first-time mapping (`GET`
 * returns `version: 0` for an unmapped label) and a remap — the caller
 * always sends the current `version` from `speakers`.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  getSpeakers,
  mapSpeaker,
  type MapSpeakerInput,
  type Speaker,
} from "@/features/transcript/transcript.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import { ApiError } from "@/shared/lib/http/api-error";

export interface UseSpeakersResult {
  speakers: Speaker[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  query: UseQueryResult<Speaker[], ApiError>;
  mapSpeakerMutation: UseApiMutationResult<Speaker, { speakerLabel: string } & MapSpeakerInput>;
}

/** Loads a hearing's speaker labels and exposes the map/remap mutation, `expectedVersion`-gated (guide §16). */
export function useSpeakers(hearingId: string): UseSpeakersResult {
  const query = useQuery<Speaker[], ApiError>({
    queryKey: queryKeys.transcript.speakers(hearingId),
    queryFn: () => getSpeakers(hearingId),
    enabled: Boolean(hearingId),
  });

  const mapSpeakerMutation = useApiMutation<Speaker, { speakerLabel: string } & MapSpeakerInput>({
    mutationFn: ({ speakerLabel, ...input }) => mapSpeaker(hearingId, speakerLabel, input),
    invalidateKeys: [
      queryKeys.transcript.speakers(hearingId),
      queryKeys.transcript.segments(hearingId),
    ],
  });

  return {
    speakers: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
    query,
    mapSpeakerMutation,
  };
}
