import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Path } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Form } from "@/shared/components/ui/form";
import { StepIndicator } from "@/widgets/new-case-wizard/step-indicator";
import { CaseTypeStep } from "@/widgets/new-case-wizard/steps/case-type-step";
import { PartiesStep } from "@/widgets/new-case-wizard/steps/parties-step";
import { ClaimStep } from "@/widgets/new-case-wizard/steps/claim-step";
import {
  CASE_WIZARD_DEFAULTS,
  caseWizardSchema,
  WIZARD_STEP_COUNT,
  WIZARD_STEP_FIELDS,
  type CaseWizardValues,
} from "@/features/case-create/schema";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface NewCaseWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the case (and its participants) were created successfully. */
  onCreated: (caseId: string) => void;
}

const STEP_LABEL_KEYS: MessageKey[] = [
  "caseWizard.steps.type",
  "caseWizard.steps.parties",
  "caseWizard.steps.claim",
  "caseWizard.steps.documents",
  "caseWizard.steps.summary",
];

/**
 * "Yangi ish ochish" 5-step modal wizard (mockup-03): case kind/category,
 * parties, claim + state fee, documents, summary + confirm. Backed by a
 * single `react-hook-form` instance (see `features/case-create/schema.ts`) so
 * Back never loses values; each step is validated independently before
 * advancing. Lazy-loaded from `views/cases/cases.tsx`.
 */
export default function NewCaseWizard({ open, onOpenChange, onCreated }: NewCaseWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  const form = useForm<CaseWizardValues>({
    resolver: zodResolver(caseWizardSchema),
    defaultValues: CASE_WIZARD_DEFAULTS,
    mode: "onSubmit",
  });

  function resetWizard() {
    setStep(1);
    form.reset(CASE_WIZARD_DEFAULTS);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetWizard();
    onOpenChange(next);
  }

  async function goNext() {
    const fields = (WIZARD_STEP_FIELDS[step] ?? []) as Path<CaseWizardValues>[];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (!valid) return;
    setStep((s) => Math.min(s + 1, WIZARD_STEP_COUNT));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-6">
        <DialogHeader>
          <DialogTitle>{t("caseWizard.title")}</DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} labels={STEP_LABEL_KEYS.map((key) => t(key))} />

        <p className="text-xs text-muted-foreground">
          {t("caseWizard.stepOf", { current: step, total: WIZARD_STEP_COUNT })}
        </p>

        <Form {...form}>
          <form
            className="flex max-h-[60vh] min-h-64 flex-col gap-4 overflow-y-auto pr-1"
            onSubmit={(e) => e.preventDefault()}
          >
            {step === 1 && <CaseTypeStep />}
            {step === 2 && <PartiesStep />}
            {step === 3 && <ClaimStep />}
            {step === 4 && (
              <p className="text-sm text-muted-foreground">{t("caseWizard.steps.documents")}</p>
            )}
            {step === 5 && (
              <p className="text-sm text-muted-foreground">{t("caseWizard.steps.summary")}</p>
            )}
          </form>
        </Form>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {t("caseWizard.cancel")}
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={goBack}>
                {t("caseWizard.back")}
              </Button>
            )}
            {step < WIZARD_STEP_COUNT && (
              <Button type="button" variant="gold" onClick={goNext}>
                {t("caseWizard.next")}
              </Button>
            )}
            {step === WIZARD_STEP_COUNT && (
              <Button type="button" variant="gold" onClick={() => onCreated("")}>
                {t("caseWizard.finish")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
