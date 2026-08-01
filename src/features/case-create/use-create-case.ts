import { useState } from "react";
import { createCase } from "@/features/cases/case.service";
import { createParticipant } from "@/features/participants/participant.service";
import type { CourtCase } from "@/shared/types/models";
import type { CourtType } from "@/shared/types/enums";
import type { CaseWizardValues } from "@/features/case-create/schema";
import type { CaseKind } from "@/features/case-create/categories";

/** Best-effort court branch for the wizard's case kind (mockup UC; TODO: real intake routing). */
const COURT_TYPE_BY_KIND: Record<CaseKind, CourtType> = {
  CIVIL: "CIVIL",
  ECONOMIC_DISPUTE: "ECONOMIC",
  SPECIAL: "ADMINISTRATIVE",
};

/** Default court shown on newly-created wizard cases (mockup UC; no court picker in the wizard yet). */
const DEFAULT_COURT_NAME = "Toshkent shahar iqtisodiy sudi";

/** Generates a placeholder case number until intake assigns a real one. */
function generateCaseNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `4-${yy}${mm}-${rand}/13`;
}

export interface UseCreateCaseResult {
  submit: (values: CaseWizardValues) => Promise<CourtCase>;
  isSubmitting: boolean;
}

/**
 * New-case wizard submit hook (`case-create` feature): `POST /cases` (guide
 * §8) then its claimant/defendant participants via
 * `POST /cases/{id}/participants`. The wizard's `caseType` (case kind:
 * Civil/Economic/Special) maps to the request's `courtType`; the finer-grained
 * `category` (e.g. "debtRecovery") maps to the request's `caseType`, since the
 * live API's `caseType` is a free ≤100-char string, not this app's enum.
 * `judgeId` isn't collected by the wizard yet (no judge-list endpoint, guide
 * §17) — `createCase`'s `judgeId` is omitted, left for the backend/assignment
 * step to set later. Callers should catch and toast `errorMessageKey(error)`
 * — e.g. `409 CASE_NUMBER_EXISTS`.
 */
export function useCreateCase(): UseCreateCaseResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(values: CaseWizardValues): Promise<CourtCase> {
    setIsSubmitting(true);
    try {
      const created = await createCase({
        caseNumber: generateCaseNumber(),
        courtName: DEFAULT_COURT_NAME,
        courtType: COURT_TYPE_BY_KIND[values.caseType as CaseKind],
        caseType: values.category,
        description: values.summaryText,
      });

      await createParticipant({
        caseId: created.id,
        displayName: values.claimant.displayName,
        organizationName: values.claimant.organizationName || null,
        role: "Claimant",
      });
      await createParticipant({
        caseId: created.id,
        displayName: values.defendant.displayName,
        organizationName: values.defendant.organizationName || null,
        role: "Defendant",
      });

      return created;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting };
}
