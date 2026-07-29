/**
 * Real `/cases/{id}/documents/generate` + `/documents/{id}` calls
 * (integration guide §12, §16). Generation is a background job (poll via
 * `useJobPolling`, then GET); every mutation past that is
 * `expectedVersion`-gated (optimistic concurrency, guide §16) — callers must
 * write the response's new `version` back into their local state.
 * `contentJson.fields`/`sections`/paragraph `sources` must be preserved
 * verbatim on every edit (see `shared/types/models.ts` `DocumentContent`) —
 * dropping `sources` breaks server-side approval.
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { DocumentContent, GeneratedDocument } from "@/shared/types/models";
import type { DocumentStatus, DocumentType } from "@/shared/types/enums";

/** `DocumentResponse` (guide §12) — the exact live shape returned by GET/PATCH/lifecycle endpoints. */
export interface DocumentResponse {
  id: string;
  caseId: string;
  hearingId: string | null;
  documentType: string;
  templateCode: string;
  templateVersion: string | null;
  status: string;
  contentJson: DocumentContent;
  sourceSnapshot: Record<string, unknown>;
  docxStorageKey: string | null;
  pdfStorageKey: string | null;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt: string | null;
}

/** Maps a `DocumentResponse` to the domain `GeneratedDocument`. */
function toDocument(response: DocumentResponse): GeneratedDocument {
  return {
    id: response.id,
    caseId: response.caseId,
    hearingId: response.hearingId,
    documentType: response.documentType as DocumentType,
    templateCode: response.templateCode,
    templateVersion: response.templateVersion,
    status: response.status as DocumentStatus,
    sourceSnapshot: response.sourceSnapshot,
    createdBy: response.createdBy,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    approvedAt: response.approvedAt,
    contentJson: response.contentJson,
    docxStorageKey: response.docxStorageKey,
    pdfStorageKey: response.pdfStorageKey,
    version: response.version,
  };
}

/** Body of `POST /cases/{id}/documents/generate` (guide §12) — only `HearingProtocol` is implemented so far. */
export interface GenerateDocumentInput {
  documentType: "HearingProtocol";
  hearingId: string;
  templateCode: string;
  templateVersion: string | null;
}

/** `202` response of `POST /cases/{id}/documents/generate` (guide §12). */
export interface GenerateDocumentAccepted {
  documentId: string;
  jobId: string;
  status: string;
}

/**
 * Queues protocol generation (guide §12 `POST /cases/{id}/documents/generate`,
 * `202`). Many server-side preconditions — approved+locked canonical
 * transcript, active Judge+Secretary participants, hearing start/end times,
 * ≥1 verified sourced event, an active template — each surfaces as its own
 * `409` code (`CANONICAL_TRANSCRIPT_NOT_APPROVED`, `JUDGE_PARTICIPANT_REQUIRED`,
 * `SECRETARY_PARTICIPANT_REQUIRED`, `VERIFIED_EVENTS_REQUIRED`,
 * `ACTIVE_TEMPLATE_REQUIRED`, `HEARING_TIME_REQUIRED`) via the shared
 * `ApiError` path. Poll the returned `jobId` with `useJobPolling`, then
 * `getDocument(documentId)` once it succeeds.
 */
export async function generateDocument(
  caseId: string,
  input: GenerateDocumentInput
): Promise<GenerateDocumentAccepted> {
  const { data } = await apiClient.post<GenerateDocumentAccepted>(
    `${API_PREFIX}/cases/${caseId}/documents/generate`,
    input
  );
  return data;
}

/**
 * Reads a document in full (guide §12 `GET /documents/{id}`), including
 * `contentJson`/`sourceSnapshot`/`docxStorageKey`/`version`. `docxStorageKey`
 * stays `null` until the generate (or regeneration) job finishes.
 */
export async function getDocument(documentId: string): Promise<GeneratedDocument> {
  const { data } = await apiClient.get<DocumentResponse>(`${API_PREFIX}/documents/${documentId}`);
  return toDocument(data);
}

/**
 * Body of `PATCH /documents/{id}` (guide §12) — only allowed in `Draft`/
 * `ChangesRequested`. `status` is always sent as `null`: the endpoint cannot
 * change status, only content. Pass the *entire* `contentJson` back
 * (`fields`/`sections`/every paragraph's `sources`) — this call never merges
 * partial content server-side.
 */
export interface UpdateDocumentContentInput {
  contentJson: DocumentContent;
  status: null;
  expectedVersion: number;
}

/**
 * Edits a document's content (guide §12 `PATCH /documents/{id}`). Does
 * **not** return a regeneration `jobId` (guide §17) — the response's
 * `docxStorageKey` will still be the *old* one; callers must re-`getDocument`
 * and poll until it changes (see `use-documents.ts`'s `useDocument`
 * `pollForDocx` option). Handles `400 DOCUMENT_SOURCE_REQUIRED`,
 * `409 DOCUMENT_NOT_EDITABLE`, `409 APPROVED_DOCUMENT_IMMUTABLE`, concurrency.
 */
export async function updateDocumentContent(
  documentId: string,
  input: UpdateDocumentContentInput
): Promise<GeneratedDocument> {
  const { data } = await apiClient.patch<DocumentResponse>(
    `${API_PREFIX}/documents/${documentId}`,
    input
  );
  return toDocument(data);
}
