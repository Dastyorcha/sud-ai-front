import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/components/ui/form";
import { PARTICIPANT_ROLE } from "@/shared/types/enums";
import type { CaseWizardValues } from "@/features/case-create/schema";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

const REPRESENTATIVE_ROLE_VALUES = [
  PARTICIPANT_ROLE.CLAIMANT_REPRESENTATIVE,
  PARTICIPANT_ROLE.DEFENDANT_REPRESENTATIVE,
] as const;

/** Step 2: claimant, defendant and an optional representative (mockup-03). */
export function PartiesStep() {
  const { t } = useTranslation();
  const form = useFormContext<CaseWizardValues>();
  const hasRepresentative = form.watch("hasRepresentative");
  const err = (message?: string) =>
    message ? t(`caseWizard.errors.${message}` as MessageKey) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("caseWizard.claimant")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="claimant.displayName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder={t("caseWizard.namePlaceholder")} />
                </FormControl>
                <FormMessage>{err(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="claimant.organizationName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder={t("caseWizard.organizationPlaceholder")} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("caseWizard.defendant")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="defendant.displayName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder={t("caseWizard.namePlaceholder")} />
                </FormControl>
                <FormMessage>{err(fieldState.error?.message)}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defendant.organizationName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder={t("caseWizard.organizationPlaceholder")} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">{t("caseWizard.representative")}</CardTitle>
          <FormField
            control={form.control}
            name="hasRepresentative"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
                {t("caseWizard.addRepresentative")}
              </label>
            )}
          />
        </CardHeader>
        {hasRepresentative && (
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="representativeName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("caseWizard.namePlaceholder")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("caseWizard.namePlaceholder")} />
                  </FormControl>
                  <FormMessage>{err(fieldState.error?.message)}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="representativeRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("caseWizard.representativeRole")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REPRESENTATIVE_ROLE_VALUES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`enums.participantRole.${role}` as MessageKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
