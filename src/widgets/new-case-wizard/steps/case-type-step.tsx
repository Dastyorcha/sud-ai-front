import { useFormContext } from "react-hook-form";
import { Scale, Landmark, Gavel } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  CASE_CATEGORY_OPTIONS,
  CASE_KIND_VALUES,
  type CaseKind,
} from "@/features/case-create/categories";
import type { CaseWizardValues } from "@/features/case-create/schema";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { cn } from "@/shared/lib/utils";

const KIND_ICON: Record<CaseKind, typeof Scale> = {
  CIVIL: Scale,
  ECONOMIC_DISPUTE: Landmark,
  SPECIAL: Gavel,
};

/** Step 1: case kind (3 clickable cards) + category select (mockup-03). */
export function CaseTypeStep() {
  const { t } = useTranslation();
  const form = useFormContext<CaseWizardValues>();
  const kind = form.watch("caseType") as CaseKind;
  const err = (message?: string) =>
    message ? t(`caseWizard.errors.${message}` as MessageKey) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={form.control}
        name="caseType"
        render={({ field, fieldState }) => (
          <FormItem>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CASE_KIND_VALUES.map((value) => {
                const Icon = KIND_ICON[value];
                const isActive = field.value === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      field.onChange(value);
                      form.setValue("category", "");
                    }}
                    className={cn(
                      "h-auto flex-col items-start gap-2 whitespace-normal p-4 text-left",
                      isActive && "border-gold bg-gold-soft"
                    )}
                  >
                    <Icon
                      className={cn("size-5", isActive ? "text-gold" : "text-muted-foreground")}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {t(`caseWizard.kind.${value}` as MessageKey)}
                    </span>
                  </Button>
                );
              })}
            </div>
            <FormMessage>{err(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("caseWizard.categoryLabel")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("caseWizard.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {CASE_CATEGORY_OPTIONS[kind]?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage>{err(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="judgeId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("caseWizard.judgeId")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                className="font-mono"
                placeholder={t("caseWizard.judgeIdPlaceholder")}
              />
            </FormControl>
            <FormDescription>{t("caseWizard.judgeIdHint")}</FormDescription>
            <FormMessage>{err(fieldState.error?.message)}</FormMessage>
          </FormItem>
        )}
      />
    </div>
  );
}
