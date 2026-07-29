import { useState } from "react";
import { CheckCheck, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { speakerColorClass } from "@/shared/custom/record/speaker-color";
import { getTranscript } from "@/features/hearings/hearing.service";
import {
  approveTranscript,
  validateTranscript,
  type ApproveTranscriptResult,
  type ValidateTranscriptResult,
} from "@/features/transcript/transcript.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation } from "@/shared/lib/query/use-api-mutation";
import type { ApiError } from "@/shared/lib/http/api-error";
import type { Hearing, TranscriptSegment } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { cn } from "@/shared/lib/utils";

export interface RealTranscriptPanelProps {
  hearing: Hearing;
  /** Called after a successful approve, so the session carry (and the tab header badge) picks up the new status/version. */
  onHearingChanged: (hearing: Hearing) => void;
  /** Bump to force a refetch (e.g. once the transcribe job succeeds). */
  reloadKey?: number;
}

const KNOWN_ISSUE_CODES = [
  "HEARING_NOT_READY_FOR_REVIEW",
  "TRANSCRIPT_EMPTY",
  "CANONICAL_TEXT_REQUIRED",
  "INVALID_SEGMENT_TIMESTAMP",
  "SPEAKER_MAPPING_REQUIRED",
] as const;

function issueMessageKey(code: string): MessageKey | undefined {
  return (KNOWN_ISSUE_CODES as readonly string[]).includes(code)
    ? (`transcript.issues.${code}` as MessageKey)
    : undefined;
}

/**
 * Real transcript editor over the live `/hearings/{id}/transcript` +
 * `/transcript-segments` + `/hearings/{id}/transcript/{validate,approve}`
 * endpoints (integration guide §10, §16 — highest-concurrency surface in the
 * app). Currently: read-only segment list, pre-approval validation gate, and
 * approve itself (using the **hearing's** `version` from `use-hearing-session`,
 * not a segment version — guide §10). Segment edit/verify and speaker
 * mapping are wired in a later step.
 */
export function RealTranscriptPanel({
  hearing,
  onHearingChanged,
  reloadKey,
}: RealTranscriptPanelProps) {
  const { t } = useTranslation();
  const [validation, setValidation] = useState<ValidateTranscriptResult | null>(null);

  const query = useQuery<TranscriptSegment[], ApiError>({
    queryKey: [...queryKeys.transcript.segments(hearing.id), reloadKey],
    queryFn: () => getTranscript(hearing.id),
    enabled: Boolean(hearing.id),
  });

  const validateMutation = useApiMutation<ValidateTranscriptResult, void>({
    mutationFn: () => validateTranscript(hearing.id),
    onSuccess: (data) => setValidation(data),
  });

  const approveMutation = useApiMutation<ApproveTranscriptResult, void>({
    mutationFn: () => approveTranscript(hearing.id, { expectedVersion: hearing.version ?? 0 }),
    invalidateKeys: [queryKeys.transcript.segments(hearing.id)],
    onSuccess: (data) =>
      onHearingChanged({ ...hearing, status: data.status, version: data.version }),
  });

  const locked = hearing.status === "Approved";
  const hasVersion = hearing.version !== undefined;
  const canApprove = !locked && hasVersion && validation?.isValid === true;
  const approveDisabledReason = locked
    ? undefined
    : !hasVersion
      ? t("transcript.sessionVersionMissing")
      : validation?.isValid !== true
        ? t("transcript.approveDisabledInvalid")
        : undefined;

  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.error) return <ErrorState />;
  if (!query.data || query.data.length === 0) {
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
            variant="outline"
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending || locked}
          >
            <CheckCheck className="size-4" />
            {validateMutation.isPending ? t("transcript.validating") : t("transcript.validate")}
          </Button>
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

      {validation && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            validation.isValid
              ? "border-success/40 bg-success/10 text-success"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {validation.isValid ? (
            t("transcript.valid")
          ) : (
            <div className="flex flex-col gap-1">
              <p className="font-medium">{t("transcript.issuesTitle")}</p>
              <ul className="list-inside list-disc">
                {validation.issues.map((issue, i) => {
                  const key = issueMessageKey(issue.code);
                  return (
                    <li key={`${issue.code}-${i}`}>
                      {key ? t(key) : (issue.message ?? issue.code)}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

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
              <RecordStateBadge kind="segment" status={s.status} />
              <div className="w-24">
                <ConfidenceBar value={s.confidence ?? 1} />
              </div>
            </div>
            <p className="text-sm text-foreground">{s.canonicalText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
