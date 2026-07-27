import { Sparkles } from "lucide-react";
import { EmptyState } from "@/shared/custom/empty-state";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/**
 * "Sudya maslahatchisi" tab placeholder — defects, law-article suggestions,
 * deadlines and AI recommendations land in mockup-07. Lazy-loaded from
 * `case-detail`.
 */
export default function CopilotGrid() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Sparkles}
      title={t("common.comingSoonTitle")}
      description={t("common.comingSoonDescription")}
    />
  );
}
