import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { EmptyState } from "@/shared/custom/empty-state";
import { StatusBadge, type StatusBadgeProps } from "@/shared/custom/status-badge";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import type { CopilotDeadline, CopilotDeadlineUrgency } from "@/shared/types/copilot";
import { cn } from "@/shared/lib/utils";

const URGENCY_TONE: Record<CopilotDeadlineUrgency, NonNullable<StatusBadgeProps["tone"]>> = {
  urgent: "destructive",
  warning: "warning",
  normal: "neutral",
};

const URGENCY_BORDER: Record<CopilotDeadlineUrgency, string> = {
  urgent: "border-l-destructive",
  warning: "border-l-warning",
  normal: "border-l-border",
};

export interface DeadlinesCardProps {
  deadlines: CopilotDeadline[];
  className?: string;
}

/** Days left until `dueDate`, relative to now (negative once overdue). */
function daysLeft(dueDate: string): number {
  const diffMs = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diffMs / 86_400_000);
}

/**
 * Procedural deadlines tracker (mockup-07) — urgency-colored items with a
 * countdown and a mini elapsed-time progress bar. Demo fixture data via
 * `useCopilot`; days-left is computed against `Date.now()` at render.
 */
export function DeadlinesCard({ deadlines, className }: DeadlinesCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("copilotGrid.deadlines.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <EmptyState description={t("copilotGrid.deadlines.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {deadlines.map((deadline) => {
              const left = daysLeft(deadline.dueDate);
              const elapsedPct = Math.max(
                0,
                Math.min(100, ((deadline.totalDays - left) / deadline.totalDays) * 100)
              );
              return (
                <li
                  key={deadline.id}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-md border-l-4 bg-muted/30 p-3",
                    URGENCY_BORDER[deadline.urgency]
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{deadline.title}</span>
                    <StatusBadge
                      tone={URGENCY_TONE[deadline.urgency]}
                      label={
                        left < 0
                          ? t("copilotGrid.deadlines.overdue")
                          : t("copilotGrid.deadlines.daysLeft", { count: left })
                      }
                      className="shrink-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{deadline.description}</p>
                  <Progress
                    value={elapsedPct}
                    className="h-1.5"
                    aria-label={t(
                      `copilotGrid.deadlines.urgency.${deadline.urgency}` as MessageKey
                    )}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default DeadlinesCard;
