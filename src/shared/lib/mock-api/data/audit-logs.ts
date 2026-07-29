/**
 * Mock audit trail entries (spec FR-12) covering the fixture case's
 * lifecycle. `before`/`after` are JSON strings — the live shape (integration
 * guide §13) never decodes them server-side.
 */
import type { AuditLog } from "@/shared/types/models";

export const AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit-1",
    actorId: "cu-clerk-1",
    action: "CASE_CREATED",
    entityType: "CourtCase",
    entityId: "case-1",
    before: null,
    after: JSON.stringify({ caseNumber: "4-2101-2604/13" }),
    requestId: "req-audit-1",
    createdAt: "2026-06-04T10:00:00+05:00",
  },
  {
    id: "audit-2",
    actorId: "cu-clerk-1",
    action: "HEARING_STARTED",
    entityType: "Hearing",
    entityId: "hearing-1",
    before: JSON.stringify({ status: "CREATED" }),
    after: JSON.stringify({ status: "RECORDING" }),
    requestId: "req-audit-2",
    createdAt: "2026-07-20T10:04:00+05:00",
  },
  {
    id: "audit-3",
    actorId: "cu-clerk-1",
    action: "TRANSCRIPT_SEGMENT_UPDATED",
    entityType: "TranscriptSegment",
    entityId: "seg-4",
    before: JSON.stringify({ humanText: null }),
    after: JSON.stringify({ humanText: "…250 000 000 so'm…" }),
    requestId: "req-audit-3",
    createdAt: "2026-07-20T11:12:00+05:00",
  },
  {
    id: "audit-4",
    actorId: "cu-clerk-1",
    action: "SPEAKER_MAPPED",
    entityType: "Hearing",
    entityId: "hearing-1",
    before: JSON.stringify({ speakerLabel: "SPEAKER_02" }),
    after: JSON.stringify({ participantId: "p-1-claimant-rep" }),
    requestId: "req-audit-4",
    createdAt: "2026-07-20T11:15:00+05:00",
  },
  {
    id: "audit-5",
    actorId: "cu-clerk-1",
    action: "DOCUMENT_GENERATED",
    entityType: "GeneratedDocument",
    entityId: "doc-1",
    before: null,
    after: JSON.stringify({ templateCode: "ECONOMIC_HEARING_PROTOCOL" }),
    requestId: "req-audit-5",
    createdAt: "2026-07-20T11:30:00+05:00",
  },
];
