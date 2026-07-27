import { FileText } from "lucide-react";
import { EmptyState } from "@/shared/custom/empty-state";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/**
 * "Sud hujjatlari" tab placeholder — template selector, facts panel and
 * document editor land in mockup-06. Lazy-loaded from `case-detail`.
 */
export default function DocumentsWorkspace() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={FileText}
      title={t("common.comingSoonTitle")}
      description={t("common.comingSoonDescription")}
    />
  );
}
