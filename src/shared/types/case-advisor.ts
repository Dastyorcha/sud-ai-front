/**
 * "Sudya maslahatchisi" chat types — a per-case AI assistant chat. No real
 * LLM backend yet (see `mock-api/case-advisor.service.ts`).
 */
export type CaseAdvisorRole = "user" | "assistant";

export interface CaseAdvisorMessage {
  id: string;
  role: CaseAdvisorRole;
  text: string;
  /** Epoch ms. */
  createdAt: number;
}
