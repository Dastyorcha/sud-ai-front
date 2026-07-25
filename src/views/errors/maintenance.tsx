import { Wrench } from "lucide-react";
import NoData from "@/shared/components/ui/noData";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/** Maintenance page — shown when the system is intentionally unavailable
 * (wired to a real flag/backend flag in a later plan). */
export default function Maintenance() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <NoData
        icon={Wrench}
        title={t("errors.maintenanceTitle")}
        description={t("errors.maintenanceDescription")}
      />
    </div>
  );
}
