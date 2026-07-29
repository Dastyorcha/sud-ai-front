import { useMemo, useState } from "react";
import { Check, CheckCheck, Pencil, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { speakerColorClass } from "@/shared/custom/record/speaker-color";
import { useTranscriptEditor } from "@/features/transcript/use-transcript-editor";
import { useSpeakers } from "@/features/transcript/use-speakers";
import { useParticipants } from "@/features/participants/use-participants";
import {
  approveTranscript,
  validateTranscript,
  type ApproveTranscriptResult,
  type ValidateTranscriptResult,
} from "@/features/transcript/transcript.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation } from "@/shared/lib/query/use-api-mutation";
import type { Hearing } from "@/shared/types/models";
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

const NONE = "NONE";

function issueMessageKey(code: string): MessageKey | undefined {
  return (KNOWN_ISSUE_CODES as readonly string[]).includes(code)
    ? (`transcript.issues.${code}` as MessageKey)
    : undefined;
}

/**
 * Real transcript editor over the live `/hearings/{id}/transcript` +
 * `/transcript-segments` + `/hearings/{id}/{speakers,transcript/validate,transcript/approve}`
 * endpoints (integration guide §10, §16 — highest-concurrency surface in the
 * app). Per-segment human-edit/verify and speaker→participant mapping are
 * `expectedVersion`-gated (`useApiMutation` refetches + warns, never
 * auto-resends, on a `409 CONCURRENCY_CONFLICT`); once the hearing's
 * transcript is `Approved` every editing control locks (`409
 * TRANSCRIPT_LOCKED` from the server otherwise).
 */
export function RealTranscriptPanel({
  hearing,
  onHearingChanged,
  reloadKey,
}: RealTranscriptPanelProps) {
  const { t } = useTranslation();
  const [validation, setValidation] = useState<ValidateTranscriptResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const { segments, isLoading, error, editSegment, verifySegmentMutation } = useTranscriptEditor(
    hearing.id,
    reloadKey
  );
  const { speakers, mapSpeakerMutation } = useSpeakers(hearing.id);
  const { data: participants } = useParticipants(hearing.caseId);

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

  const participantRole = (id: string | null) => {
    const participant = participants?.find((p) => p.id === id);
    return participant ? t(`enums.participantRole.${participant.role}` as MessageKey) : undefined;
  };

  const speakerLabels = useMemo(
    () => [...new Set((segments ?? []).map((s) => s.speakerLabel).filter(Boolean))] as string[],
    [segments]
  );

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

  async function applyMapping() {
    for (const [label, participantId] of Object.entries(mapping)) {
      if (!participantId || participantId === NONE) continue;
      const current = speakers?.find((sp) => sp.speakerLabel === label);
      try {
        await mapSpeakerMutation.mutateAsync({
          speakerLabel: label,
          participantId,
          expectedVersion: current?.version ?? 0,
        });
      } catch {
        // useApiMutation already toasted the failure — keep applying the rest.
      }
    }
    setMapping({});
    setMapOpen(false);
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
          <Button size="sm" variant="outline" onClick={() => setMapOpen(true)} disabled={locked}>
            <Users className="size-4" />
            {t("transcript.mapSpeakers")}
          </Button>
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
                roleLabel={participantRole(s.participantId)}
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
                    onClick={() => startEdit(s.id, s.humanText ?? s.canonicalText)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {s.status !== "Canonical" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("transcript.verify")}
                      disabled={verifySegmentMutation.isPending}
                      onClick={() =>
                        verifySegmentMutation.mutate({
                          segmentId: s.id,
                          expectedVersion: s.version ?? 0,
                        })
                      }
                    >
                      <Check className="size-4 text-success" />
                    </Button>
                  )}
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
              <p className="text-sm text-foreground">{s.canonicalText}</p>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transcript.mapSpeakers")}</DialogTitle>
            <DialogDescription>{t("transcript.mapSpeakersDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {speakerLabels.map((label) => {
              const current = speakers?.find((sp) => sp.speakerLabel === label);
              return (
                <div key={label} className="flex items-center gap-3">
                  <SpeakerChip label={label} />
                  <Select
                    value={mapping[label] ?? current?.participantId ?? NONE}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [label]: v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("transcript.speakerUnmapped")}</SelectItem>
                      {(participants ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName} · {t(`enums.participantRole.${p.role}` as MessageKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMapOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void applyMapping()} disabled={mapSpeakerMutation.isPending}>
              {t("transcript.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
