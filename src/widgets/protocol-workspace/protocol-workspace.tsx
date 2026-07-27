import { FileAudio } from "lucide-react";
import { EmptyState } from "@/shared/custom/empty-state";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/**
 * "Bayonnoma" tab placeholder — audio player, waveform and speaker-tagged
 * transcript land in mockup-05. Lazy-loaded from `case-detail`.
 */
export default function ProtocolWorkspace() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={FileAudio}
      title={t("common.comingSoonTitle")}
      description={t("common.comingSoonDescription")}
    />
  );
}
