import type { MessageKey } from "@/shared/lib/i18n/messages";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface ComingSoonProps {
  /** Optional page-title key (e.g. `PAGE_NAMES.DEBT_CASES`); falls back to
   * the generic "coming soon" title. */
  titleKey?: MessageKey;
}

/** Big centered "coming soon" state — used for placeholder views ahead of
 * a section's real build-out (the dashboard today). Theme-aware, no data
 * fetching. */
export function ComingSoon({ titleKey }: ComingSoonProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {titleKey ? t(titleKey) : t("common.comingSoonTitle")}
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
        {t("common.comingSoonDescription")}
      </p>
    </div>
  );
}
