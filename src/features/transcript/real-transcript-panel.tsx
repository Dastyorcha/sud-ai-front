import { useQuery } from "@tanstack/react-query";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { speakerColorClass } from "@/shared/custom/record/speaker-color";
import { getTranscript } from "@/features/hearings/hearing.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import type { ApiError } from "@/shared/lib/http/api-error";
import type { TranscriptSegment } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

export interface RealTranscriptPanelProps {
  hearingId: string;
  /** Bump to force a refetch (e.g. once the transcribe job succeeds). */
  reloadKey?: number;
}

/**
 * Read-only transcript view over the live `GET /hearings/{id}/transcript`
 * (integration guide §9), loaded once transcription succeeds. Segments are
 * already sorted by `sequenceNo` by `hearing.service.getTranscript`. Editing/
 * verifying/speaker-mapping stay on the mock-backed `TranscriptPanel`
 * (`transcript-panel.tsx`) until integration-06 wires those to the real API.
 */
export function RealTranscriptPanel({ hearingId, reloadKey }: RealTranscriptPanelProps) {
  const { t } = useTranslation();
  const query = useQuery<TranscriptSegment[], ApiError>({
    queryKey: [...queryKeys.transcript.segments(hearingId), reloadKey],
    queryFn: () => getTranscript(hearingId),
    enabled: Boolean(hearingId),
  });

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.error) return <ErrorState />;
  if (!query.data || query.data.length === 0) {
    return <EmptyState description={t("hearing.transcriptEmpty")} />;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {query.data.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Timestamp ms={s.startMs} />
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                speakerColorClass(s.speakerLabel ?? "?")
              )}
              aria-hidden="true"
            />
            <SpeakerChip label={s.speakerLabel ?? "?"} />
            <div className="w-24">
              <ConfidenceBar value={s.confidence ?? 1} />
            </div>
          </div>
          <p className="text-sm text-foreground">{s.canonicalText}</p>
        </li>
      ))}
    </ul>
  );
}
