import type { CaseType } from "@/shared/types/enums";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * "Case kind" cards shown on the new-case wizard's step 1 (mockup-03:
 * Fuqarolik / Iqtisodiy / Maxsus) — an additive `CaseType` subset representing
 * the court branch, distinct from the finer-grained economic sub-types
 * (`DEBT_RECOVERY`, `CONTRACT_DISPUTE`, …) already on the enum.
 */
export const CASE_KIND_VALUES = ["CIVIL", "ECONOMIC_DISPUTE", "SPECIAL"] as const;
export type CaseKind = (typeof CASE_KIND_VALUES)[number];

// CaseKind must stay a subset of CaseType — compile-time guard.
const _kindIsCaseType: readonly CaseType[] = CASE_KIND_VALUES;
void _kindIsCaseType;

export interface CaseCategoryOption {
  value: string;
  labelKey: MessageKey;
}

/**
 * Category options per kind — a cosmetic sub-classification stored on the
 * created case's `metadata.category`, not a domain enum (mockup UC; TODO:
 * replace with the backend's real category taxonomy once frozen).
 */
export const CASE_CATEGORY_OPTIONS: Record<CaseKind, CaseCategoryOption[]> = {
  CIVIL: [
    { value: "family", labelKey: "caseWizard.categories.civil.family" },
    { value: "property", labelKey: "caseWizard.categories.civil.property" },
    { value: "inheritance", labelKey: "caseWizard.categories.civil.inheritance" },
    { value: "other", labelKey: "caseWizard.categories.civil.other" },
  ],
  ECONOMIC_DISPUTE: [
    { value: "debtRecovery", labelKey: "caseWizard.categories.economic.debtRecovery" },
    { value: "contractDispute", labelKey: "caseWizard.categories.economic.contractDispute" },
    { value: "bankruptcy", labelKey: "caseWizard.categories.economic.bankruptcy" },
    { value: "other", labelKey: "caseWizard.categories.economic.other" },
  ],
  SPECIAL: [
    { value: "administrative", labelKey: "caseWizard.categories.special.administrative" },
    { value: "other", labelKey: "caseWizard.categories.special.other" },
  ],
};

/** Required-document checklist for step 4 (mockup UC; informational, non-blocking). */
export const REQUIRED_DOCUMENT_KEYS = [
  "claimStatement",
  "stateFeeReceipt",
  "powerOfAttorney",
  "evidenceList",
] as const;
export type RequiredDocumentKey = (typeof REQUIRED_DOCUMENT_KEYS)[number];
