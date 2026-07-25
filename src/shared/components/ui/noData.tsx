import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface NoDataProps {
  /** Overrides the default localized "no data" title. */
  title?: string;
  /** Optional supporting copy — what to do next. */
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

/** Shared empty/error state — used by data views (no rows) and by the
 * `views/errors` pages (403/404/maintenance) with a custom title+description. */
export default function NoData({ title, description, icon: Icon = Inbox, className }: NoDataProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "my-10 flex w-full flex-col items-center justify-center gap-2 text-center",
        className
      )}
    >
      <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-lg font-medium text-foreground">{title ?? t("common.noData")}</p>
      {description && <p className="max-w-prose text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
