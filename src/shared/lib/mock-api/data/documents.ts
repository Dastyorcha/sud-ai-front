/**
 * Mock document templates + generated documents (spec §13.2, §14.9, §14.10).
 * Templates carry an `inputSchema` the schema-driven form renders (D-13);
 * doc-1 is a protocol draft mid-approval to exercise FR-11.
 */
import type { DocumentTemplate, GeneratedDocument, DocumentVersion } from "@/shared/types/models";

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl-1",
    templateCode: "ECONOMIC_HEARING_PROTOCOL",
    documentType: "HEARING_PROTOCOL",
    title: "Sud majlisi bayonnomasi",
    version: "1.0.0",
    status: "ACTIVE",
    inputSchemaVersion: "1.0",
    rulesetVersion: "1.0",
    inputSchema: {
      fields: [
        { key: "case_number", label: "Ish raqami", source: "case", required: true },
        { key: "court_name", label: "Sud nomi", source: "case", required: true },
        { key: "hearing_date", label: "Majlis sanasi", source: "hearing", required: true },
        { key: "judge_name", label: "Sudya", source: "case", required: true },
        { key: "clerk_name", label: "Kotib", source: "user", required: true },
      ],
    },
    fileUri: "mock://templates/protocol-v1.docx",
    approvedBy: "cu-expert-1",
    approvedAt: "2026-07-01T09:00:00+05:00",
  },
  {
    id: "tpl-2",
    templateCode: "COURT_ORDER_V1",
    documentType: "COURT_ORDER",
    title: "Sud buyrug'i loyihasi",
    version: "1.0.0",
    status: "ACTIVE",
    inputSchemaVersion: "1.0",
    rulesetVersion: "1.0",
    inputSchema: {
      fields: [
        { key: "case_number", label: "Ish raqami", source: "case", required: true },
        { key: "creditor_name", label: "Undiruvchi", source: "participants", required: true },
        { key: "debtor_name", label: "Qarzdor", source: "participants", required: true },
        { key: "amount", label: "Summa", source: "transcript", required: true },
      ],
    },
    fileUri: "mock://templates/court-order-v1.docx",
    approvedBy: "cu-expert-1",
    approvedAt: "2026-07-01T09:00:00+05:00",
  },
  {
    id: "tpl-3",
    templateCode: "EXECUTION_WRIT_V1",
    documentType: "EXECUTION_WRIT",
    title: "Ijro varaqasi loyihasi",
    version: "0.9.0",
    status: "DRAFT",
    inputSchemaVersion: "1.0",
    rulesetVersion: "1.0",
    inputSchema: {
      fields: [
        { key: "case_number", label: "Ish raqami", source: "case", required: true },
        { key: "enforceable_document", label: "Ijroga asos hujjat", source: "documents", required: true },
      ],
    },
    fileUri: "mock://templates/execution-writ-v1.docx",
    approvedBy: null,
    approvedAt: null,
  },
];

export const GENERATED_DOCUMENTS: GeneratedDocument[] = [
  {
    id: "doc-1",
    caseId: "case-1",
    hearingId: "hearing-1",
    documentType: "HEARING_PROTOCOL",
    templateCode: "ECONOMIC_HEARING_PROTOCOL",
    templateVersion: "1.0.0",
    status: "AI_GENERATED",
    sourceSnapshot: { canonicalTranscriptId: "hearing-1", verifiedEventIds: ["evt-1", "evt-2", "evt-3", "evt-5", "evt-6", "evt-8"] },
    currentVersionNo: 1,
    createdBy: "cu-clerk-1",
    createdAt: "2026-07-20T11:00:00+05:00",
    approvedAt: null,
  },
];

export const DOCUMENT_VERSIONS: DocumentVersion[] = [
  {
    id: "docv-1",
    documentId: "doc-1",
    versionNo: 1,
    contentJson: {
      sections: [
        {
          code: "REQUISITES",
          title: "Sud va ish rekvizitlari",
          text: "Toshkent shahar iqtisodiy sudi. Ish № 4-2101-2604/13.",
          origin: "template",
          sourceSegmentIds: [],
        },
        {
          code: "OPENING",
          title: "Majlisning ochilishi",
          text: "Sud majlisi 2026-yil 20-iyul kuni soat 10:04 da ochiq deb e'lon qilindi.",
          origin: "ai",
          sourceSegmentIds: ["seg-1"],
        },
        {
          code: "CLAIM",
          title: "Da'vogar tushuntirishlari",
          text: "Da'vogar vakili da'vo talablarini to'liq qo'llab-quvvatlashini bildirdi (250 000 000 so'm).",
          origin: "ai",
          sourceSegmentIds: ["seg-3", "seg-4"],
        },
        {
          code: "MOTIONS",
          title: "Iltimosnomalar",
          text: "Da'vogar vakili hujjatni talab qilib olish haqida iltimosnoma bildirdi. Sud iltimosnomani qanoatlantirdi.",
          origin: "ai",
          sourceSegmentIds: ["seg-7", "seg-10"],
        },
      ],
    },
    docxUri: null,
    pdfUri: null,
    changeSummary: "AI tomonidan yaratilgan boshlang'ich loyiha",
    createdBy: "cu-clerk-1",
    createdAt: "2026-07-20T11:00:00+05:00",
  },
];
