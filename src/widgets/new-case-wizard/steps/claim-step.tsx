import { useFormContext } from "react-hook-form";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/components/ui/form";
import { Money } from "@/shared/custom/money";
import { calculateStateFee } from "@/features/case-create/fee-calc";
import type { CaseWizardValues } from "@/features/case-create/schema";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/** Step 3: claim text, amount, legal basis and a state-fee ("boj") estimate (mockup-03). */
export function ClaimStep() {
  const { t } = useTranslation();
  const form = useFormContext<CaseWizardValues>();
  const claimAmount = form.watch("claimAmount");
  const stateFee = calculateStateFee(claimAmount);
  const err = (message?: string) =>
    message ? t(`caseWizard.errors.${message}` as MessageKey) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="claimText"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("caseWizard.claimText")}</FormLabel>
            <FormControl>
              <Textarea {...field} rows={4} placeholder={t("caseWizard.claimTextPlaceholder")} />
            </FormControl>
            <FormMessage>{err(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="claimAmount"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("caseWizard.claimAmount")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage>{err(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalBasis"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("caseWizard.legalBasis")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("caseWizard.legalBasisPlaceholder")} />
              </FormControl>
              <FormMessage>{err(fieldState.error?.message)}</FormMessage>
            </FormItem>
          )}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("caseWizard.stateFee")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <Money value={stateFee} className="text-lg font-semibold text-foreground" />
          <p className="text-xs text-muted-foreground">{t("caseWizard.stateFeeHint")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
