import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Sparkles, RotateCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { analyzeCaseDocuments } from "@/features/case-create/ai-case-analysis.service";
import { CASE_CATEGORY_OPTIONS, type CaseKind } from "@/features/case-create/categories";
import type { CaseWizardValues } from "@/features/case-create/schema";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";
import { errorMessageKey } from "@/shared/lib/errors/error-map";

export interface AiSummaryStepProps {
  files: File[];
}

/**
 * Step 3: triggers the mock AI document analysis and shows its result
 * (case subject + both parties) as an editable draft before the case is
 * created (`features/case-create/ai-case-analysis.service.ts`).
 */
export function AiSummaryStep({ files }: AiSummaryStepProps) {
  const { t } = useTranslation();
  const form = useFormContext<CaseWizardValues>();
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const kind = form.getValues("caseType") as CaseKind;
  const category = CASE_CATEGORY_OPTIONS[kind]?.find(
    (option) => option.value === form.getValues("category")
  );
  const err = (message?: string) =>
    message ? t(`caseWizard.errors.${message}` as MessageKey) : undefined;

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const result = await analyzeCaseDocuments({
        caseType: kind,
        category: form.getValues("category"),
        files,
      });
      form.setValue(
        "claimant.displayName",
        result.claimantName || form.getValues("claimant.displayName")
      );
      form.setValue(
        "defendant.displayName",
        result.defendantName || form.getValues("defendant.displayName")
      );
      form.setValue("summaryText", result.summaryText || form.getValues("summaryText"));
      setAnalyzed(true);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t(errorMessageKey(error)));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("caseWizard.summaryKind")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-foreground">
          <span>{t(`caseWizard.kind.${kind}` as MessageKey)}</span>
          {category && <span className="text-muted-foreground">{t(category.labelKey)}</span>}
          <span className="text-xs text-muted-foreground">
            {t("caseWizard.summaryDocuments")}: {files.length}
          </span>
        </CardContent>
      </Card>

      {!analyzed && (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border p-6 text-center">
          <Sparkles className="size-6 text-gold" />
          <p className="text-sm text-muted-foreground">{t("caseWizard.aiAnalyzeHint")}</p>
          <Button type="button" variant="gold" disabled={analyzing} onClick={runAnalysis}>
            {analyzing ? (
              <>
                <RotateCw className="size-4 animate-spin" />
                {t("caseWizard.aiAnalyzing")}
              </>
            ) : (
              t("caseWizard.aiAnalyze")
            )}
          </Button>
        </div>
      )}

      {analyzed && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">{t("caseWizard.aiResultHint")}</p>

          <FormField
            control={form.control}
            name="claimant.displayName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("caseWizard.claimant")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("caseWizard.namePlaceholder")} />
                </FormControl>
                <FormMessage>{err(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defendant.displayName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("caseWizard.defendant")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("caseWizard.namePlaceholder")} />
                </FormControl>
                <FormMessage>{err(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="summaryText"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("caseWizard.aiSummaryLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={5}
                    placeholder={t("caseWizard.aiSummaryPlaceholder")}
                  />
                </FormControl>
                <FormMessage>{err(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={runAnalysis}
          >
            <RotateCw className="size-4" />
            {t("caseWizard.aiReanalyze")}
          </Button>

          <p className="text-xs text-muted-foreground">{t("caseWizard.confirmHint")}</p>
        </div>
      )}
    </div>
  );
}
