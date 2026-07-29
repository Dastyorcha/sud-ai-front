import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Central error → localized-message mapping (TZ §18.3/§18.4, integration guide
 * §3). The real backend returns a stable `code` — often `UPPER_SNAKE`
 * (`CONCURRENCY_CONFLICT`) — the UI never shows a raw code or a server
 * string; it's normalized to `lower_snake` and resolved with `t()`.
 */

/** Known backend/domain error codes (lower_snake — see `normalizeCode`). Extend as the API defines more. */
export type ErrorCode =
  | "validation_error"
  | "not_found"
  | "forbidden"
  | "conflict"
  | "network_error"
  | "server_error"
  | "unauthorized"
  | "timeout"
  | "concurrency_conflict"
  | "transcript_locked"
  | "case_number_exists"
  | "invalid_judge"
  | "case_archive_endpoint_required"
  | "archived_case_immutable"
  | "invalid_credentials"
  | "invalid_hearing_transition"
  | "invalid_audio_size"
  | "unsupported_audio_format"
  | "audio_signature_mismatch"
  | "hearing_audio_missing"
  | "transcript_text_required"
  | "speaker_label_required"
  | "participant_not_in_case"
  | "speaker_not_found"
  | "transcript_validation_failed"
  | "transcript_not_approved"
  | "canonical_transcript_required"
  | "invalid_event_type"
  | "event_outside_source_range"
  | "ruling_source_not_explicit"
  | "event_source_required"
  | "event_source_invalid"
  | "canonical_transcript_not_approved"
  | "judge_participant_required"
  | "secretary_participant_required"
  | "verified_events_required"
  | "active_template_required"
  | "hearing_time_required"
  | "invalid_docx_template"
  | "template_version_exists"
  | "document_source_required"
  | "document_not_editable"
  | "approved_document_immutable"
  | "docx_not_ready"
  | "invalid_document_transition"
  | "document_review_denied"
  | "document_approval_denied"
  | "change_reason_required"
  | "document_not_approved"
  | "pdf_export_already_queued"
  | "unsupported_template_format"
  | "invalid_template_size"
  | "unknown";

const CODE_MESSAGE_KEY: Record<ErrorCode, MessageKey> = {
  validation_error: "errors.codes.validation_error",
  not_found: "errors.codes.not_found",
  forbidden: "errors.codes.forbidden",
  conflict: "errors.codes.conflict",
  network_error: "errors.codes.network_error",
  server_error: "errors.codes.server_error",
  unauthorized: "errors.codes.unauthorized",
  timeout: "errors.codes.timeout",
  concurrency_conflict: "errors.codes.concurrency_conflict",
  transcript_locked: "errors.codes.transcript_locked",
  case_number_exists: "errors.codes.case_number_exists",
  invalid_judge: "errors.codes.invalid_judge",
  case_archive_endpoint_required: "errors.codes.case_archive_endpoint_required",
  archived_case_immutable: "errors.codes.archived_case_immutable",
  invalid_credentials: "errors.codes.invalid_credentials",
  invalid_hearing_transition: "errors.codes.invalid_hearing_transition",
  invalid_audio_size: "errors.codes.invalid_audio_size",
  unsupported_audio_format: "errors.codes.unsupported_audio_format",
  audio_signature_mismatch: "errors.codes.audio_signature_mismatch",
  hearing_audio_missing: "errors.codes.hearing_audio_missing",
  transcript_text_required: "errors.codes.transcript_text_required",
  speaker_label_required: "errors.codes.speaker_label_required",
  participant_not_in_case: "errors.codes.participant_not_in_case",
  speaker_not_found: "errors.codes.speaker_not_found",
  transcript_validation_failed: "errors.codes.transcript_validation_failed",
  transcript_not_approved: "errors.codes.transcript_not_approved",
  canonical_transcript_required: "errors.codes.canonical_transcript_required",
  invalid_event_type: "errors.codes.invalid_event_type",
  event_outside_source_range: "errors.codes.event_outside_source_range",
  ruling_source_not_explicit: "errors.codes.ruling_source_not_explicit",
  event_source_required: "errors.codes.event_source_required",
  event_source_invalid: "errors.codes.event_source_invalid",
  canonical_transcript_not_approved: "errors.codes.canonical_transcript_not_approved",
  judge_participant_required: "errors.codes.judge_participant_required",
  secretary_participant_required: "errors.codes.secretary_participant_required",
  verified_events_required: "errors.codes.verified_events_required",
  active_template_required: "errors.codes.active_template_required",
  hearing_time_required: "errors.codes.hearing_time_required",
  invalid_docx_template: "errors.codes.invalid_docx_template",
  template_version_exists: "errors.codes.template_version_exists",
  document_source_required: "errors.codes.document_source_required",
  document_not_editable: "errors.codes.document_not_editable",
  approved_document_immutable: "errors.codes.approved_document_immutable",
  docx_not_ready: "errors.codes.docx_not_ready",
  invalid_document_transition: "errors.codes.invalid_document_transition",
  document_review_denied: "errors.codes.document_review_denied",
  document_approval_denied: "errors.codes.document_approval_denied",
  change_reason_required: "errors.codes.change_reason_required",
  document_not_approved: "errors.codes.document_not_approved",
  pdf_export_already_queued: "errors.codes.pdf_export_already_queued",
  unsupported_template_format: "errors.codes.unsupported_template_format",
  invalid_template_size: "errors.codes.invalid_template_size",
  unknown: "errors.codes.unknown",
};

/** Shape a mock/real service may throw — `{ code }` drives the mapping. */
interface CodedError {
  code?: string;
}

/** Backend codes may arrive `UPPER_SNAKE` (guide) or already `lower_snake` (mocks/fallbacks). */
function normalizeCode(code: string): string {
  return code.toLowerCase();
}

function isErrorCode(value: string): value is ErrorCode {
  return value in CODE_MESSAGE_KEY;
}

/**
 * Resolves any thrown value to a localized-message key. Accepts an `ErrorCode`
 * string, a `{ code }` object (e.g. `ApiError`), or anything else (→
 * `unknown`). Pass the result to `t()`.
 */
export function errorMessageKey(error: unknown): MessageKey {
  const code = typeof error === "string" ? error : (error as CodedError | null)?.code;
  if (typeof code === "string") {
    const normalized = normalizeCode(code);
    if (isErrorCode(normalized)) return CODE_MESSAGE_KEY[normalized];
  }
  return CODE_MESSAGE_KEY.unknown;
}
