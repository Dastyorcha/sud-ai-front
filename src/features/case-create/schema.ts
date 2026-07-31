import { z } from "zod";
import { PARTICIPANT_ROLE } from "@/shared/types/enums";
import { CASE_KIND_VALUES } from "@/features/case-create/categories";

/** One party (claimant/defendant) — name is required, organization optional. */
const partySchema = z.object({
  displayName: z.string().trim().min(1, "requiredName"),
  organizationName: z.string().trim(),
});

const representativeRoleValues = [
  PARTICIPANT_ROLE.ClaimantRepresentative,
  PARTICIPANT_ROLE.DefendantRepresentative,
] as const;

/**
 * New-case wizard form schema (mockup-03) spanning steps 1–3. A single schema
 * backs one `react-hook-form` instance across the whole wizard so Back never
 * loses values; each step validates only its own field paths via
 * `WIZARD_STEP_FIELDS` + `form.trigger(...)`.
 */
export const caseWizardSchema = z
  .object({
    caseType: z.enum(CASE_KIND_VALUES, { message: "requiredKind" }),
    category: z.string().min(1, "requiredCategory"),
    /**
     * Assigned judge's account UUID (integration guide §17 — no judge-list
     * endpoint yet, so this is a manual UUID field rather than a picker).
     * TODO: replace with a real judge picker once a judge-list endpoint exists.
     */
    judgeId: z.string().trim().min(1, "requiredJudgeId").uuid("invalidJudgeId"),
    claimant: partySchema,
    defendant: partySchema,
    hasRepresentative: z.boolean(),
    representativeName: z.string().trim(),
    representativeRole: z.enum(representativeRoleValues),
    claimText: z.string().trim().min(1, "requiredClaimText"),
    claimAmount: z.number().min(0, "requiredClaimAmount"),
    legalBasis: z.string().trim().min(1, "requiredLegalBasis"),
  })
  .superRefine((values, ctx) => {
    if (values.hasRepresentative && values.representativeName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "requiredRepresentativeName",
        path: ["representativeName"],
      });
    }
  });

export type CaseWizardValues = z.infer<typeof caseWizardSchema>;

export const CASE_WIZARD_DEFAULTS: CaseWizardValues = {
  caseType: "ECONOMIC_DISPUTE",
  category: "",
  judgeId: "",
  claimant: { displayName: "", organizationName: "" },
  defendant: { displayName: "", organizationName: "" },
  hasRepresentative: false,
  representativeName: "",
  representativeRole: "ClaimantRepresentative",
  claimText: "",
  claimAmount: 0,
  legalBasis: "",
};

/** Wizard step numbers, 1-indexed to match the on-screen step indicator. */
export const WIZARD_STEP_COUNT = 5;

/** Field paths validated (via `form.trigger`) before advancing from each step. */
export const WIZARD_STEP_FIELDS: Record<number, string[]> = {
  1: ["caseType", "category", "judgeId"],
  2: ["claimant.displayName", "defendant.displayName", "representativeName"],
  3: ["claimText", "claimAmount", "legalBasis"],
  4: [],
  5: [],
};
