/**
 * "Sudya maslahatchisi" (judge copilot) types (mockup-07) — shaped like a
 * future AI-analysis API response. All current data is per-case fixtures in
 * `mock-api/data/copilot.ts`; no real Lex.uz/LLM integration yet.
 */

/** Visual/priority weight of a detected procedural defect. */
export type CopilotDefectSeverity = "danger" | "warning" | "info";

/** A procedural-defect finding surfaced for the judge to review. */
export interface CopilotDefect {
  id: string;
  caseId: string;
  severity: CopilotDefectSeverity;
  /** Demo fixture text (uz) — stands in for the future AI-generated finding. */
  title: string;
  /** Demo fixture text (uz). */
  description: string;
}

/** Which code the referenced article belongs to. */
export type LawArticleSource = "FPK" | "FK" | "IPK";

/** A relevant law-article suggestion (Lex.uz-shaped, currently fixture data). */
export interface LawArticleRef {
  id: string;
  caseId: string;
  source: LawArticleSource;
  articleNumber: string;
  /** Demo fixture text (uz). */
  title: string;
  /** Relevance score 0–100, rendered as a progress bar. */
  relevance: number;
  /** Footer citation, e.g. "Lex.uz, 2026-yil tahriri". Demo fixture text. */
  sourceNote: string;
}

/** Urgency bucket driving a deadline card's color and ordering. */
export type CopilotDeadlineUrgency = "urgent" | "warning" | "normal";

/** A procedural deadline the copilot is tracking for the case. */
export interface CopilotDeadline {
  id: string;
  caseId: string;
  urgency: CopilotDeadlineUrgency;
  /** Demo fixture text (uz). */
  title: string;
  /** Demo fixture text (uz). */
  description: string;
  /** ISO due date/time — days-left is computed at render against `Date.now()`. */
  dueDate: string;
  /** Total window length in days, used as the mini-progress denominator. */
  totalDays: number;
}

/** An AI conclusion/recommendation the judge can insert into the document. */
export interface CopilotSuggestion {
  id: string;
  caseId: string;
  /** Short category tag, e.g. "Protsessual". Demo fixture text (uz). */
  tag: string;
  /** Demo fixture text (uz). */
  title: string;
  /** Demo fixture text (uz) — the text appended to the document on "Hujjatga qo'shish". */
  text: string;
}
