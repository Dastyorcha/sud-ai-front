import { z } from "zod";
import { CASE_KIND_VALUES } from "@/features/case-create/categories";

/** One party (claimant/defendant) — name is required, organization optional. */
const partySchema = z.object({
  displayName: z.string().trim().min(1, "requiredName"),
  organizationName: z.string().trim(),
});

/**
 * New-case wizard form schema: case type, then documents, then an
 * AI-generated case summary (subject + parties) extracted from the uploaded
 * documents. A single schema backs one `react-hook-form` instance across the
 * whole wizard so Back never loses values; each step validates only its own
 * field paths via `WIZARD_STEP_FIELDS` + `form.trigger(...)`.
 */
export const caseWizardSchema = z.object({
  caseType: z.enum(CASE_KIND_VALUES, { message: "requiredKind" }),
  category: z.string().min(1, "requiredCategory"),
  claimant: partySchema,
  defendant: partySchema,
  summaryText: z.string().trim().min(1, "requiredSummaryText"),
});

export type CaseWizardValues = z.infer<typeof caseWizardSchema>;

export const CASE_WIZARD_DEFAULTS: CaseWizardValues = {
  caseType: "ECONOMIC_DISPUTE",
  category: "",
  claimant: { displayName: "", organizationName: "" },
  defendant: { displayName: "", organizationName: "" },
  summaryText: "",
};

/** Wizard step numbers, 1-indexed to match the on-screen step indicator. */
export const WIZARD_STEP_COUNT = 3;

/** Field paths validated (via `form.trigger`) before advancing from each step. */
export const WIZARD_STEP_FIELDS: Record<number, string[]> = {
  1: ["caseType", "category"],
  2: [],
  3: ["claimant.displayName", "defendant.displayName", "summaryText"],
};
