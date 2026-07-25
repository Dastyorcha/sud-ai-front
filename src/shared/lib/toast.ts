import { toast as sonnerToast } from "sonner";

/**
 * Typed toast helpers over `sonner` (TZ §16.3) — the single entry point for
 * app toasts so tone/duration stay consistent. Callers pass already-localized
 * strings (resolve via `t()` upstream); for error toasts pair with
 * `errorMessageKey` from `@/shared/lib/errors/error-map`.
 *
 * Usage: `notify.success(t("caseDetail.recalculated"))`.
 */
export const notify = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
  warning: (message: string) => sonnerToast.warning(message),
} as const;
