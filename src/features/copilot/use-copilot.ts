import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import {
  listDefects,
  listDeadlines,
  listLawArticles,
  listSuggestions,
} from "@/shared/lib/mock-api/copilot.service";
import type {
  CopilotDefect,
  CopilotDeadline,
  CopilotSuggestion,
  LawArticleRef,
} from "@/shared/types/copilot";

export interface CopilotData {
  defects: CopilotDefect[];
  lawArticles: LawArticleRef[];
  deadlines: CopilotDeadline[];
  suggestions: CopilotSuggestion[];
}

export type UseCopilotResult = UseMockQueryResult<CopilotData>;

/**
 * Consumer hook over `copilot.service` — loads all four "Sudya
 * maslahatchisi" card datasets for a case in one round trip.
 */
export function useCopilot(caseId: string): UseCopilotResult {
  return useMockQuery(async () => {
    const [defects, lawArticles, deadlines, suggestions] = await Promise.all([
      listDefects(caseId),
      listLawArticles(caseId),
      listDeadlines(caseId),
      listSuggestions(caseId),
    ]);
    return { defects, lawArticles, deadlines, suggestions };
  }, [caseId]);
}
