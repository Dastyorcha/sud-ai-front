import { useState } from "react";
import { createCase } from "@/shared/lib/mock-api/court-case.service";
import { createParticipant } from "@/shared/lib/mock-api/participant.service";
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
 * New-case wizard submit hook (`case-create` feature): creates the case then
 * its claimant/defendant/optional-representative participants via the
 * existing mock services, mirroring `views/cases/case-new.tsx`'s sequencing.
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
        caseType: values.caseType,
        judgeId: null,
        subject: values.claimText,
        claimantName: values.claimant.displayName,
        defendantName: values.defendant.displayName,
        claimAmount: values.claimAmount,
        metadata: { category: values.category, legalBasis: values.legalBasis },
      });

      await createParticipant({
        caseId: created.id,
        displayName: values.claimant.displayName,
        organizationName: values.claimant.organizationName || null,
        role: "CLAIMANT",
      });
      await createParticipant({
        caseId: created.id,
        displayName: values.defendant.displayName,
        organizationName: values.defendant.organizationName || null,
        role: "DEFENDANT",
      });
      if (values.hasRepresentative && values.representativeName.trim()) {
        await createParticipant({
          caseId: created.id,
          displayName: values.representativeName,
          organizationName: null,
          role: values.representativeRole,
        });
      }

      return created;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting };
}
