import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Central error → localized-message mapping (TZ §18.3/§18.4). A real backend
 * returns a stable `code`; the UI never shows a raw code or a server string.
 * Resolve the returned key with `t()` and surface via `notify.error`.
 */

/** Known backend/domain error codes. Extend as the real API defines more. */
export type ErrorCode =
  | "validation_error"
  | "not_found"
  | "forbidden"
  | "conflict"
  | "network_error"
  | "server_error"
  | "unknown";

const CODE_MESSAGE_KEY: Record<ErrorCode, MessageKey> = {
  validation_error: "errors.codes.validation_error",
  not_found: "errors.codes.not_found",
  forbidden: "errors.codes.forbidden",
  conflict: "errors.codes.conflict",
  network_error: "errors.codes.network_error",
  server_error: "errors.codes.server_error",
  unknown: "errors.codes.unknown",
};

/** Shape a mock/real service may throw — `{ code }` drives the mapping. */
interface CodedError {
  code?: string;
}

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && value in CODE_MESSAGE_KEY;
}

/**
 * Resolves any thrown value to a localized-message key. Accepts an `ErrorCode`
 * string, a `{ code }` object, or anything else (→ `unknown`). Pass the result
 * to `t()`.
 */
export function errorMessageKey(error: unknown): MessageKey {
  if (isErrorCode(error)) return CODE_MESSAGE_KEY[error];
  if (error && typeof error === "object") {
    const code = (error as CodedError).code;
    if (isErrorCode(code)) return CODE_MESSAGE_KEY[code];
  }
  return CODE_MESSAGE_KEY.unknown;
}
