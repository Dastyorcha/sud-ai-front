/**
 * Mock "Sudya maslahatchisi" chat backend — no real LLM endpoint yet. Echoes
 * a canned acknowledgement referencing the judge's question so the chat UI
 * has something to render; replace with a real AI-assistant endpoint once
 * one exists.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import type { CaseAdvisorMessage } from "@/shared/types/case-advisor";

export interface AskAdvisorInput {
  caseId: string;
  question: string;
}

export async function askAdvisor({ question }: AskAdvisorInput): Promise<string> {
  await delay(900);
  const trimmed = question.trim();
  return `Savolingizni ko'rib chiqdim: "${trimmed}". Hozircha bu maslahatchi namoyish rejimida ishlayapti — hujjatlar va ish tafsilotlariga asoslangan real tahlil tez orada ulanadi.`;
}

export function createAdvisorMessage(
  role: CaseAdvisorMessage["role"],
  text: string,
  createdAt: number
): CaseAdvisorMessage {
  return { id: crypto.randomUUID(), role, text, createdAt };
}
