import { AlertTriangle } from "lucide-react";
import NoData from "@/shared/components/ui/noData";
import { Button } from "@/shared/components/ui/button";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Shows a localized "retry" button when provided. */
  onRetry?: () => void;
  className?: string;
}

/** Standard error state for data views — localized message + optional retry. */
export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex w-full flex-col items-center gap-4", className)}>
      <NoData
        icon={AlertTriangle}
        title={title ?? t("errors.genericTitle")}
        description={description ?? t("errors.genericDescription")}
      />
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
