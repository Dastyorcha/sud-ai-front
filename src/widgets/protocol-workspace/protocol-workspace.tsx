import { useMemo, useState } from "react";
import { FileAudio } from "lucide-react";
import { EmptyState } from "@/shared/custom/empty-state";
import { LoadingState } from "@/shared/custom/loading-state";
import { useHearings } from "@/features/hearings/use-hearings";
import { TranscriptPanel } from "@/features/transcript/transcript-panel";
import { ProtocolActionsRow } from "@/widgets/protocol-workspace/protocol-actions-row";
import { AudioPlayerBar } from "@/widgets/audio-player-bar/audio-player-bar";
import { SpeakersPanel } from "@/widgets/speakers-panel/speakers-panel";
import { transitionHearing } from "@/shared/lib/mock-api/hearing.service";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

export interface ProtocolWorkspaceProps {
  caseId: string;
}

/**
 * "Bayonnoma" tab (mockup-05): actions row (upload/record/status/duration),
 * followed by the audio player + speakers/transcript workspace and the
 * generate bar once the hearing is processed. Picks the case's processed
 * hearing if one exists, otherwise its most recent hearing. Lazy-loaded from
 * `case-detail`.
 */
export default function ProtocolWorkspace({ caseId }: ProtocolWorkspaceProps) {
  const { t } = useTranslation();
  const { data: hearings, isLoading, refetch } = useHearings(caseId);
  // Mock playback clock from the player, consumed by the transcript's active-row highlight.
  const [currentMs, setCurrentMs] = useState(0);

  const hearing = useMemo(() => {
    if (!hearings || hearings.length === 0) return null;
    const processed = hearings.find(
      (h) => h.status === "READY_FOR_REVIEW" || h.status === "APPROVED"
    );
    return processed ?? hearings[hearings.length - 1];
  }, [hearings]);

  if (isLoading) return <LoadingState rows={4} />;

  if (!hearing) {
    return (
      <EmptyState
        icon={FileAudio}
        title={t("protocolWorkspace.noHearingTitle")}
        description={t("protocolWorkspace.noHearingDescription")}
      />
    );
  }

  const isProcessed = hearing.status === "READY_FOR_REVIEW" || hearing.status === "APPROVED";

  async function approveCanonical() {
    try {
      await transitionHearing(hearing!.id, "APPROVED");
      notify.success(t("transcript.approveCanonical"));
      refetch();
    } catch {
      notify.error(t("errors.genericTitle"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProtocolActionsRow hearing={hearing} onChanged={refetch} />

      {isProcessed ? (
        <>
          <AudioPlayerBar durationMs={hearing.audioDurationMs} onTimeChange={setCurrentMs} />

          <div className="flex flex-col gap-4 lg:flex-row">
            <SpeakersPanel caseId={caseId} hearingId={hearing.id} className="lg:w-72 lg:shrink-0" />
            <div className="min-w-0 flex-1">
              <TranscriptPanel
                hearing={hearing}
                onApproved={approveCanonical}
                activeMs={currentMs}
              />
            </div>
          </div>
        </>
      ) : (
        <EmptyState icon={FileAudio} description={t("protocolWorkspace.processingNotice")} />
      )}
    </div>
  );
}
