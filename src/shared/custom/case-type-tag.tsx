import { Badge } from "@/shared/components/ui/badge";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { CaseType } from "@/shared/types/enums";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { cn } from "@/shared/lib/utils";

export interface CaseTypeTagProps {
  caseType: CaseType;
  className?: string;
}

/** Neutral outline tag for a case's category (economic dispute, debt recovery, …). */
export function CaseTypeTag({ caseType, className }: CaseTypeTagProps) {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className={cn("border-border bg-muted font-normal text-muted-foreground", className)}
    >
      {t(`enums.caseType.${caseType}` as MessageKey)}
    </Badge>
  );
}
