import { Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { Timestamp } from "@/shared/custom/record/timestamp";
import { ConfidenceBar } from "@/shared/custom/record/confidence-bar";
import { StatusBadge } from "@/shared/custom/status-badge";
import { useMockQuery } from "@/shared/hooks/use-mock-query";
import { listEvents, rejectEvent, verifyEvent } from "@/shared/lib/mock-api/event.service";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface EventsPanelProps {
  hearing: Hearing;
}

/**
 * Procedural events review (spec FR-08, §11). Chronological cards with type,
 * summary, confidence and sources; pending events are verifiable/rejectable.
 * An event without source segments renders as an error (§11.3), never data.
 */
export function EventsPanel({ hearing }: EventsPanelProps) {
  const { t } = useTranslation();
  const { data: events, isLoading, refetch } = useMockQuery(
    () => listEvents(hearing.id),
    [hearing.id],
  );

  if (isLoading) return <LoadingState rows={5} />;
  if (!events || events.length === 0) return <EmptyState />;

  return (
    <ul className="flex flex-col gap-3">
      {events.map((e) => (
        <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              {e.eventType}
            </Badge>
            <Timestamp ms={e.startMs} />
            <div className="w-20">
              <ConfidenceBar value={e.confidence} />
            </div>
            {e.reviewStatus === "PENDING_REVIEW" ? (
              <StatusBadge label={t("events.pendingReview")} tone="warning" />
            ) : e.reviewStatus === "VERIFIED" ? (
              <StatusBadge label={t("transcript.verified")} tone="success" />
            ) : (
              <StatusBadge label={t("events.reject")} tone="destructive" />
            )}
            {e.reviewStatus === "PENDING_REVIEW" && (
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => verifyEvent(e.id).then(refetch)}
                >
                  <Check className="size-4 text-success" />
                  {t("events.verify")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectEvent(e.id).then(refetch)}>
                  <X className="size-4 text-destructive" />
                  {t("events.reject")}
                </Button>
              </div>
            )}
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
  );
}
