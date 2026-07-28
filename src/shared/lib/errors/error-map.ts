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
