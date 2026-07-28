import { useMemo, useState } from "react";
import { Check, Pencil, Search, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
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
import { Timestamp } from "@/shared/custom/record/timestamp";
import { SpeakerChip } from "@/shared/custom/record/speaker-chip";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { CriticalFieldMark } from "@/shared/custom/record/critical-field-mark";
import { speakerColorClass } from "@/shared/custom/record/speaker-color";
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
import { cn } from "@/shared/lib/utils";

type Filter = "all" | "low" | "critical" | "unverified";
const NONE = "NONE";
const ALL_SPEAKERS = "ALL";

export interface TranscriptPanelProps {
  hearing: Hearing;
  onApproved: () => void;
  /** Current mock playback position (ms) — highlights the segment it falls in (mockup-05). */
  activeMs?: number;
}

/**
 * Transcript review and editor (spec FR-07, UC-05, §16.3). Segment list with
 * filters, inline textarea editing (raw ASR text preserved), verify toggles,
 * bulk speaker mapping (UC-03/AC-03) and the canonical-approval gate blocked
 * until every critical field is reviewed.
 */
export function TranscriptPanel({ hearing, onApproved, activeMs }: TranscriptPanelProps) {
  const { t } = useTranslation();
  const {
    data: segments,
    isLoading,
    refetch,
  } = useMockQuery(() => listSegments(hearing.id), [hearing.id]);
  const { data: participants } = useParticipants(hearing.caseId);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState(ALL_SPEAKERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let all = segments ?? [];
    switch (filter) {
      case "low":
        all = all.filter((s) => (s.confidence ?? 1) < 0.75);
        break;
      case "critical":
        all = all.filter((s) => !s.isCriticalReviewed);
        break;
      case "unverified":
        all = all.filter((s) => s.status !== "VERIFIED");
        break;
    }
    if (speakerFilter !== ALL_SPEAKERS) {
      all = all.filter((s) => s.speakerLabel === speakerFilter);
    }
    const query = search.trim().toLowerCase();
    if (query) {
      all = all.filter((s) => s.canonicalText.toLowerCase().includes(query));
    }
    return all;
  }, [segments, filter, speakerFilter, search]);

  const unreviewedCritical = (segments ?? []).filter((s) => !s.isCriticalReviewed).length;
  const speakerLabels = useMemo(
    () => [...new Set((segments ?? []).map((s) => s.speakerLabel).filter(Boolean))] as string[],
    [segments]
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
        <div className="relative w-full sm:w-56">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("transcript.searchPlaceholder")}
            className="pl-8"
            aria-label={t("transcript.searchPlaceholder")}
          />
        </div>

        <Select value={speakerFilter} onValueChange={setSpeakerFilter}>
          <SelectTrigger className="w-full sm:w-48" aria-label={t("transcript.allSpeakers")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPEAKERS}>{t("transcript.allSpeakers")}</SelectItem>
            {speakerLabels.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        {filtered.map((s) => {
          const isActive = activeMs !== undefined && activeMs >= s.startMs && activeMs < s.endMs;
          return (
            <li
              key={s.id}
              className={cn("flex flex-col gap-2 px-4 py-3", isActive && "bg-gold-soft")}
            >
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
          );
        })}
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
