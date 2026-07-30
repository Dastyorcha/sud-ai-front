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

/** Stable id so the connectivity toast is shown/dismissed as a singleton. */
const CONNECTIVITY_TOAST_ID = "backend-unreachable";

interface BackendUnreachableToast {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}

/**
 * Persistent (non-auto-dismiss) "can't reach server" toast with a retry action
 * (handoff §4). Keyed by a stable id so repeated probes update one toast rather
 * than stacking. Pair with `dismissBackendUnreachable` once the backend answers.
 */
export function showBackendUnreachable({
  title,
  description,
  retryLabel,
  onRetry,
}: BackendUnreachableToast): void {
  sonnerToast.error(title, {
    id: CONNECTIVITY_TOAST_ID,
    description,
    duration: Infinity,
    action: { label: retryLabel, onClick: onRetry },
  });
}

/** Clears the connectivity toast once the backend is reachable again. */
export function dismissBackendUnreachable(): void {
  sonnerToast.dismiss(CONNECTIVITY_TOAST_ID);
}
