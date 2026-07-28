import { StatusBadge } from "@/shared/custom/status-badge";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { CaseStage } from "@/shared/types/enums";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { cn } from "@/shared/lib/utils";

/** One shared place mapping a case stage to its dot color token (mockup dashboard). */
const STAGE_DOT_CLASS: Record<CaseStage, string> = {
  INTAKE: "bg-stage-1",
  PREPARATION: "bg-stage-2",
  HEARING: "bg-stage-3",
  DECISION: "bg-stage-4",
  APPEAL: "bg-stage-5",
  EXECUTION: "bg-stage-6",
};

export interface StageBadgeProps {
  stage: CaseStage;
  className?: string;
}

/** Case-stage pill (qabul/tayyorgarlik/sudkorishi/qaror/apellyatsiya/ijro) — a `StatusBadge` with a stage-token dot. */
export function StageBadge({ stage, className }: StageBadgeProps) {
  const { t } = useTranslation();

  return (
    <StatusBadge
      label={t(`enums.caseStage.${stage}` as MessageKey)}
      tone="neutral"
      dotClassName={cn(STAGE_DOT_CLASS[stage])}
      className={className}
    />
  );
}
