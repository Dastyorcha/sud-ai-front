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
 * Enum VALUES below either keep the mock layer's UPPER_SNAKE casing (where a
 * genuinely mock-only consumer still needs them, documented per-enum) or
 * store the real API's canonical PascalCase (integration guide §4) where the
 * enum is on the real API path. Never translated in code — only at display
 * time via `t(\`enums.*.${value}\`)`.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Application roles (spec §4) — mock-only now. The real session's five API
 * roles (guide §2/§7.4) live in `shared/constants/court-permissions.ts` as
 * `API_ROLE`/`ApiRole` (a prior plan already reconciled auth to that
 * PascalCase set independently of this enum). `COURT_ROLE` stays UPPER_SNAKE
 * for the mock `CourtUser` fixtures (`shared/lib/mock-api/data/court-users.ts`)
 * still read by `vocabulary-panel.tsx`/`case-detail.tsx`/`case-new.tsx`'s
 * judge picker (no judge-list endpoint exists, guide §17).
 */
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

/**
 * Lifecycle of a court case (integration guide §4/§8). `CourtCase.status`
 * (`shared/types/models.ts`) is one shared field type used by both the real
 * `features/cases/case.service.ts` (`Draft`…`Archived`, PascalCase) and the
 * mock `shared/lib/mock-api/court-case.service.ts` (`ACTIVE`/`ARCHIVED`,
 * UPPER_SNAKE — kept deliberately for `views/cases/case-new.tsx`, superseded
 * by the real `widgets/new-case-wizard` but still reachable). Both sets are
 * genuinely live side by side.
 */
export const CASE_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  // Real API values (guide §8).
  Draft: "Draft",
  Active: "Active",
  Completed: "Completed",
  Archived: "Archived",
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

/**
 * Procedural role of a participant (integration guide §4/§8). Real-API-only
 * type — `features/participants/participant.service.ts` and the case-create
 * wizard are the only producers/consumers — so this stores the canonical
 * PascalCase values with no mock-only alternates.
 */
export const PARTICIPANT_ROLE = {
  Judge: "Judge",
  Secretary: "Secretary",
  Claimant: "Claimant",
  ClaimantRepresentative: "ClaimantRepresentative",
  Defendant: "Defendant",
  DefendantRepresentative: "DefendantRepresentative",
  Witness: "Witness",
  Expert: "Expert",
  Interpreter: "Interpreter",
  Other: "Other",
} as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLE)[keyof typeof PARTICIPANT_ROLE];

/**
 * Hearing / session state machine (spec §17.3, FR-03). `CREATED`…`FAILED`
 * (UPPER_SNAKE) are the mock layer's values — kept deliberately: there's no
 * `GET /hearings` list/detail endpoint (guide §17), so
 * `features/hearings/use-hearings.ts` and the `protocol-workspace`/
 * `live-session` widgets stay on `shared/lib/mock-api/hearing.service.ts`.
 * `Created`…`Failed` (PascalCase) are the real API's values (integration
 * guide §9/§10) driven by `features/hearings/hearing.service.ts` and
 * rendered on the real hearing-detail route. Both sets are genuinely live
 * side by side — this isn't a temporary shim.
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
  // Real API values (guide §9/§10) — no DeviceCheck/Paused transition
  // endpoints yet (guide §17), so the real hearing flow never
  // programmatically sets those two, but they're listed for completeness.
  Created: "Created",
  DeviceCheck: "DeviceCheck",
  Recording: "Recording",
  Paused: "Paused",
  Finalizing: "Finalizing",
  Processing: "Processing",
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
 * integration-06). Both sets are genuinely live side by side: mock fixture
 * segments (`shared/lib/mock-api/data/transcript-segments.ts`, consumed by
 * the demo `speakers-panel`/`transcript-panel`) use `INTERIM`…`VERIFIED`;
 * `features/transcript/transcript.service.ts` (the real transcript editor)
 * returns `Raw`…`Canonical`.
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

/**
 * The 14-value canonical procedural event taxonomy (integration guide §11).
 * Real-API-only type — `features/events/event.service.ts` is the sole
 * producer/consumer (the mock `shared/lib/mock-api/event.service.ts` and its
 * fixture were deleted in integration-11 once nothing imported them), so
 * this stores the canonical PascalCase values with no mock-only alternates.
 */
