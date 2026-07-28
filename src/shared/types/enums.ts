/**
 * Core domain enums. Enum IDs are the stable technical values shared with a
 * backend; UI labels live in the i18n message tree under `enums.*` (see
 * `src/shared/lib/i18n/messages/uz.ts`) — keys mirror these exact enum
 * values, so resolve with `t(\`enums.roles.${role}\`)` etc. Never store a
 * label as a free-text value.
 */

/** Example role set for the RBAC pattern (see `shared/constants/permissions.ts`). */
export const USER_ROLE = {
  admin: "admin",
  editor: "editor",
  viewer: "viewer",
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const SORT_DIRECTION = {
  asc: "asc",
  desc: "desc",
} as const;
export type SortDirection = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

/* ────────────────────────────────────────────────────────────────────────
 * LexKotib AI — court-domain enums (spec §14, FR-08, FR-11, §4).
 * Enum VALUES keep the specification's exact UPPER_SNAKE casing and are never
 * translated in code — only at display time via `t(\`enums.*.${value}\`)`.
 * Some value sets (case/court type, statuses) are provisional until the legal
 * expert freezes them; treated as stable technical values regardless.
 * ──────────────────────────────────────────────────────────────────────── */

/** Application roles (spec §4). Distinct from the template's example USER_ROLE. */
export const COURT_ROLE = {
  ADMIN: "ADMIN",
  CLERK: "CLERK",
  JUDGE: "JUDGE",
  LEGAL_EXPERT: "LEGAL_EXPERT",
  DEMO_OPERATOR: "DEMO_OPERATOR",
} as const;
export type CourtRole = (typeof COURT_ROLE)[keyof typeof COURT_ROLE];

/** Type of court hearing the case belongs to (spec §14.2 `court_type`). Provisional. */
export const COURT_TYPE = {
  ECONOMIC: "ECONOMIC",
  CIVIL: "CIVIL",
  CRIMINAL: "CRIMINAL",
  ADMINISTRATIVE: "ADMINISTRATIVE",
} as const;
export type CourtType = (typeof COURT_TYPE)[keyof typeof COURT_TYPE];

/**
 * Category of the case (spec §14.2 `case_type`). Provisional.
 * `CIVIL` and `SPECIAL` were added additively for the new-case wizard's
 * "case kind" step (mockup-03: Fuqarolik / Iqtisodiy / Maxsus), reusing the
 * existing `ECONOMIC_DISPUTE` value for "Iqtisodiy".
 */
export const CASE_TYPE = {
  ECONOMIC_DISPUTE: "ECONOMIC_DISPUTE",
  DEBT_RECOVERY: "DEBT_RECOVERY",
  CONTRACT_DISPUTE: "CONTRACT_DISPUTE",
  BANKRUPTCY: "BANKRUPTCY",
  CIVIL: "CIVIL",
  SPECIAL: "SPECIAL",
  OTHER: "OTHER",
} as const;
export type CaseType = (typeof CASE_TYPE)[keyof typeof CASE_TYPE];

/** Lifecycle of a court case (spec FR-02). */
export const CASE_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type CaseStatus = (typeof CASE_STATUS)[keyof typeof CASE_STATUS];

/**
 * Procedural stage of a case within its lifecycle (mockup dashboard —
 * qabul/tayyorgarlik/sudkorishi/qaror/apellyatsiya/ijro). Distinct from
 * `CaseStatus` (active/archived): a case stays `ACTIVE` while moving through
 * every stage below. Provisional until the legal expert freezes the taxonomy.
 */
export const CASE_STAGE = {
  INTAKE: "INTAKE",
  PREPARATION: "PREPARATION",
  HEARING: "HEARING",
  DECISION: "DECISION",
  APPEAL: "APPEAL",
  EXECUTION: "EXECUTION",
} as const;
export type CaseStage = (typeof CASE_STAGE)[keyof typeof CASE_STAGE];

/** Procedural role of a participant (spec §9.6, §11.2). */
export const PARTICIPANT_ROLE = {
  JUDGE: "JUDGE",
  CLERK: "CLERK",
  CLAIMANT: "CLAIMANT",
  CLAIMANT_REPRESENTATIVE: "CLAIMANT_REPRESENTATIVE",
  DEFENDANT: "DEFENDANT",
  DEFENDANT_REPRESENTATIVE: "DEFENDANT_REPRESENTATIVE",
  THIRD_PARTY: "THIRD_PARTY",
  WITNESS: "WITNESS",
  EXPERT: "EXPERT",
  INTERPRETER: "INTERPRETER",
  PROSECUTOR: "PROSECUTOR",
  OTHER: "OTHER",
} as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLE)[keyof typeof PARTICIPANT_ROLE];

/**
 * Hearing / session state machine (spec §17.3, FR-03). `CREATED`…`FAILED`
 * (UPPER_SNAKE) are the mock layer's values, still used by the demo-only
 * live/protocol/events flows. `Created`…`Failed` (PascalCase) are the real
 * API's values (integration guide §9) driven by `features/hearings/hearing.service.ts`
 * — additive, not a rename, so both layers type-check side by side until
 * integration-11 reconciles casing and deletes the mock layer.
 */
