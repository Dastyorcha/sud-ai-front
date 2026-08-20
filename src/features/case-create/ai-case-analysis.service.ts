import { API_PREFIX } from "@/shared/config/env";
import { apiClient } from "@/shared/lib/http/api-client";
import type { CaseKind } from "@/features/case-create/categories";

export interface CaseAnalysisResult {
  claimantName: string;
  defendantName: string;
  summaryText: string;
}

export interface AnalyzeCaseDocumentsInput {
  caseType: CaseKind;
  category: string;
  files: File[];
}

interface CaseMemoryParticipant {
  full_name: string;
  role: string;
  organization: string | null;
}

interface CaseMemoryClaim {
  description: string;
  amount?: { value: number; currency: string; purpose?: string | null } | null;
}

interface CaseMemoryResponse {
  case_number: string | null;
  participants: CaseMemoryParticipant[];
  claims: CaseMemoryClaim[];
}

/** Runs source-grounded extraction through the authenticated LexKotib backend. */
export async function analyzeCaseDocuments({
  caseType,
  category,
  files,
}: AnalyzeCaseDocumentsInput): Promise<CaseAnalysisResult> {
  if (files.length === 0) throw new Error("Tahlil uchun kamida bitta hujjat yuklang.");
  const form = new FormData();
  form.append("analysisId", `new-${caseType}-${category}-${crypto.randomUUID()}`);
  files.forEach((file) => form.append("files", file));
  const { data } = await apiClient.post<CaseMemoryResponse>(
    `${API_PREFIX}/ai/case-memory/extract`,
    form
  );

  const claimant = data.participants.find((item) => item.role === "plaintiff");
  const defendant = data.participants.find((item) => item.role === "defendant");
  const summaryText = data.claims
    .map((claim) => {
      const amount = claim.amount
        ? ` — ${claim.amount.value.toLocaleString("uz-UZ")} ${claim.amount.currency}`
        : "";
      return `${claim.description}${amount}`;
    })
    .join("\n");

  return {
    claimantName: claimant?.full_name ?? claimant?.organization ?? "",
    defendantName: defendant?.full_name ?? defendant?.organization ?? "",
    summaryText,
  };
}
