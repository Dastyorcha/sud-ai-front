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
  CaseStage,
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

/**
 * A court case — the root aggregate everything else hangs off (spec §14.2).
 * Fields through `archivedAt` mirror the real `CourtCaseResponse` (integration
 * guide §8) exactly — that's what `features/cases/case.service.ts` returns.
 * The fields below `archivedAt` are mockup-only additions (dashboard card
 * parties/claim/stage) with no live-API equivalent yet; the real service
 * leaves them `undefined`, while `shared/lib/mock-api/court-case.service.ts`
 * (kept for `views/cases/case-new.tsx` until integration-11) still populates
 * them. Consumers must treat them as optional.
 */
export interface CourtCase {
  id: string;
  caseNumber: string;
  courtName: string;
  courtType: CourtType;
  caseType: CaseType;
  /** Legacy mock-only assignment; absent from the live public API contract. */
  judgeId?: string | null;
  status: CaseStatus;
  /** Free-text case description (guide §8, ≤4000 chars server-side). */
  description: string | null;
  /** Demo/seed flag (guide §8) — distinct from the mock's `isDemo`-less fixtures. */
  isDemo: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;

  /** Procedural stage for the dashboard card/filter (mockup — see `CASE_STAGE`). Not in the live API response. */
  stage?: CaseStage;
  /** Short description of the dispute, shown on the dashboard card (mockup — prefer `description` for real data). */
  subject?: string;
  /** Claimant display name for the "X vs Y" card heading (mockup); `null`/`undefined` if not yet set. */
  claimantName?: string | null;
  /** Defendant display name for the "X vs Y" card heading (mockup); `null`/`undefined` if not yet set. */
  defendantName?: string | null;
  /** Integer UZS claim amount shown on the card (mockup `Money`); `null`/`undefined` when not applicable. */
  claimAmount?: number | null;
  /** Free-form structured extras (mockup `metadata JSONB`). Not in the live API response. */
  metadata?: Record<string, unknown>;
  participantCount?: number;
}

/**
 * A party or actor attached to a case with a procedural role (spec §14.3).
 * Mirrors the real `ParticipantResponse` (integration guide §8):
 * `courtCaseId`/`language`/`isActive`/`updatedAt` replace the mock's former
 * `caseId`/`languagePreferences`/`voiceReferenceUri`.
 */
export interface Participant {
  id: string;
  courtCaseId: string;
  displayName: string;
  organizationName: string | null;
  role: ParticipantRole;
  /** Identity payload (passport, TIN, etc.) — kept opaque (spec §14.3 `identifier JSONB`). */
  identifier: Record<string, unknown>;
  /** Primary spoken language for STT (guide §8) — a single code, e.g. `"uz"`. */
  language: string;
  /** `false` once soft-deleted via `DELETE /participants/{id}` (guide §8, §17). */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A single sitting of a case; owns audio and transcript (spec §14.4).
 * `scheduledAt` is nullable and `version` is present (integration guide §9,
 * §16 optimistic concurrency) to match the real `HearingResponse` returned by
 * `features/hearings/hearing.service.ts`; `version` is `undefined` for the
 * mock layer's hearings (`shared/lib/mock-api/hearing.service.ts`), which
 * doesn't model concurrency tokens.
 */
export interface Hearing {
  id: string;
  caseId: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: HearingStatus;
  liveSttProvider: string | null;
  liveSttModel: string | null;
  finalSttProvider: string | null;
  finalSttModel: string | null;
  audioDurationMs: number;
  createdBy: string;
  /** Optimistic-concurrency token (guide §16) — real hearings only. */
  version?: number;
  /** Persisted server state, so upload/transcription recovery survives refreshes. */
  hasAudio?: boolean;
  transcriptionJobId?: string | null;
}

/** A recorded audio channel for a hearing (spec §14.5, guide §9 `AudioTrackResponse`). */
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
 * One utterance segment of the transcript (spec §14.6, guide §9/§10
 * `GET /hearings/{id}/transcript`, `transcript-segments` PATCH/verify).
 * Layers are preserved, never overwritten (spec §10.1): raw ASR →
 * normalized → human edit → canonical. `version` is the per-segment
 * optimistic-concurrency token (guide §16) — `undefined` for the mock
 * layer's segments (`shared/lib/mock-api/transcript.service.ts`), which
 * doesn't model it.
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
  /** Optimistic-concurrency token (guide §16) — real segments only. */
  version?: number;
}

/**
 * A structured procedural event extracted from the transcript (spec §14.7, §11).
 * `sourceSegmentIds` is mandatory and non-empty — an event without a source is a
 * contract violation the UI must surface as an error, never render as data.
 * Fields through `createdAt` mirror the real `ProceduralEventResponse`
 * (integration guide §11) exactly — that's what
 * `features/events/event.service.ts` (the sole producer/consumer since
 * integration-11 deleted the unused mock event service) returns. `version` is
 * present (guide §16 optimistic concurrency) on every event.
 * The fields below `createdAt` are legacy mockup-only additions with no
 * live-API equivalent — always `undefined` now.
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
  reviewStatus: EventReviewStatus;
  /** Optimistic-concurrency token (guide §16) — real events only. */
  version?: number;
  createdAt: string;

  /** Mock-layer-only (spec §14.7) — not in the real `ProceduralEventResponse`. */
  requiresHumanReview?: boolean;
  verifiedBy?: string | null;
  /** STT/LLM model + prompt version metadata (spec §14.7 `model_metadata JSONB`) — mock-layer-only. */
  modelMetadata?: Record<string, unknown>;
}

