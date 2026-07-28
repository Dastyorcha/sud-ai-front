/**
 * Mock judge-copilot service (mockup-07) — read-only per-case fixtures
 * standing in for a future AI-analysis endpoint. No mutations: the copilot
 * only surfaces findings; "Hujjatga qo'shish" writes into the document
 * editor via `document-append-bus`, not back into this service.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import {
  COPILOT_DEFECTS,
  COPILOT_LAW_ARTICLES,
  COPILOT_DEADLINES,
  COPILOT_SUGGESTIONS,
} from "@/shared/lib/mock-api/data";
import type {
  CopilotDefect,
  CopilotDeadline,
  CopilotSuggestion,
  LawArticleRef,
} from "@/shared/types/copilot";

export async function listDefects(caseId: string): Promise<CopilotDefect[]> {
  await delay();
  return COPILOT_DEFECTS.filter((d) => d.caseId === caseId);
}

export async function listLawArticles(caseId: string): Promise<LawArticleRef[]> {
  await delay();
  return COPILOT_LAW_ARTICLES.filter((a) => a.caseId === caseId);
}

export async function listDeadlines(caseId: string): Promise<CopilotDeadline[]> {
  await delay();
  return COPILOT_DEADLINES.filter((d) => d.caseId === caseId);
}

export async function listSuggestions(caseId: string): Promise<CopilotSuggestion[]> {
  await delay();
  return COPILOT_SUGGESTIONS.filter((s) => s.caseId === caseId);
}
