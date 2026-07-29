import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { listDocuments } from "@/shared/lib/mock-api/document.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import {
  generateDocument,
  getDocument,
  type GenerateDocumentAccepted,
  type GenerateDocumentInput,
} from "@/features/documents/document.service";
import type { GeneratedDocument } from "@/shared/types/models";

export type UseDocumentsResult = UseMockQueryResult<GeneratedDocument[]>;

/**
 * Consumer hook over the mock `document.service.listDocuments` — a case's
 * generated documents. Stays on the mock layer: there's no live
 * `GET /cases/{id}/documents` endpoint yet (guide §17), so this is only a
 * count/list stub (`case-detail`'s stats card) until that endpoint exists.
 * Prefer `useDocument`/`useGenerateDocument` below for a single hearing's
 * real generated document.
 */
export function useDocuments(caseId: string): UseDocumentsResult {
  return useMockQuery(() => listDocuments(caseId), [caseId]);
}

/** A document by id (guide §12 `GET /documents/{id}`) — `null`/`undefined` id keeps the query disabled. */
export function useDocument(
  documentId: string | null | undefined
): UseQueryResult<GeneratedDocument> {
  return useQuery({
    queryKey: queryKeys.documents.detail(documentId ?? ""),
    queryFn: () => getDocument(documentId as string),
    enabled: Boolean(documentId),
  });
}

/** Queues protocol generation for a case (guide §12 `POST /cases/{id}/documents/generate`). */
export function useGenerateDocument(
  caseId: string
): UseApiMutationResult<GenerateDocumentAccepted, GenerateDocumentInput> {
  return useApiMutation({
    mutationFn: (input) => generateDocument(caseId, input),
  });
}