/**
 * A legal-expert-approved document template in the catalogue (spec §13.2).
 * Fields through `approvedAt` are the mock layer's shape. `isActive`/
 * `storageKey` mirror the real `DocumentTemplateResponse` (integration guide
 * §12 `POST`/`GET /document-templates`) — `undefined` for mock templates.
 * `storageKey` is a private backend reference, **never** render it as a URL
 * (guide §12).
 */
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
  /** `true`/`false` (real API only, guide §12) — the generate form only lists `isActive: true` templates. */
  isActive?: boolean;
  /** Private backend storage reference (real API only, guide §12) — never a public URL. */
  storageKey?: string;
  createdAt?: string;
}

/**
 * A single traceability pointer from a generated field/paragraph back to its
 * source record (integration guide §12 `contentJson.sources[]`). `type` is a
 * backend-defined discriminator (e.g. `"TranscriptSegment"`/
 * `"ProceduralEvent"`); `path` optionally narrows into that source (e.g. a
 * JSON pointer). Every paragraph/field must carry ≥1 — an edit that drops
 * `sources` breaks server-side approval (guide §12 design notes).
 */
export interface DocumentSource {
  type: string;
  id: string;
  path?: string;
}

/** One key/value slot of `contentJson.fields[]` (guide §12) — e.g. case number, hearing date. */
export interface DocumentField {
  key: string;
  value: string;
  sources: DocumentSource[];
}

/** One paragraph of a `contentJson.sections[].paragraphs[]` entry (guide §12). `sources` must stay non-empty. */
export interface DocumentParagraph {
  paragraphId: string;
  text: string;
  sources: DocumentSource[];
}

/** One section of `contentJson.sections[]` (guide §12) — a named group of paragraphs. */
export interface DocumentSection {
  sectionKey: string;
  paragraphs: DocumentParagraph[];
}

/**
 * The exact `contentJson` schema a generated document's content is stored
 * and edited as (integration guide §12 design notes). Preserve `fields`/
 * `sections`/`sources` verbatim on every edit — `PATCH /documents/{id}` only
 * accepts this shape, and every paragraph needs ≥1 source.
 */
export interface DocumentContent {
  schemaVersion: string;
  documentType: DocumentType;
  fields: DocumentField[];
  sections: DocumentSection[];
}

/**
 * A document produced from a template + verified sources (spec §14.9).
 * Fields through `approvedAt` mirror the mock layer's shape (`currentVersionNo`
 * mock-only). `contentJson`/`docxStorageKey`/`pdfStorageKey`/`version`
 * mirror the real `DocumentResponse` (integration guide §12
 * `GET /documents/{id}`) — `undefined` for mock documents, which don't model
 * concurrency or the structured content schema. `docxStorageKey` stays
 * `null` until the generate/regeneration job finishes; `pdfStorageKey` is set
 * only once `status === "Exported"`. Both are private backend references,
 * never rendered as URLs (guide §12).
 */
export interface GeneratedDocument {
  id: string;
  caseId: string;
  hearingId: string | null;
  documentType: DocumentType;
  templateCode: string;
  templateVersion: string | null;
  status: DocumentStatus;
  /** Immutable snapshot of the inputs used at generation time (spec §14.9). */
  sourceSnapshot: Record<string, unknown>;
  currentVersionNo?: number;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt: string | null;

  /** Structured editable content (real API only, guide §12) — see `DocumentContent`. */
  contentJson?: DocumentContent;
  /** Private storage reference for the generated DOCX (real API only, guide §12); `null` until ready. */
  docxStorageKey?: string | null;
  /** Private storage reference for the exported PDF (real API only, guide §12); `null` until `status === "Exported"`. */
  pdfStorageKey?: string | null;
  /** Optimistic-concurrency token (guide §16) — real documents only. */
  version?: number;
}

/** An immutable revision of a generated document (spec §14.10) — the mock layer's shape. */
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

/**
 * One entry of a document's real change history (integration guide §12
 * `GET /documents/{id}/versions`) — newest-first. Distinct from the mock
 * layer's `DocumentVersion` (no per-version `contentJson`/docx/pdf snapshot
 * in the real response, just the change record).
 */
export interface DocumentVersionHistoryEntry {
  id: string;
  documentId: string;
  versionNo: number;
  status: DocumentStatus;
  /** Backend-defined change kind, e.g. `"Generated"`/`"ContentEdited"`/`"StatusChanged"` (guide §12). */
  changeType: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

/**
 * An audit trail entry (spec §12, FR-12; integration guide §13). `actorId`
 * is `null` for system-initiated entries. `before`/`after` are nullable
 * **JSON strings**, not parsed objects — the API never decodes them; parse
 * with a guarded `try/catch` only when rendering a structured diff, and fall
 * back to the raw string on parse failure (never assume they're objects).
 */
export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: string | null;
  after: string | null;
  requestId: string;
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
