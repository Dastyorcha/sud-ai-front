import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMockQuery, type UseMockQueryResult } from "@/shared/hooks/use-mock-query";
import { listDocuments } from "@/shared/lib/mock-api/document.service";
import { queryKeys } from "@/shared/lib/query/query-keys";
import { useApiMutation, type UseApiMutationResult } from "@/shared/lib/query/use-api-mutation";
import {
  approveDocument,
  downloadDocument,
  generateDocument,
  getDocument,
  requestDocumentChanges,
  submitDocumentReview,
  updateDocumentContent,
  type DocumentVersionGate,
  type GenerateDocumentAccepted,
  type GenerateDocumentInput,
  type RequestDocumentChangesInput,
  type UpdateDocumentContentInput,
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

const HEARING_DOCUMENT_SESSION_KEY_PREFIX = "lexkotib:hearing-document:";

function readHearingDocumentId(hearingId: string): string | undefined {
  try {
    return sessionStorage.getItem(HEARING_DOCUMENT_SESSION_KEY_PREFIX + hearingId) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Session-local carry for a hearing's generated protocol document id
 * (mirrors `use-hearing-session.ts` — there's no `GET /hearings/{id}/documents`
 * lookup, guide §17, so the id returned by `generateDocument`'s `202` is the
 * only way to find it again). Resilient to a same-tab refresh; a fresh
 * tab/session that never saw the generate call can't recover it.
 */
export function useHearingDocumentId(
  hearingId: string
): [string | undefined, (documentId: string) => void] {
  const [documentId, setDocumentIdState] = useState<string | undefined>(() =>
    readHearingDocumentId(hearingId)
  );

  useEffect(() => {
    setDocumentIdState(readHearingDocumentId(hearingId));
  }, [hearingId]);

  const setDocumentId = useCallback(
    (id: string) => {
      try {
        sessionStorage.setItem(HEARING_DOCUMENT_SESSION_KEY_PREFIX + hearingId, id);
      } catch {
        // sessionStorage unavailable — degrades to "current render only".
      }
      setDocumentIdState(id);
    },
    [hearingId]
  );

  return [documentId, setDocumentId];
}

/** How often `useDocument`'s regeneration poll re-`GET`s (guide §12/§17 — PATCH returns no `jobId`). */
const REGEN_POLL_INTERVAL_MS = 2_000;
/** How long to keep polling before surfacing `isRegenerationTimedOut` (guide §17 — must be robust against a never-ready DOCX). */
const REGEN_POLL_TIMEOUT_MS = 60_000;

export interface UseDocumentOptions {
  /**
   * Poll `GET /documents/{id}` every ~2s until `docxStorageKey` is set —
   * needed after a content `PATCH`, which never returns a regeneration
   * `jobId` (guide §12/§17). Stops after ~60s; check `isRegenerationTimedOut`
   * to show a "still processing" message instead of polling forever.
   */
  pollForDocx?: boolean;
}

export type UseDocumentResult = UseQueryResult<GeneratedDocument> & {
  isRegenerationTimedOut: boolean;
};

/** A document by id (guide §12 `GET /documents/{id}`) — `null`/`undefined` id keeps the query disabled. */
export function useDocument(
  documentId: string | null | undefined,
  options: UseDocumentOptions = {}
): UseDocumentResult {
  const pollStartedAtRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: queryKeys.documents.detail(documentId ?? ""),
    queryFn: () => getDocument(documentId as string),
    enabled: Boolean(documentId),
    refetchInterval: (q) => {
      if (!options.pollForDocx) {
        pollStartedAtRef.current = null;
        return false;
      }
      const docxReady = Boolean(q.state.data?.docxStorageKey);
      if (docxReady) {
        pollStartedAtRef.current = null;
        return false;
      }
      if (pollStartedAtRef.current === null) pollStartedAtRef.current = Date.now();
      if (Date.now() - pollStartedAtRef.current > REGEN_POLL_TIMEOUT_MS) return false;
      return REGEN_POLL_INTERVAL_MS;
    },
    refetchOnWindowFocus: false,
  });

  const isRegenerationTimedOut = useMemo(() => {
    if (!options.pollForDocx || !query.data) return false;
    if (query.data.docxStorageKey) return false;
    return (
      pollStartedAtRef.current !== null &&
      Date.now() - pollStartedAtRef.current > REGEN_POLL_TIMEOUT_MS
    );
  }, [options.pollForDocx, query.data]);

  return { ...query, isRegenerationTimedOut };
}

/** Queues protocol generation for a case (guide §12 `POST /cases/{id}/documents/generate`). */
export function useGenerateDocument(
  caseId: string
): UseApiMutationResult<GenerateDocumentAccepted, GenerateDocumentInput> {
  return useApiMutation({
    mutationFn: (input) => generateDocument(caseId, input),
  });
}

/** Edits a document's content (guide §12 `PATCH /documents/{id}`) — preserve `sources` on every paragraph/field. */
export function useUpdateDocumentContent(
  documentId: string
): UseApiMutationResult<GeneratedDocument, UpdateDocumentContentInput> {
  return useApiMutation({
    mutationFn: (input) => updateDocumentContent(documentId, input),
    invalidateKeys: [queryKeys.documents.detail(documentId)],
  });
}

/** Downloads a document's generated DOCX (guide §12 `GET /documents/{id}/download`) — see `downloadDocument`. */
export function useDownloadDocument(
  documentId: string
): UseApiMutationResult<void, { fileName: string }> {
  return useApiMutation({
    mutationFn: ({ fileName }) => downloadDocument(documentId, fileName),
  });
}

/** Submits a document for review (guide §12 `POST /documents/{id}/submit-review`). */
export function useSubmitDocumentReview(
  documentId: string
): UseApiMutationResult<GeneratedDocument, DocumentVersionGate> {
  return useApiMutation({
    mutationFn: (input) => submitDocumentReview(documentId, input),
    invalidateKeys: [queryKeys.documents.detail(documentId)],
  });
}

/** Requests changes on a document (guide §12 `POST /documents/{id}/request-changes`, Judge/Admin). */
export function useRequestDocumentChanges(
  documentId: string
): UseApiMutationResult<GeneratedDocument, RequestDocumentChangesInput> {
  return useApiMutation({
    mutationFn: (input) => requestDocumentChanges(documentId, input),
    invalidateKeys: [queryKeys.documents.detail(documentId)],
  });
}

/** Approves a document (guide §12 `POST /documents/{id}/approve`, Judge/Admin) — immutable afterwards. */
export function useApproveDocument(
  documentId: string
): UseApiMutationResult<GeneratedDocument, DocumentVersionGate> {
  return useApiMutation({
    mutationFn: (input) => approveDocument(documentId, input),
    invalidateKeys: [queryKeys.documents.detail(documentId)],
  });
}
