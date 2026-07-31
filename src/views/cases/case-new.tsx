import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createCase } from "@/shared/lib/mock-api/court-case.service";
import { createParticipant } from "@/shared/lib/mock-api/participant.service";
import { COURT_USERS } from "@/shared/lib/mock-api/data";
import { COURT_TYPE, CASE_TYPE, PARTICIPANT_ROLE } from "@/shared/types/enums";
import type { CourtType, CaseType, ParticipantRole } from "@/shared/types/enums";
import { ROUTE_PATHS, buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

const DRAFT_KEY = "lexkotib:case-draft";
const NO_JUDGE = "NONE";

const courtTypeValues = Object.values(COURT_TYPE) as [CourtType, ...CourtType[]];
const caseTypeValues = Object.values(CASE_TYPE) as [CaseType, ...CaseType[]];
const roleValues = Object.values(PARTICIPANT_ROLE) as [ParticipantRole, ...ParticipantRole[]];

/** Case creation form schema (spec UC-01, §14.2/§14.3). */
const schema = z.object({
  caseNumber: z.string().trim().min(1, "errCaseNumber"),
  courtName: z.string().trim().min(1, "errCourtName"),
  courtType: z.enum(courtTypeValues),
  caseType: z.enum(caseTypeValues),
  judgeId: z.string(),
  participants: z
    .array(
      z.object({
        displayName: z.string().trim().min(1, "errName"),
        organizationName: z.string().trim(),
        role: z.enum(roleValues),
      })
    )
    .refine(
      (rows) => rows.some((r) => r.role === "Claimant") && rows.some((r) => r.role === "Defendant"),
      { message: "errClaimantDefendant" }
    ),
});

type CaseFormValues = z.infer<typeof schema>;

const EMPTY_DRAFT: CaseFormValues = {
  caseNumber: "",
  courtName: "",
  courtType: "ECONOMIC",
  caseType: "ECONOMIC_DISPUTE",
  judgeId: NO_JUDGE,
  participants: [
    { displayName: "", organizationName: "", role: "Claimant" },
    { displayName: "", organizationName: "", role: "Defendant" },
  ],
};

function loadDraft(): CaseFormValues {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<CaseFormValues>) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

/**
 * Case creation form (spec FR-02, UC-01, §16.1 #4). Case requisites +
 * participants (field array), Zod-validated (needs ≥1 claimant and ≥1
 * defendant). Draft is persisted to `sessionStorage` so a refresh never loses
 * the clerk's typing. On submit: create the case, then its participants, then
 * open the detail page.
 */
export default function CaseNewView() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: loadDraft(),
    mode: "onSubmit",
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "participants" });

  // Persist every change so an accidental refresh doesn't lose work.
  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        // sessionStorage unavailable (private mode) — draft persistence is best-effort.
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  const judges = COURT_USERS.filter((u) => u.role === "JUDGE");

  /** Resolves a Zod message token to a localized string (falls back to the token). */
  const err = (message?: string) => (message ? t(`caseForm.${message}` as MessageKey) : undefined);

  async function onSubmit(values: CaseFormValues) {
    setSubmitting(true);
    try {
      const created = await createCase({
        caseNumber: values.caseNumber,
        courtName: values.courtName,
        courtType: values.courtType,
        caseType: values.caseType,
        judgeId: values.judgeId === NO_JUDGE ? null : values.judgeId,
      });
      for (const p of values.participants) {
        await createParticipant({
          caseId: created.id,
          displayName: p.displayName,
          organizationName: p.organizationName || null,
          role: p.role,
        });
      }
      sessionStorage.removeItem(DRAFT_KEY);
      navigate(withLocale(locale, buildRoute.caseDetail(created.id)));
    } catch {
      notify.error(t("errors.genericTitle"));
      setSubmitting(false);
    }
  }

  const participantsError = form.formState.errors.participants?.root?.message;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" asChild className="self-start">
          <Link to={withLocale(locale, ROUTE_PATHS.CASES)}>
            <ChevronLeft className="size-4" />
            {t("common.back")}
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("cases.newCase")}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("caseForm.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="caseNumber"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("caseForm.caseNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="font-mono"
                        placeholder={t("caseForm.caseNumberHint")}
                      />
                    </FormControl>
                    <FormMessage>{err(fieldState.error?.message)}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courtName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("caseForm.courtName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage>{err(fieldState.error?.message)}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courtType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cases.columns.type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("caseForm.selectCourtType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courtTypeValues.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`enums.courtType.${v}` as MessageKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="caseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("caseForm.selectCaseType")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("caseForm.selectCaseType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {caseTypeValues.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`enums.caseType.${v}` as MessageKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="judgeId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("enums.courtRoles.JUDGE")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("caseForm.selectJudge")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_JUDGE}>{t("caseForm.unassigned")}</SelectItem>
                        {judges.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("caseForm.participantsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {fields.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <FormField
                    control={form.control}
                    name={`participants.${index}.displayName`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("caseForm.participantNamePlaceholder")}
                          />
                        </FormControl>
                        <FormMessage>{err(fieldState.error?.message)}</FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`participants.${index}.organizationName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder={t("caseForm.organizationPlaceholder")} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`participants.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("caseForm.selectRole")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roleValues.map((v) => (
                              <SelectItem key={v} value={v}>
                                {t(`enums.participantRole.${v}` as MessageKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("caseForm.remove")}
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              {participantsError && (
                <p className="text-sm text-destructive">{err(participantsError)}</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => append({ displayName: "", organizationName: "", role: "Other" })}
              >
                <Plus className="size-4" />
                {t("caseForm.addParticipant")}
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to={withLocale(locale, ROUTE_PATHS.CASES)}>{t("common.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("caseForm.creating") : t("caseForm.create")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
