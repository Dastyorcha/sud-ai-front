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
import { ApiError } from "@/shared/lib/http/api-error";
import { API_PREFIX } from "@/shared/config/env";
import type {
  DocumentContent,
  DocumentVersionHistoryEntry,
  GeneratedDocument,
} from "@/shared/types/models";
import type { DocumentStatus, DocumentType } from "@/shared/types/enums";

/** `DocumentResponse` (guide §12) — the exact live shape returned by GET/PATCH/lifecycle endpoints. */
export interface DocumentResponse {
  id: string;
  courtCaseId: string;
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
    caseId: response.courtCaseId,
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

/** Body of `POST /cases/{id}/documents/generate`. */
export interface GenerateDocumentInput {
  documentType:
    | "HearingProtocol"
    | "EconomicCassationLeaveWithoutReview"
    | "CivilDebtCourtOrder"
    | "CriminalJudgment";
  hearingId: string;
  templateCode: string;
  templateVersion: string | null;
}

/** Lists all generated documents persisted for a case, newest first. */
export async function listCaseDocuments(caseId: string): Promise<GeneratedDocument[]> {
  const { data } = await apiClient.get<DocumentResponse[]>(
    `${API_PREFIX}/cases/${caseId}/documents`
  );
  return data.map(toDocument);
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

/** Body shared by every `expectedVersion`-gated lifecycle action (guide §12/§16). */
export interface DocumentVersionGate {
  expectedVersion: number;
}

/**
 * Submits a document for review (guide §12 `POST /documents/{id}/submit-review`,
 * `Draft`/`ChangesRequested` → `UnderReview`) — requires a regenerated DOCX
 * and a valid source snapshot. Handles `409 DOCX_NOT_READY`,
 * `409 INVALID_DOCUMENT_TRANSITION`, concurrency.
 */
export async function submitDocumentReview(
  documentId: string,
  input: DocumentVersionGate
): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<DocumentResponse>(
    `${API_PREFIX}/documents/${documentId}/submit-review`,
    input
  );
  return toDocument(data);
}

/** Body of `POST /documents/{id}/request-changes` (guide §12) — `reason` must be non-empty. */
export interface RequestDocumentChangesInput extends DocumentVersionGate {
  reason: string;
}

/**
 * Requests changes on a document (guide §12
 * `POST /documents/{id}/request-changes`, Judge/Admin,
 * `UnderReview` → `ChangesRequested`). Handles `400 CHANGE_REASON_REQUIRED`,
 * `403 DOCUMENT_REVIEW_DENIED`, `409 INVALID_DOCUMENT_TRANSITION`, concurrency.
 */
export async function requestDocumentChanges(
  documentId: string,
  input: RequestDocumentChangesInput
): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<DocumentResponse>(
    `${API_PREFIX}/documents/${documentId}/request-changes`,
    input
  );
  return toDocument(data);
}

/**
 * Approves a document (guide §12 `POST /documents/{id}/approve`, Judge/Admin,
 * `UnderReview` → `Approved`) — immutable afterwards. Handles
 * `403 DOCUMENT_APPROVAL_DENIED`, `409 INVALID_DOCUMENT_TRANSITION`,
 * concurrency.
 */
export async function approveDocument(
  documentId: string,
  input: DocumentVersionGate
): Promise<GeneratedDocument> {
  const { data } = await apiClient.post<DocumentResponse>(
    `${API_PREFIX}/documents/${documentId}/approve`,
    input
  );
  return toDocument(data);
}

/** `202` response of `POST /documents/{id}/export` (guide §12). */
export interface ExportDocumentAccepted {
  jobId: string;
}

/**
 * Queues the PDF export (guide §12 `POST /documents/{id}/export`, `202`) —
 * only from `Approved`. Poll the returned `jobId` with `useJobPolling`, then
 * re-`getDocument` — on success `status` becomes `Exported` and
 * `pdfStorageKey` is set (no download endpoint for it, guide §17 — surface
 * the exported state only). Handles `409 DOCUMENT_NOT_APPROVED`,
 * `409 PDF_EXPORT_ALREADY_QUEUED`, concurrency.
 */
export async function exportDocument(
  documentId: string,
  input: DocumentVersionGate
): Promise<ExportDocumentAccepted> {
  const { data } = await apiClient.post<ExportDocumentAccepted>(
    `${API_PREFIX}/documents/${documentId}/export`,
    input
  );
  return data;
}

/**
 * Reads a document's change history (guide §12 `GET /documents/{id}/versions`),
 * newest-first — render `changeType`/`reason`/`status` per entry.
 */
export async function listDocumentVersions(
  documentId: string
): Promise<DocumentVersionHistoryEntry[]> {
  const { data } = await apiClient.get<DocumentVersionHistoryEntry[]>(
    `${API_PREFIX}/documents/${documentId}/versions`
  );
  return data;
}

/**
 * Reads a non-2xx blob response's body as a `ProblemDetails` and builds the
 * matching `ApiError` (guide §12 design notes — a blob response never parses
 * as JSON through the normal interceptor, since axios hands back a `Blob`,
 * not the parsed body). Falls back to a status-derived code if the body isn't
 * JSON (e.g. an empty 401/403).
 */
async function parseBlobError(
  status: number,
  requestId: string | undefined,
  blob: Blob
): Promise<ApiError> {
  try {
    const text = await blob.text();
    const body = text
      ? (JSON.parse(text) as { code?: string; title?: string; detail?: string })
      : {};
    if (typeof body.code === "string" && body.code.length > 0) {
      return new ApiError({
        status,
        code: body.code,
        title: body.title,
        detail: body.detail,
        requestId,
      });
    }
  } catch {
    // Not JSON — fall through to a status-derived fallback below.
  }
  const fallback =
    status === 404
      ? "not_found"
      : status === 409
        ? "conflict"
        : status >= 500
          ? "server_error"
          : "unknown";
  return new ApiError({ status, code: fallback, requestId });
}

/**
 * Downloads the generated DOCX (guide §12 `GET /documents/{id}/download`) as
 * a same-origin blob, then triggers a browser download and revokes the
 * object URL. Uses `validateStatus: () => true` so a non-2xx response still
 * resolves with its `Blob` body (rather than rejecting through the JSON-only
 * error interceptor) — see `parseBlobError`. Handles `409 DOCX_NOT_READY`.
 */
export async function downloadDocument(documentId: string, fileName: string): Promise<void> {
  const response = await apiClient.get<Blob>(`${API_PREFIX}/documents/${documentId}/download`, {
    responseType: "blob",
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    const requestId = response.headers["x-request-id"] as string | undefined;
    throw await parseBlobError(response.status, requestId, response.data);
  }

  const url = URL.createObjectURL(response.data);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
