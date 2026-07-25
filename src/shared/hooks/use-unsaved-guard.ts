import { useCallback, useEffect } from "react";

export interface UseUnsavedGuardResult {
  /**
   * Returns `true` if it's safe to proceed (not dirty, or the user confirmed
   * discarding). Call from close/cancel/navigate handlers before leaving.
   */
  confirmDiscard: (message: string) => boolean;
}

/**
 * Unsaved-changes guard (TZ §18.5). While `isDirty`, a native `beforeunload`
 * prompt covers refresh / tab-close / browser-nav. For in-app navigation, call
 * the returned `confirmDiscard(message)` before navigating away.
 *
 * (This app uses `BrowserRouter`, not a data router, so router-level
 * `useBlocker` isn't available; `confirmDiscard` is the in-app equivalent.)
 */
export function useUnsavedGuard(isDirty: boolean): UseUnsavedGuardResult {
  useEffect(() => {
    if (!isDirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmDiscard = useCallback(
    (message: string) => !isDirty || window.confirm(message),
    [isDirty]
  );

  return { confirmDiscard };
}
