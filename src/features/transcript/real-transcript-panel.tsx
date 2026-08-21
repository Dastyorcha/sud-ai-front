import { useState } from "react";
import { CheckCheck, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { speakerColorClass } from "@/shared/custom/record/speaker-color";
import { useTranscriptEditor } from "@/features/transcript/use-transcript-editor";
import {
  approveTranscript,
  type ApproveTranscriptResult,
} from "@/features/transcript/transcript.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation } from "@/shared/lib/query/use-api-mutation";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

export interface RealTranscriptPanelProps {
  hearing: Hearing;
  /** Called after a successful approve, so the session carry (and the tab header badge) picks up the new status/version. */
  onHearingChanged: (hearing: Hearing) => void;
  /** Bump to force a refetch (e.g. once the transcribe job succeeds). */
  reloadKey?: number;
}

/**
 * Real transcript editor over the live `/hearings/{id}/transcript` +
 * `/transcript-segments` + `/hearings/{id}/transcript/approve` endpoints.
 * STT output is an immediately editable draft; users only correct text where
 * necessary and approve the whole transcript once. Speaker mapping and
 * per-segment verification remain backend-compatible, but no longer block
 * this primary workflow.
 */
export function RealTranscriptPanel({
  hearing,
  onHearingChanged,
  reloadKey,
}: RealTranscriptPanelProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { segments, isLoading, error, editSegment } = useTranscriptEditor(
    hearing.id,
    reloadKey
  );

  const approveMutation = useApiMutation<ApproveTranscriptResult, void>({
    mutationFn: () => approveTranscript(hearing.id, { expectedVersion: hearing.version ?? 0 }),
    invalidateKeys: [queryKeys.transcript.segments(hearing.id)],
    onSuccess: (data) =>
      onHearingChanged({ ...hearing, status: data.status, version: data.version }),
  });

  const locked = hearing.status === "Approved";
  const hasVersion = hearing.version !== undefined;
  const canApprove = !locked && hasVersion;
  const approveDisabledReason = locked
    ? undefined
    : !hasVersion
      ? t("transcript.sessionVersionMissing")
      : undefined;

  const reviewText = (segment: NonNullable<typeof segments>[number]) =>
    segment.humanText ?? segment.canonicalText ?? segment.normalizedText ?? segment.rawText;

  function startEdit(segmentId: string, current: string) {
    setEditingId(segmentId);
    setDraft(current);
  }

  function saveEdit(segmentId: string, expectedVersion: number) {
    editSegment.mutate(
      { segmentId, humanText: draft, expectedVersion },
      { onSuccess: () => setEditingId(null) }
    );
  }

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState />;
  if (!segments || segments.length === 0) {
    return <EmptyState description={t("hearing.transcriptEmpty")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {locked && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <ShieldCheck className="size-4" />
            {t("transcript.locked")}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            disabled={!canApprove || approveMutation.isPending}
            title={approveDisabledReason}
            onClick={() => approveMutation.mutate()}
          >
            <CheckCheck className="size-4" />
            {t("transcript.approveCanonical")}
          </Button>
        </div>
      </div>

      {!locked && !hasVersion && (
        <p className="text-sm text-destructive">{t("transcript.sessionVersionMissing")}</p>
      )}

      {!locked && <p className="text-sm text-muted-foreground">{t("transcript.autoDraftHint")}</p>}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {segments.map((s) => (
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
              <SpeakerChip
                label={s.speakerLabel ?? "?"}
              />
              <RecordStateBadge kind="segment" status={s.status} />
              <div className="w-24">
                <ConfidenceBar value={s.confidence ?? 1} />
              </div>
              {!locked && (
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("transcript.edit")}
                    onClick={() => startEdit(s.id, reviewText(s))}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {editingId === s.id ? (
              <div className="flex flex-col gap-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
                <p className="text-xs text-muted-foreground">
                  {t("transcript.originalText")}: {s.rawText}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={editSegment.isPending}
                    onClick={() => saveEdit(s.id, s.version ?? 0)}
                  >
                    {t("common.save")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground">{reviewText(s)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
