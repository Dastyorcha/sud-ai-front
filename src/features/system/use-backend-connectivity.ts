import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { showBackendUnreachable, dismissBackendUnreachable } from "@/shared/lib/toast";
import { checkBackendReachable } from "@/features/system/system.service";

/**
 * Boot-time connectivity check (handoff §4). Probes `GET /api/v1/system` once
 * on mount; on failure shows a persistent, retryable "can't reach server" toast
 * and dismisses it as soon as a probe succeeds. Non-blocking by design — it
 * never gates rendering, so the login flow still surfaces its own auth errors.
 */
export function useBackendConnectivity(): void {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  // Guard against overlapping probes (mount + a fast retry tap).
  const inFlight = useRef(false);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    let cancelled = false;

    void checkBackendReachable().then((reachable) => {
      inFlight.current = false;
      if (cancelled) return;
      if (reachable) {
        dismissBackendUnreachable();
      } else {
        showBackendUnreachable({
          title: t("system.unreachableTitle"),
          description: t("system.unreachableDescription"),
          retryLabel: t("common.retry"),
          onRetry: retry,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, retry, t]);
}
