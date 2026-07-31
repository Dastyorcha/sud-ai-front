/**
 * Real `/document-templates` calls (integration guide §12) — template
 * catalogue upload/list. `POST` is Administrator-only, `multipart/form-data`,
 * ≤10 MB, `.docx`; `GET` returns **every** version (active and inactive) —
 * callers must filter to `isActive: true` for the generate form
 * (`use-templates.ts`'s `useActiveTemplates`). `storageKey` on the response
 * is a private backend reference — never render it as a URL.
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { DocumentTemplate } from "@/shared/types/models";
import type { DocumentType } from "@/shared/types/enums";

/** `DocumentTemplateResponse` (guide §12) — the exact live shape returned by upload/list. */
export interface DocumentTemplateResponse {
  id: string;
  templateCode: string;
  documentType: string;
  title: string;
  version: string;
  isActive: boolean;
  storageKey: string;
  createdAt: string;
}

/** Maps a `DocumentTemplateResponse` to the domain `DocumentTemplate`. */
function toTemplate(response: DocumentTemplateResponse): DocumentTemplate {
  return {
    id: response.id,
    templateCode: response.templateCode,
    documentType: response.documentType as DocumentType,
    title: response.title,
    version: response.version,
    status: response.isActive ? "ACTIVE" : "DEPRECATED",
    inputSchemaVersion: "",
    rulesetVersion: "",
    inputSchema: {},
    fileUri: "",
    approvedBy: null,
    approvedAt: null,
    isActive: response.isActive,
    storageKey: response.storageKey,
    createdAt: response.createdAt,
  };
}

const MAX_TEMPLATE_SIZE_BYTES = 10 * 1024 * 1024;

/** Client-side guard mirroring the server's checks (guide §12) — never skip before uploading. */
export type TemplateValidationError = "unsupported_template_format" | "invalid_template_size";

/** Validates a file before `uploadTemplate` — returns `null` if it passes, or the failing check. */
export function validateTemplateFile(file: File): TemplateValidationError | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (extension !== "docx") return "unsupported_template_format";
  if (file.size <= 0 || file.size > MAX_TEMPLATE_SIZE_BYTES) return "invalid_template_size";
  return null;
}

/**
 * Lists every template version in the catalogue (guide §12
 * `GET /document-templates`) — active and inactive alike.
 */
export async function listTemplates(): Promise<DocumentTemplate[]> {
  const { data } = await apiClient.get<DocumentTemplateResponse[]>(
    `${API_PREFIX}/document-templates`
  );
  return data.map(toTemplate);
}

/** Body of `POST /document-templates` (guide §12, `multipart/form-data`). */
export interface UploadTemplateInput {
  templateCode: string;
  title: string;
  version: string;
  isActive: boolean;
  file: File;
}

/**
 * Uploads a new template version (guide §12 `POST /document-templates`,
 * Administrator only). Callers must run `validateTemplateFile` first — the
 * DOCX must contain the 9 required placeholders verbatim (server-checked).
 * Handles `400 INVALID_DOCX_TEMPLATE`, `409 TEMPLATE_VERSION_EXISTS`, `403`
 * via the shared `ApiError` path.
 */
export async function uploadTemplate(input: UploadTemplateInput): Promise<DocumentTemplate> {
  const form = new FormData();
  form.append("templateCode", input.templateCode);
  form.append("title", input.title);
  form.append("version", input.version);
  form.append("isActive", String(input.isActive));
  form.append("file", input.file);
  const { data } = await apiClient.post<DocumentTemplateResponse>(
    `${API_PREFIX}/document-templates`,
    form
  );
  return toTemplate(data);
}
