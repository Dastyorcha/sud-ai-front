import { ShieldAlert } from "lucide-react";
import NoData from "@/shared/components/ui/noData";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/** 403 — the user's role doesn't permit the route (role/permission checks
 * land alongside real auth; this is the display for that case). */
export default function Forbidden() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <NoData
        icon={ShieldAlert}
        title={t("errors.forbiddenTitle")}
        description={t("errors.forbiddenDescription")}
      />
    </div>
  );
}