export const PROCEDURAL_EVENT_TYPE = {
  HearingOpened: "HearingOpened",
  IdentityVerified: "IdentityVerified",
  RightsExplained: "RightsExplained",
  ClaimExplained: "ClaimExplained",
  ResponseGiven: "ResponseGiven",
  ObjectionRaised: "ObjectionRaised",
  MotionSubmitted: "MotionSubmitted",
  EvidenceSubmitted: "EvidenceSubmitted",
  QuestionAsked: "QuestionAsked",
  BreakAnnounced: "BreakAnnounced",
  HearingPostponed: "HearingPostponed",
  RulingAnnounced: "RulingAnnounced",
  HearingClosed: "HearingClosed",
  Other: "Other",
} as const;
export type ProceduralEventType =
  (typeof PROCEDURAL_EVENT_TYPE)[keyof typeof PROCEDURAL_EVENT_TYPE];

/**
 * Human review state of an extracted procedural event (integration guide
 * §11). Real-API-only type — `features/events/event.service.ts` is the sole
 * producer/consumer — so this stores the canonical `Draft`/`Verified` values
 * with no mock-only alternates (the mock layer's `PENDING_REVIEW`/`REJECTED`
 * were dropped along with the deleted mock event service).
 */
export const EVENT_REVIEW_STATUS = {
  Draft: "Draft",
  Verified: "Verified",
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

/**
 * Kinds of generated document (spec §13.1). Each sits behind a feature flag.
 * `HearingProtocol` (PascalCase) is the real API's only implemented value so
 * far (integration guide §12 `POST /cases/{id}/documents/generate`) —
 * genuinely additive alongside the mock layer's UPPER_SNAKE values (see
 * `DOCUMENT_STATUS` above for why the mock layer stays).
 */
export const DOCUMENT_TYPE = {
  HEARING_PROTOCOL: "HEARING_PROTOCOL",
  RULING: "RULING",
  COURT_ORDER: "COURT_ORDER",
  EXECUTION_WRIT: "EXECUTION_WRIT",
  // Real API value (guide §12).
  HearingProtocol: "HearingProtocol",
} as const;
export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

/**
 * Approval workflow statuses (spec FR-11). `DRAFT`…`ARCHIVED` (UPPER_SNAKE)
 * are the mock layer's values — kept deliberately: `documents-workspace`/
 * `document-editor`/`template-selector` have no case-level document-list
 * endpoint to migrate to (guide §17), so they stay on
 * `shared/lib/mock-api/document.service.ts`. `Draft`…`Exported` (PascalCase)
 * are the real API's values (integration guide §12), returned by
 * `features/documents/document.service.ts` (wired into the hearing-scoped
 * `features/protocol/protocol-panel.tsx`). Both sets are genuinely live side
 * by side. The real workflow has no `AI_GENERATED`/`ARCHIVED` step —
 * generation lands straight in `Draft`, and there's no archive transition
 * yet (guide §17).
 */
export const DOCUMENT_STATUS = {
  DRAFT: "DRAFT",
  AI_GENERATED: "AI_GENERATED",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  EXPORTED: "EXPORTED",
  ARCHIVED: "ARCHIVED",
  // Real API values (guide §12).
  Draft: "Draft",
  UnderReview: "UnderReview",
  ChangesRequested: "ChangesRequested",
  Approved: "Approved",
  Exported: "Exported",
} as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

/** Template catalogue status (spec §13.2). */
export const TEMPLATE_STATUS = {
  ACTIVE: "ACTIVE",
  DRAFT: "DRAFT",
  DEPRECATED: "DEPRECATED",
} as const;
export type TemplateStatus = (typeof TEMPLATE_STATUS)[keyof typeof TEMPLATE_STATUS];

/**
 * Background job lifecycle (spec §15 Jobs) — mock-only now
 * (`shared/lib/mock-api/job.service.ts`, still driving the demo `live-session`/
 * `protocol-workspace` finalize flow via `shared/hooks/use-job.ts`). The real
 * job poller (`shared/lib/query/use-job-polling.ts`, guide §9/§12) defines
 * its own local `Queued | Processing | Succeeded | Failed` `JobStatus` type
 * instead of importing this one, so no reconciliation is needed here.
 */
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
