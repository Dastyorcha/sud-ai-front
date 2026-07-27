import { useMemo } from "react";
import { FileAudio } from "lucide-react";
import { EmptyState } from "@/shared/custom/empty-state";
import { LoadingState } from "@/shared/custom/loading-state";
import { useHearings } from "@/features/hearings/use-hearings";
import { ProtocolActionsRow } from "@/widgets/protocol-workspace/protocol-actions-row";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

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

  return (
    <div className="flex flex-col gap-6">
      <ProtocolActionsRow hearing={hearing} onChanged={refetch} />

      {!isProcessed && (
        <EmptyState icon={FileAudio} description={t("protocolWorkspace.processingNotice")} />
      )}
    </div>
  );
}