export const HEARING_STATUS = {
  CREATED: "CREATED",
  DEVICE_CHECK: "DEVICE_CHECK",
  RECORDING: "RECORDING",
  PAUSED: "PAUSED",
  FINALIZING: "FINALIZING",
  PROCESSING: "PROCESSING",
  READY_FOR_REVIEW: "READY_FOR_REVIEW",
  APPROVED: "APPROVED",
  FAILED: "FAILED",
  // Real API values (guide §9) — no DeviceCheck/Paused transition endpoints
  // yet (guide §17), so the real hearing flow never programmatically sets
  // those two, but they're listed for completeness/exhaustiveness.
  Created: "Created",
  DeviceCheck: "DeviceCheck",
  Recording: "Recording",
  Paused: "Paused",
  Finalizing: "Finalizing",
  RealFailed: "Failed",
  // Real API values reached only once transcript review/approve exist
  // (integration-06, guide §10) — `ReadyForReview` is the state the
  // `HEARING_NOT_READY_FOR_REVIEW` validate issue refers to, `Approved` is
  // set by `POST /hearings/{id}/transcript/approve`.
  ReadyForReview: "ReadyForReview",
  Approved: "Approved",
} as const;
export type HearingStatus = (typeof HEARING_STATUS)[keyof typeof HEARING_STATUS];

/**
 * Review state of a transcript segment across the layered pipeline (spec
 * §10.1). `INTERIM`…`VERIFIED` (UPPER_SNAKE) are the mock layer's values.
 * `Raw`…`Canonical` (PascalCase) are the real API's values (guide §10,
 * integration-06) — additive, not a rename, so both layers type-check side
 * by side until integration-11 reconciles casing and deletes the mock layer.
 */
export const SEGMENT_STATUS = {
  INTERIM: "INTERIM",
  FINAL: "FINAL",
  EDITED: "EDITED",
  VERIFIED: "VERIFIED",
  // Real API values (guide §10).
  Raw: "Raw",
  Normalized: "Normalized",
  HumanEdited: "HumanEdited",
  Canonical: "Canonical",
} as const;
export type SegmentStatus = (typeof SEGMENT_STATUS)[keyof typeof SEGMENT_STATUS];

/** The 17 procedural event types (spec FR-08). Order is the canonical taxonomy order. */
export const PROCEDURAL_EVENT_TYPE = {
  HEARING_OPENED: "HEARING_OPENED",
  IDENTITY_VERIFIED: "IDENTITY_VERIFIED",
  RIGHTS_EXPLAINED: "RIGHTS_EXPLAINED",
  CLAIM_EXPLAINED: "CLAIM_EXPLAINED",
  RESPONSE_GIVEN: "RESPONSE_GIVEN",
  OBJECTION_RAISED: "OBJECTION_RAISED",
  MOTION_SUBMITTED: "MOTION_SUBMITTED",
  MOTION_DISCUSSION: "MOTION_DISCUSSION",
  EVIDENCE_SUBMITTED: "EVIDENCE_SUBMITTED",
  EVIDENCE_EXAMINED: "EVIDENCE_EXAMINED",
  QUESTION_ASKED: "QUESTION_ASKED",
  ANSWER_GIVEN: "ANSWER_GIVEN",
  BREAK_ANNOUNCED: "BREAK_ANNOUNCED",
  HEARING_POSTPONED: "HEARING_POSTPONED",
  RULING_ANNOUNCED: "RULING_ANNOUNCED",
  HEARING_CLOSED: "HEARING_CLOSED",
  OTHER: "OTHER",
} as const;
export type ProceduralEventType =
  (typeof PROCEDURAL_EVENT_TYPE)[keyof typeof PROCEDURAL_EVENT_TYPE];

/** Human review state of an extracted procedural event (spec §11, §14.7). */
export const EVENT_REVIEW_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type EventReviewStatus = (typeof EVENT_REVIEW_STATUS)[keyof typeof EVENT_REVIEW_STATUS];

/** Critical fields that get special validation and highlighting (spec §10.3). */
export const CRITICAL_FIELD_TYPE = {
  PERSON_NAME: "PERSON_NAME",
  ORGANIZATION: "ORGANIZATION",
  CASE_NUMBER: "CASE_NUMBER",
  DATE: "DATE",
  TIME: "TIME",
  AMOUNT: "AMOUNT",
  PERCENT: "PERCENT",
  DOCUMENT_NUMBER: "DOCUMENT_NUMBER",
  LAW_ARTICLE: "LAW_ARTICLE",
  ADDRESS: "ADDRESS",
} as const;
export type CriticalFieldType = (typeof CRITICAL_FIELD_TYPE)[keyof typeof CRITICAL_FIELD_TYPE];

/** Kinds of generated document (spec §13.1). Each sits behind a feature flag. */
export const DOCUMENT_TYPE = {
  HEARING_PROTOCOL: "HEARING_PROTOCOL",
  RULING: "RULING",
  COURT_ORDER: "COURT_ORDER",
  EXECUTION_WRIT: "EXECUTION_WRIT",
} as const;
export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

/** Approval workflow statuses (spec FR-11). */
export const DOCUMENT_STATUS = {
  DRAFT: "DRAFT",
  AI_GENERATED: "AI_GENERATED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  EXPORTED: "EXPORTED",
  ARCHIVED: "ARCHIVED",
} as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

/** Template catalogue status (spec §13.2). */
export const TEMPLATE_STATUS = {
  ACTIVE: "ACTIVE",
  DRAFT: "DRAFT",
  DEPRECATED: "DEPRECATED",
} as const;
export type TemplateStatus = (typeof TEMPLATE_STATUS)[keyof typeof TEMPLATE_STATUS];

/** Background job lifecycle (spec §15 Jobs; exact values deferred to backend, D-09). */
export const JOB_STATUS = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/** Export formats for a generated document (spec FR-09, §13.4). */
export const EXPORT_FORMAT = {
  DOCX: "DOCX",
  PDF: "PDF",
} as const;
export type ExportFormat = (typeof EXPORT_FORMAT)[keyof typeof EXPORT_FORMAT];
