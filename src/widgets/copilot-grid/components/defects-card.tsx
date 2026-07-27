import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/custom/empty-state";
import { StatusBadge, type StatusBadgeProps } from "@/shared/custom/status-badge";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import type { CopilotDefect, CopilotDefectSeverity } from "@/shared/types/copilot";
import { cn } from "@/shared/lib/utils";

const SEVERITY_TONE: Record<CopilotDefectSeverity, NonNullable<StatusBadgeProps["tone"]>> = {
  danger: "destructive",
  warning: "warning",
  info: "info",
};

const SEVERITY_ICON: Record<CopilotDefectSeverity, LucideIcon> = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_BORDER: Record<CopilotDefectSeverity, string> = {
  danger: "border-l-destructive",
  warning: "border-l-warning",
  info: "border-l-accent-foreground/40",
};

const SEVERITY_ICON_CLASS: Record<CopilotDefectSeverity, string> = {
  danger: "text-destructive",
  warning: "text-warning",
  info: "text-muted-foreground",
};

export interface DefectsCardProps {
  defects: CopilotDefect[];
  className?: string;
}

/**
 * Procedural defects checker (mockup-07) — severity-colored findings with a
 * risk badge. Demo fixture data via `useCopilot`, not a real AI analysis.
 */
export function DefectsCard({ defects, className }: DefectsCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("copilotGrid.defects.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {defects.length === 0 ? (
          <EmptyState description={t("copilotGrid.defects.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {defects.map((defect) => {
              const Icon = SEVERITY_ICON[defect.severity];
              return (
                <li
                  key={defect.id}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-md border-l-4 bg-muted/30 p-3",
                    SEVERITY_BORDER[defect.severity]
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          SEVERITY_ICON_CLASS[defect.severity]
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-foreground">{defect.title}</span>
                    </div>
                    <StatusBadge
                      tone={SEVERITY_TONE[defect.severity]}
                      label={t(`copilotGrid.defects.severity.${defect.severity}` as MessageKey)}
                      className="shrink-0"
                    />
                  </div>
                  <p className="pl-6 text-xs text-muted-foreground">{defect.description}</p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default DefectsCard;
