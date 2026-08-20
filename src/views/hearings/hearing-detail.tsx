import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Tabs from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/custom/empty-state";
import { ErrorState } from "@/shared/custom/error-state";
import { LoadingState } from "@/shared/custom/loading-state";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { useHearing } from "@/features/hearings/use-hearings";
import { HearingLifecyclePanel } from "@/features/hearings/hearing-lifecycle-panel";
import { RealTranscriptPanel } from "@/features/transcript/real-transcript-panel";
import { useCase } from "@/features/cases/use-case";
import { EventsPanel } from "@/features/events/events-panel";
import { ProtocolPanel } from "@/features/protocol/protocol-panel";
import { buildRoute, ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { queryKeys } from "@/shared/lib/query/query-keys";
import type { Hearing } from "@/shared/types/models";

/**
 * Hearing workspace (spec §16.1 #6–9, integration guide §9): live session
 * (real start/stop/upload/transcribe), transcript review, procedural events
 * and protocol in one tabbed screen. Reads `:hearingId` from the route and
 * recovers the persisted hearing from the API, so refreshes and direct links
 * are safe.
 */
export default function HearingDetailView() {
  const { t, locale } = useTranslation();
  const { hearingId = "" } = useParams<{ hearingId: string }>();
  const queryClient = useQueryClient();
  const { data: hearing, isLoading, error } = useHearing(hearingId);
  const setHearing = (next: Hearing) => {
    queryClient.setQueryData(queryKeys.hearings.detail(hearingId), next);
    void queryClient.invalidateQueries({ queryKey: queryKeys.hearings.list(next.caseId) });
  };
  const { data: courtCase } = useCase(hearing?.caseId ?? "");
  const [transcriptReloadKey, setTranscriptReloadKey] = useState(0);

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="self-start">
      <Link
        to={
          hearing
            ? withLocale(locale, buildRoute.caseDetail(hearing.caseId))
            : withLocale(locale, ROUTE_PATHS.CASES)
        }
      >
        <ChevronLeft className="size-4" />
        {t("common.back")}
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <LoadingState rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <ErrorState />
      </div>
    );
  }

  if (!hearing) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <EmptyState
          title={t("errors.notFoundTitle")}
          description={t("hearing.sessionLostNotice")}
        />
      </div>
    );
  }

  const tabs = [
    {
      id: "live",
      label: t("hearing.liveTab"),
      content: (
        <HearingLifecyclePanel
          hearing={hearing}
          onHearingChanged={setHearing}
          onTranscribed={() => setTranscriptReloadKey((k) => k + 1)}
        />
      ),
    },
    {
      id: "transcript",
      label: t("hearing.transcriptTab"),
      content: (
        <RealTranscriptPanel
          hearing={hearing}
          onHearingChanged={setHearing}
          reloadKey={transcriptReloadKey}
        />
      ),
    },
    {
      id: "events",
      label: t("hearing.eventsTab"),
      content: <EventsPanel hearing={{ id: hearing.id, caseId: hearing.caseId }} />,
    },
    {
      id: "protocol",
      label: t("hearing.protocolTab"),
      content: <ProtocolPanel hearing={{ id: hearing.id, caseId: hearing.caseId }} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {backLink}
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

      <Tabs tabs={tabs} variant="underline" defaultTab="live" />
    </div>
  );
}
