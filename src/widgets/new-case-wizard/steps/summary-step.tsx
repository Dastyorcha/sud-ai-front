import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Money } from "@/shared/custom/money";
import { CASE_CATEGORY_OPTIONS, type CaseKind } from "@/features/case-create/categories";
import { calculateStateFee } from "@/features/case-create/fee-calc";
import type { CaseWizardValues } from "@/features/case-create/schema";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface SummaryStepProps {
  fileCount: number;
  checkedDocsCount: number;
  requiredDocsCount: number;
}

/** Step 5: read-only summary of every entered field before confirming (mockup-03). */
export function SummaryStep({ fileCount, checkedDocsCount, requiredDocsCount }: SummaryStepProps) {
  const { t } = useTranslation();
  const { getValues } = useFormContext<CaseWizardValues>();
  const values = getValues();
  const kind = values.caseType as CaseKind;
  const category = CASE_CATEGORY_OPTIONS[kind]?.find((option) => option.value === values.category);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("caseWizard.summaryKind")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-foreground">
          <span>{t(`caseWizard.kind.${kind}` as MessageKey)}</span>
          {category && <span className="text-muted-foreground">{t(category.labelKey)}</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("caseWizard.summaryParties")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-foreground">
          <span>
            {t("caseWizard.claimant")}: {values.claimant.displayName}
          </span>
          <span>
            {t("caseWizard.defendant")}: {values.defendant.displayName}
          </span>
          {values.hasRepresentative && values.representativeName && (
            <span>
              {t("caseWizard.representative")}: {values.representativeName}
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("caseWizard.summaryClaim")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-foreground">
          <span className="line-clamp-3 text-muted-foreground">{values.claimText}</span>
          <Money value={values.claimAmount} className="font-medium" />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {t("caseWizard.stateFee")}:
            <Money value={calculateStateFee(values.claimAmount)} />
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("caseWizard.summaryDocuments")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {fileCount} · {checkedDocsCount}/{requiredDocsCount}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t("caseWizard.confirmHint")}</p>
    </div>
  );
}
