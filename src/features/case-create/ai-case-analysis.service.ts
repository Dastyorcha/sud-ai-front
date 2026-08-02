/**
 * Mock AI document-analysis for the new-case wizard's final step — no backend
 * endpoint exists yet (docs/api-integration.md §17 gap register). Given the
 * uploaded documents' file names it stands in for an AI pass that would
 * extract the case subject and the two parties' names; the result is shown
 * to the user as an editable draft, never submitted as-is.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import type { CaseKind } from "@/features/case-create/categories";

export interface CaseAnalysisResult {
  claimantName: string;
  defendantName: string;
  summaryText: string;
}

export interface AnalyzeCaseDocumentsInput {
  caseType: CaseKind;
  category: string;
  fileNames: string[];
}

function fileStem(fileName: string): string {
  return fileName
    .replace(/\.[^./]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

/** Simulates an AI pass over the uploaded documents (mock UC; TODO: replace with a real analysis endpoint). */
export async function analyzeCaseDocuments({
  fileNames,
}: AnalyzeCaseDocumentsInput): Promise<CaseAnalysisResult> {
  await delay(1200);

  const subjects = fileNames.map(fileStem).filter(Boolean);
  const summaryText =
    subjects.length > 0
      ? `Yuklangan hujjatlar (${subjects.join(", ")}) asosida tahlil qilindi.`
      : "";

  return {
    claimantName: "",
    defendantName: "",
    summaryText,
  };
}
