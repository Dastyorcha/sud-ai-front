import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Tabs from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { useHearing } from "@/features/hearings/use-hearings";
import { useCase } from "@/features/cases/use-case";
import { LiveHearingPanel } from "@/features/live-session/live-hearing-panel";
import { TranscriptPanel } from "@/features/transcript/transcript-panel";
import { EventsPanel } from "@/features/events/events-panel";
import { ProtocolPanel } from "@/features/protocol/protocol-panel";
import { transitionHearing } from "@/shared/lib/mock-api/hearing.service";
import { buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

/**
 * Hearing workspace (spec §16.1 #6–9): live session, transcript review,
 * procedural events and protocol in one tabbed screen scoped to a hearing.
 */
export default function HearingDetailView() {
  const { t, locale } = useTranslation();
  const { hearingId = "" } = useParams<{ hearingId: string }>();
  const { data: hearing, isLoading, error, refetch } = useHearing(hearingId);
  const { data: courtCase } = useCase(hearing?.caseId ?? "");

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <ErrorState />;
  if (!hearing) return <EmptyState title={t("errors.notFoundTitle")} />;

  async function approveCanonical() {
    if (!hearing) return;
    try {
      await transitionHearing(hearing.id, "APPROVED");
      notify.success(t("transcript.approveCanonical"));
      refetch();
    } catch {
      notify.error(t("errors.genericTitle"));
    }
  }

  const tabs = [
    {
      id: "live",
      label: t("hearing.liveTab"),
      content: <LiveHearingPanel hearing={hearing} onStatusChange={refetch} />,
    },
    {
      id: "transcript",
      label: t("hearing.transcriptTab"),
      content: <TranscriptPanel hearing={hearing} onApproved={approveCanonical} />,
    },
    {
      id: "events",
      label: t("hearing.eventsTab"),
      content: <EventsPanel hearing={hearing} />,
    },
    {
      id: "protocol",
      label: t("hearing.protocolTab"),
      content: <ProtocolPanel hearing={hearing} />,
    },
  ];

  const isProcessed = hearing.status === "READY_FOR_REVIEW" || hearing.status === "APPROVED";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" asChild className="self-start">
          <Link to={withLocale(locale, buildRoute.caseDetail(hearing.caseId))}>
            <ChevronLeft className="size-4" />
            {t("common.back")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t("pages.hearing")}
          </h1>
          {courtCase && (
            <span className="font-mono text-sm text-muted-foreground">{courtCase.caseNumber}</span>
          )}
          <RecordStateBadge kind="hearing" status={hearing.status} />
        </div>
      </div>

      <Tabs tabs={tabs} variant="underline" defaultTab={isProcessed ? "transcript" : "live"} />
    </div>
  );
}
