/**
 * Domain entity interfaces. These are the shapes the mock service layer
 * (`src/shared/lib/mock-api/`) returns today and a real backend would return
 * tomorrow — kept backend-shaped (ISO date strings, stable enum values) so
 * swapping the mock layer for HTTP later is a drop-in.
 */
import type {
  UserRole,
  CourtRole,
  CourtType,
  CaseType,
  CaseStatus,
  ParticipantRole,
  HearingStatus,
  SegmentStatus,
  ProceduralEventType,
  EventReviewStatus,
  DocumentType,
  DocumentStatus,
  TemplateStatus,
  JobStatus,
} from "@/shared/types/enums";

/** The tenant every other entity belongs to. */
export interface Organization {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}

/** A user within an organization — the example CRUD entity for this template. */
export interface User {
  id: string;
  organizationId: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

/* ────────────────────────────────────────────────────────────────────────
 * LexKotib AI — court-domain entities (spec §14).
 * Backend-shaped: ISO date strings, millisecond offsets as numbers, stable
 * enum values. Field names are camelCased per this repo's convention (the
 * spec's snake_case is a backend concern). The mock service layer returns
 * these today; a real API returns them tomorrow.
 * ──────────────────────────────────────────────────────────────────────── */

/** An account that can sign in and act on the system (spec §4, FR-01). */
export interface CourtUser {
  id: string;
  role: CourtRole;
  fullName: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

/** A court case — the root aggregate everything else hangs off (spec §14.2). */
export interface CourtCase {
  id: string;
  caseNumber: string;
  courtName: string;
  courtType: CourtType;
  caseType: CaseType;
  judgeId: string | null;
  status: CaseStatus;
  /** Free-form structured extras (spec §14.2 `metadata JSONB`). */
  metadata: Record<string, unknown>;
  participantCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

/** A party or actor attached to a case with a procedural role (spec §14.3). */
export interface Participant {
  id: string;
  caseId: string;
  displayName: string;
  organizationName: string | null;
  role: ParticipantRole;
  /** Identity payload (passport, TIN, etc.) — kept opaque (spec §14.3 `identifier JSONB`). */
  identifier: Record<string, unknown>;
  languagePreferences: string[];
  voiceReferenceUri: string | null;
  createdAt: string;
}

/** A single sitting of a case; owns audio and transcript (spec §14.4). */
export interface Hearing {
  id: string;
  caseId: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: HearingStatus;
  liveSttProvider: string | null;
  liveSttModel: string | null;
  finalSttProvider: string | null;
  finalSttModel: string | null;
  audioDurationMs: number;
  createdBy: string;
}

/** A recorded audio channel for a hearing (spec §14.5). */
export interface AudioTrack {
  id: string;
  hearingId: string;
  channelNo: number;
  mappedRole: ParticipantRole | null;
  storageUri: string;
  codec: string;
  sampleRate: number;
  checksumSha256: string;
  sizeBytes: number;
  createdAt: string;
}

/**
 * One utterance segment of the transcript (spec §14.6). Layers are preserved,
 * never overwritten (spec §10.1): raw ASR → normalized → human edit → canonical.
 */
export interface TranscriptSegment {
  id: string;
  hearingId: string;
  audioTrackId: string | null;
  providerSegmentId: string | null;
  sequenceNo: number;
  startMs: number;
  endMs: number;
  speakerLabel: string | null;
  participantId: string | null;
  rawText: string;
  normalizedText: string;
  humanText: string | null;
  canonicalText: string;
  confidence: number | null;
  status: SegmentStatus;
  isCriticalReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A structured procedural event extracted from the transcript (spec §14.7, §11).
 * `sourceSegmentIds` is mandatory and non-empty — an event without a source is a
 * contract violation the UI must surface as an error, never render as data.
 */
export interface ProceduralEvent {
  id: string;
  hearingId: string;
  eventType: ProceduralEventType;
  participantId: string | null;
  speakerRole: ParticipantRole | null;
  startMs: number;
  endMs: number;
  /** Junction `event_source_segments` (spec §14.8) flattened onto the event. */
  sourceSegmentIds: string[];
  verbatimText: string;
  normalizedSummary: string;
  confidence: number;
  requiresHumanReview: boolean;
  reviewStatus: EventReviewStatus;
  verifiedBy: string | null;
  /** STT/LLM model + prompt version metadata (spec §14.7 `model_metadata JSONB`). */
  modelMetadata: Record<string, unknown>;
  createdAt: string;
}

/** A legal-expert-approved document template in the catalogue (spec §13.2). */
export interface DocumentTemplate {
  id: string;
  templateCode: string;
  documentType: DocumentType;
  title: string;
  version: string;
  status: TemplateStatus;
  inputSchemaVersion: string;
  rulesetVersion: string;
  /** JSON Schema the generation form is rendered from (spec D-13). */
  inputSchema: Record<string, unknown>;
  fileUri: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

/** A document produced from a template + verified sources (spec §14.9). */
export interface GeneratedDocument {
  id: string;
  caseId: string;
  hearingId: string | null;
  documentType: DocumentType;
  templateCode: string;
  templateVersion: string;
  status: DocumentStatus;
  /** Immutable snapshot of the inputs used at generation time (spec §14.9). */
  sourceSnapshot: Record<string, unknown>;
  currentVersionNo: number;
  createdBy: string;
  createdAt: string;
  approvedAt: string | null;
}

/** An immutable revision of a generated document (spec §14.10). */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNo: number;
  /** Editor content (TipTap/ProseMirror JSON with source attributes). */
  contentJson: Record<string, unknown>;
  docxUri: string | null;
  pdfUri: string | null;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

/** An audit trail entry (spec §12, FR-12). */
export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

/** A long-running background job the UI polls (spec §15 Jobs, §17.4). */
export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
