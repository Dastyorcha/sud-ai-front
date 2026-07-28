import { isAxiosError, type AxiosError } from "axios";

/**
 * Typed HTTP error every service throws. `code` is either the backend's
 * `ProblemDetails.code` (guide §3, e.g. `CONCURRENCY_CONFLICT`) or a status
 * fallback (`validation_error`, `unauthorized`, …) when the body is absent or
 * doesn't carry one. Never surface `title`/`detail` directly — resolve `code`
 * through `errorMessageKey()` (`src/shared/lib/errors/error-map.ts`) + `t()`.
 */
export class ApiError extends Error {
  /** HTTP status, or `0` for network/timeout failures that never reached the server. */
  readonly status: number;
  /** Backend `code` or a derived fallback — the only field the UI maps to a message. */
  readonly code: string;
  readonly title?: string;
  readonly detail?: string;
  /** `X-Request-ID` echoed by the response, for logs/support. */
  readonly requestId?: string;
  /** ASP.NET `ValidationProblemDetails.errors` — field name → messages. */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(params: {
    status: number;
    code: string;
    title?: string;
    detail?: string;
    requestId?: string;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(params.detail ?? params.title ?? params.code);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.title = params.title;
    this.detail = params.detail;
    this.requestId = params.requestId;
    this.fieldErrors = params.fieldErrors;
  }
}

/** RFC 7807 problem body, extended by the guide with a stable `code`. */
interface ProblemDetailsBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
}

/** ASP.NET `ValidationProblemDetails` — a `ProblemDetails` plus a field-error map. */
interface ValidationProblemDetailsBody extends ProblemDetailsBody {
  errors?: Record<string, string[]>;
}

/** Guide §3 status → code fallback, used only when the body has no `code`. */
function fallbackCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return "validation_error";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    default:
      return status >= 500 ? "server_error" : "unknown";
  }
}

function extractRequestId(error: AxiosError): string | undefined {
  const headers = error.response?.headers as Record<string, unknown> | undefined;
  const value = headers?.["x-request-id"];
  return typeof value === "string" ? value : undefined;
}

function isValidationProblem(body: ProblemDetailsBody): body is ValidationProblemDetailsBody {
  return (
    "errors" in body &&
    typeof (body as ValidationProblemDetailsBody).errors === "object" &&
    (body as ValidationProblemDetailsBody).errors !== null
  );
}

/**
 * Normalizes any axios rejection (or arbitrary throw) into an `ApiError`.
 * Handles: ProblemDetails with `code`, ValidationProblemDetails `errors`,
 * empty-body 401/403 (guide §3 warns bodies may be absent), and
 * network/timeout failures that never produced a response.
 */
export function parseApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return new ApiError({
      status: 0,
      code: "unknown",
      detail: error instanceof Error ? error.message : undefined,
    });
  }

  const requestId = extractRequestId(error);

  if (!error.response) {
    const isTimeout = error.code === "ECONNABORTED" || /timeout/i.test(error.message);
    return new ApiError({
      status: 0,
      code: isTimeout ? "timeout" : "network_error",
      detail: error.message,
      requestId,
    });
  }

  const { status, data } = error.response;
  const body: ProblemDetailsBody =
    data && typeof data === "object" ? (data as ProblemDetailsBody) : {};

  if (isValidationProblem(body) && body.errors) {
    return new ApiError({
      status,
      code: "validation_error",
      title: body.title,
      detail: body.detail,
      requestId,
      fieldErrors: body.errors,
    });
  }

  if (typeof body.code === "string" && body.code.length > 0) {
    return new ApiError({
      status,
      code: body.code,
      title: body.title,
      detail: body.detail,
      requestId,
    });
  }

  // Empty-body (or unmapped) error — e.g. a bodiless 401/403 (guide §3).
  return new ApiError({
    status,
    code: fallbackCodeForStatus(status),
    title: body.title,
    detail: body.detail,
    requestId,
  });
}
