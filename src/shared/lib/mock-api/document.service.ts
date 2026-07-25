/**
 * Mock document service (spec §13, §14.9/§14.10, FR-10/FR-11) — templates,
 * generated documents, versions and the approval workflow. Approval
 * transitions follow FR-11; illegal ones throw.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import {
  DOCUMENT_TEMPLATES,
  GENERATED_DOCUMENTS,
  DOCUMENT_VERSIONS,
} from "@/shared/lib/mock-api/data";
import type { DocumentTemplate, GeneratedDocument, DocumentVersion } from "@/shared/types/models";
import type { DocumentStatus } from "@/shared/types/enums";

let documents: GeneratedDocument[] = GENERATED_DOCUMENTS.map((d) => ({ ...d }));
let versions: DocumentVersion[] = DOCUMENT_VERSIONS.map((v) => ({ ...v }));

const TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ["UNDER_REVIEW"],
  AI_GENERATED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["UNDER_REVIEW"],
  APPROVED: ["EXPORTED", "ARCHIVED"],
  EXPORTED: ["ARCHIVED"],
  ARCHIVED: [],
};

export async function listTemplates(): Promise<DocumentTemplate[]> {
  await delay();
  return DOCUMENT_TEMPLATES;
}

export async function listDocuments(caseId?: string): Promise<GeneratedDocument[]> {
  await delay();
  return caseId ? documents.filter((d) => d.caseId === caseId) : documents;
}

export async function getDocument(id: string): Promise<GeneratedDocument | null> {
  await delay();
  return documents.find((d) => d.id === id) ?? null;
}

export async function listVersions(documentId: string): Promise<DocumentVersion[]> {
  await delay();
  return versions
    .filter((v) => v.documentId === documentId)
    .sort((a, b) => b.versionNo - a.versionNo);
}

/** Moves a document through the FR-11 approval workflow; throws when illegal. */
export async function transitionDocument(
  id: string,
  to: DocumentStatus,
): Promise<GeneratedDocument> {
  await delay();
  const current = documents.find((d) => d.id === id);
  if (!current) throw new Error(`Document ${id} not found`);
  if (!TRANSITIONS[current.status].includes(to)) {
    throw new Error(`Illegal transition ${current.status} -> ${to}`);
  }
  const updated: GeneratedDocument = {
    ...current,
    status: to,
    approvedAt: to === "APPROVED" ? new Date().toISOString() : current.approvedAt,
  };
  documents = documents.map((d) => (d.id === id ? updated : d));
  return updated;
}

/** Saves edited content as a new immutable version (spec §14.10). */
export async function saveDocumentVersion(
  documentId: string,
  contentJson: Record<string, unknown>,
  changeSummary: string,
): Promise<DocumentVersion> {
  await delay();
  const doc = documents.find((d) => d.id === documentId);
  if (!doc) throw new Error(`Document ${documentId} not found`);
  const versionNo = doc.currentVersionNo + 1;
  const created: DocumentVersion = {
    id: crypto.randomUUID(),
    documentId,
    versionNo,
    contentJson,
    docxUri: null,
    pdfUri: null,
    changeSummary,
    createdBy: "cu-clerk-1",
    createdAt: new Date().toISOString(),
  };
  versions = [...versions, created];
  documents = documents.map((d) =>
    d.id === documentId ? { ...d, currentVersionNo: versionNo } : d,
  );
  return created;
}
