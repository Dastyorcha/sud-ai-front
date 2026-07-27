import { APP_FULL_NAME, APP_VERSION } from "@/shared/constants/app";
import { cn } from "@/shared/lib/utils";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export type SystemStatus = "ok" | "warning" | "error";

const STATUS_DOT_CLASS: Record<SystemStatus, string> = {
  ok: "bg-status-ok",
  warning: "bg-status-warning",
  error: "bg-status-error",
};

interface AppFooterProps {
  /** System health for the status dot — defaults to "ok" (no live health
   * check wired yet; a later plan can pass a real value). */
  status?: SystemStatus;
}

/** App status footer: status dot + label, last-updated timestamp, version,
 * and the product tagline. Mounted by `AppShell` under the routed content. */
export function AppFooter({ status = "ok" }: AppFooterProps) {
  const { t, formatDate } = useTranslation();
  const lastUpdated = formatDate(new Date());

  return (
    <footer className="flex flex-col gap-1 border-t border-border bg-background px-4 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status])}
          aria-hidden="true"
        />
        <span className="truncate">{t(`footer.status.${status}` as MessageKey)}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate">{t("footer.lastUpdated", { date: lastUpdated })}</span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 font-mono">{t("footer.version", { version: APP_VERSION })}</span>
        <span className="hidden shrink-0 sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="hidden truncate sm:inline">
          {t("footer.tagline", { app: APP_FULL_NAME })}
        </span>
      </div>
    </footer>
  );
}
