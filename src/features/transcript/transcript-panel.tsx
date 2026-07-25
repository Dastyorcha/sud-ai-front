import { useMemo, useState } from "react";
import { Check, Pencil, Users } from "lucide-react";
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
import { EmptyState } from "@/shared/custom/empty-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { CriticalFieldMark } from "@/shared/custom/record/critical-field-mark";
import { useMockQuery } from "@/shared/hooks/use-mock-query";
import {
  editSegmentText,
  listSegments,
  mapSpeaker,
  verifySegment,
} from "@/shared/lib/mock-api/transcript.service";
import { useParticipants } from "@/features/participants/use-participants";
import type { Hearing, TranscriptSegment } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

type Filter = "all" | "low" | "critical" | "unverified";
const NONE = "NONE";

export interface TranscriptPanelProps {
  hearing: Hearing;
  onApproved: () => void;
}

/**
 * Transcript review and editor (spec FR-07, UC-05, §16.3). Segment list with
 * filters, inline textarea editing (raw ASR text preserved), verify toggles,
 * bulk speaker mapping (UC-03/AC-03) and the canonical-approval gate blocked
 * until every critical field is reviewed.
 */
export function TranscriptPanel({ hearing, onApproved }: TranscriptPanelProps) {
  const { t } = useTranslation();
  const { data: segments, isLoading, refetch } = useMockQuery(
    () => listSegments(hearing.id),
    [hearing.id],
  );
  const { data: participants } = useParticipants(hearing.caseId);
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const all = segments ?? [];
    switch (filter) {
      case "low":
        return all.filter((s) => (s.confidence ?? 1) < 0.75);
      case "critical":
        return all.filter((s) => !s.isCriticalReviewed);
      case "unverified":
        return all.filter((s) => s.status !== "VERIFIED");
      default:
        return all;
    }
  }, [segments, filter]);

  const unreviewedCritical = (segments ?? []).filter((s) => !s.isCriticalReviewed).length;
  const speakerLabels = useMemo(
    () => [...new Set((segments ?? []).map((s) => s.speakerLabel).filter(Boolean))] as string[],
    [segments],
  );

  const participantRole = (id: string | null) =>
    participants?.find((p) => p.id === id)
      ? t(`enums.participantRole.${participants.find((p) => p.id === id)?.role}` as MessageKey)
      : undefined;

  async function saveEdit(segment: TranscriptSegment) {
    await editSegmentText(segment.id, draft);
    setEditingId(null);
    refetch();
  }

  async function applyMapping() {
    for (const [label, pid] of Object.entries(mapping)) {
      if (pid && pid !== NONE) {
        const count = await mapSpeaker(hearing.id, label, pid);
        notify.success(t("transcript.segmentsMapped", { count }));
      }
    }
    setMapOpen(false);
    refetch();
  }

  if (isLoading) return <LoadingState rows={6} />;
  if (!segments || segments.length === 0) return <EmptyState />;

  const FILTERS: Array<{ key: Filter; label: string }> = [
    { key: "all", label: t("transcript.filterAll") },
    { key: "low", label: t("transcript.filterLow") },
    { key: "critical", label: t("transcript.filterCritical") },
    { key: "unverified", label: t("transcript.filterUnverified") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setMapOpen(true)}>
            <Users className="size-4" />
            {t("transcript.mapSpeakers")}
          </Button>
          <Button
            size="sm"
            disabled={unreviewedCritical > 0 || hearing.status === "APPROVED"}
            title={
              unreviewedCritical > 0
                ? t("transcript.approveBlocked", { count: unreviewedCritical })
                : undefined
            }
            onClick={onApproved}
          >
            <Check className="size-4" />
            {t("transcript.approveCanonical")}
          </Button>
        </div>
      </div>

      {unreviewedCritical > 0 && (
        <p className="text-sm text-destructive">
          {t("transcript.approveBlocked", { count: unreviewedCritical })}
        </p>
      )}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {filtered.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <Timestamp ms={s.startMs} />
              <SpeakerChip label={s.speakerLabel ?? "?"} roleLabel={participantRole(s.participantId)} />
              <RecordStateBadge kind="segment" status={s.status} />
              <div className="w-24">
                <ConfidenceBar value={s.confidence ?? 1} />
              </div>
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("transcript.edit")}
                  onClick={() => {
                    setEditingId(s.id);
                    setDraft(s.canonicalText);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                {s.status !== "VERIFIED" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("transcript.verify")}
                    onClick={() => verifySegment(s.id).then(refetch)}
                  >
                    <Check className="size-4 text-success" />
                  </Button>
                )}
              </div>
            </div>

            {editingId === s.id ? (
              <div className="flex flex-col gap-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} />
                <p className="text-xs text-muted-foreground">
                  {t("transcript.originalText")}: {s.rawText}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(s)}>
                    {t("common.save")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : s.isCriticalReviewed ? (
              <p className="text-sm text-foreground">{s.canonicalText}</p>
            ) : (
              <p className="text-sm text-foreground">
                <CriticalFieldMark>{s.canonicalText}</CriticalFieldMark>
              </p>
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
            {speakerLabels.map((label) => (
              <div key={label} className="flex items-center gap-3">
                <SpeakerChip label={label} />
                <Select
                  value={mapping[label] ?? NONE}
                  onValueChange={(v) => setMapping((m) => ({ ...m, [label]: v }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {(participants ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.displayName} · {t(`enums.participantRole.${p.role}` as MessageKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMapOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={applyMapping}>{t("transcript.apply")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
