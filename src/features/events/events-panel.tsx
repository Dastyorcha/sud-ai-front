import { useState } from "react";
import { Check, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
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
import { EmptyState } from "@/shared/custom/empty-state";
import { ErrorState } from "@/shared/custom/error-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { StatusBadge } from "@/shared/custom/status-badge";
import { useEvents } from "@/features/events/use-events";
import { useParticipants } from "@/features/participants/use-participants";
import type { EditEventInput } from "@/features/events/event.service";
import type { Hearing, ProceduralEvent } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface EventsPanelProps {
  /** Only `id`/`caseId` are read — accepts either a full `Hearing` or the session-carried real one. */
  hearing: Pick<Hearing, "id" | "caseId">;
}

/** The API's 14-value canonical taxonomy (guide §11) — order matches `enums.ts`. */
const EVENT_TYPES = [
  "HearingOpened",
  "IdentityVerified",
  "RightsExplained",
  "ClaimExplained",
  "ResponseGiven",
  "ObjectionRaised",
  "MotionSubmitted",
  "EvidenceSubmitted",
  "QuestionAsked",
  "BreakAnnounced",
  "HearingPostponed",
  "RulingAnnounced",
  "HearingClosed",
  "Other",
] as const;

const NONE = "NONE";

interface EditDraft {
  eventType: string;
  participantId: string;
  normalizedSummary: string;
  startMs: string;
  endMs: string;
}

function toDraft(event: ProceduralEvent): EditDraft {
  return {
    eventType: event.eventType,
    participantId: event.participantId ?? NONE,
    normalizedSummary: event.normalizedSummary,
    startMs: String(event.startMs),
    endMs: String(event.endMs),
  };
}

/**
 * Procedural events review (spec FR-08, §11, integration guide §11/§16) over
 * the live `/hearings/{id}/events(/extract)` + `/events/{id}(/verify)`
 * endpoints. Extraction requires an approved canonical transcript
 * (integration-06) — a `409 TRANSCRIPT_NOT_APPROVED`/
 * `CANONICAL_TRANSCRIPT_REQUIRED` surfaces as a toast via `useApiMutation`.
 * Editing an event resets it to `Draft`; verify requires a grounded source
 * (`409 EVENT_SOURCE_REQUIRED`/`EVENT_SOURCE_INVALID`) and, for
 * `RulingAnnounced`, an explicit ruling phrase in the source (`400
 * RULING_SOURCE_NOT_EXPLICIT`) — both server-authoritative; the timing/ruling
 * hints below are best-effort only. `sourceSegmentIds` is always rendered and
 * never dropped from an edit (guide §18 traceability); an event without a
 * source renders as an error, never as data.
 */
export function EventsPanel({ hearing }: EventsPanelProps) {
  const { t } = useTranslation();
  const { events, isLoading, error, refetch, extract, editEventMutation, verifyEventMutation } =
    useEvents(hearing.id);
  const { data: participants } = useParticipants(hearing.caseId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  function startEdit(event: ProceduralEvent) {
    setEditingId(event.id);
    setDraft(toDraft(event));
  }

  function closeEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit(event: ProceduralEvent) {
    if (!draft) return;
    const startMs = Number(draft.startMs);
    const endMs = Number(draft.endMs);
    const input: EditEventInput = {
      eventType: draft.eventType as EditEventInput["eventType"],
      participantId: draft.participantId === NONE ? null : draft.participantId,
      normalizedSummary: draft.normalizedSummary,
      startMs: Number.isFinite(startMs) ? startMs : undefined,
      endMs: Number.isFinite(endMs) ? endMs : undefined,
      expectedVersion: event.version ?? 0,
    };
    editEventMutation.mutate({ eventId: event.id, ...input }, { onSuccess: () => closeEdit() });
  }

  const editingEvent = events?.find((e) => e.id === editingId) ?? null;
  const timingOutOfBounds =
    editingEvent && draft
      ? Number(draft.startMs) < editingEvent.startMs || Number(draft.endMs) > editingEvent.endMs
      : false;

  if (isLoading) return <LoadingState rows={5} />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => extract.mutate()} disabled={extract.isPending}>
          <Sparkles className="size-4" />
          {extract.isPending ? t("events.extracting") : t("events.extract")}
        </Button>
      </div>

      {!events || events.length === 0 ? (
        <EmptyState description={t("events.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs">
                  {t(`enums.eventType.${e.eventType}` as MessageKey)}
                </Badge>
                <Timestamp ms={e.startMs} />
                <div className="w-20">
                  <ConfidenceBar value={e.confidence} />
                </div>
                {e.reviewStatus === "Verified" || e.reviewStatus === "VERIFIED" ? (
                  <StatusBadge label={t("transcript.verified")} tone="success" />
                ) : (
                  <StatusBadge label={t("events.draft")} tone="warning" />
                )}
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => startEdit(e)}>
                    <Pencil className="size-4" />
                    {t("transcript.edit")}
                  </Button>
                  {e.reviewStatus !== "Verified" && e.reviewStatus !== "VERIFIED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={verifyEventMutation.isPending}
                      onClick={() =>
                        verifyEventMutation.mutate({
                          eventId: e.id,
                          expectedVersion: e.version ?? 0,
                        })
                      }
                    >
                      <Check className="size-4 text-success" />
                      {t("events.verify")}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{e.normalizedSummary}</p>
              <p className="text-sm text-muted-foreground">{e.verbatimText}</p>
              {e.sourceSegmentIds.length > 0 ? (
                <p className="font-mono text-xs text-muted-foreground">
                  {t("events.sources")}: {e.sourceSegmentIds.join(", ")}
                </p>
              ) : (
                <p className="text-xs font-medium text-destructive">{t("events.noSource")}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editingId !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("events.editTitle")}</DialogTitle>
            <DialogDescription>{t("events.editDescription")}</DialogDescription>
          </DialogHeader>
          {editingEvent && draft && (
            <div className="flex flex-col gap-3">
              <Select
                value={draft.eventType}
                onValueChange={(v) => setDraft({ ...draft, eventType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`enums.eventType.${type}` as MessageKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={draft.participantId}
                onValueChange={(v) => setDraft({ ...draft, participantId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("events.participantUnspecified")}</SelectItem>
                  {(participants ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName} · {t(`enums.participantRole.${p.role}` as MessageKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                value={draft.normalizedSummary}
                onChange={(e) => setDraft({ ...draft, normalizedSummary: e.target.value })}
                rows={3}
              />

              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t("events.startMs")}</span>
                  <Input
                    type="number"
                    value={draft.startMs}
                    onChange={(e) => setDraft({ ...draft, startMs: e.target.value })}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t("events.endMs")}</span>
                  <Input
                    type="number"
                    value={draft.endMs}
                    onChange={(e) => setDraft({ ...draft, endMs: e.target.value })}
                  />
                </div>
              </div>
              {timingOutOfBounds && (
                <p className="text-xs text-warning">{t("events.timingRangeHint")}</p>
              )}
              {draft.eventType === "RulingAnnounced" && (
                <p className="text-xs text-muted-foreground">{t("events.rulingSourceHint")}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={editEventMutation.isPending}
              onClick={() => editingEvent && saveEdit(editingEvent)}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
