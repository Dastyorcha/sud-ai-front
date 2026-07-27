import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { listDocuments } from "@/shared/lib/mock-api/document.service";
import type { GeneratedDocument } from "@/shared/types/models";

export type UseDocumentsResult = UseMockQueryResult<GeneratedDocument[]>;

/** Consumer hook over `document.service.listDocuments` — a case's generated documents. */
export function useDocuments(caseId: string): UseDocumentsResult {
  return useMockQuery(() => listDocuments(caseId), [caseId]);
}
