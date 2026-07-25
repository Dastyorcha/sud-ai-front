import { ShieldAlert } from "lucide-react";
import NoData from "@/shared/components/ui/noData";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface PermissionDeniedProps {
  className?: string;
}

/** Inline gate for a section/action the current role can't access (see `Can`/`usePermission`). */
export function PermissionDenied({ className }: PermissionDeniedProps) {
  const { t } = useTranslation();

  return (
    <NoData
      icon={ShieldAlert}
      title={t("errors.forbiddenTitle")}
      description={t("errors.forbiddenDescription")}
      className={className}
    />
  );
}
