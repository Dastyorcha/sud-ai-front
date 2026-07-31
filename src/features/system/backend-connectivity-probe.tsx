import { useBackendConnectivity } from "@/features/system/use-backend-connectivity";

/**
 * Headless boot probe (handoff §4) — runs `useBackendConnectivity` and renders
 * nothing; the toast is the only surface. Mounted once inside `LocaleProvider`
 * (so `t()` resolves) in `src/app/app.tsx`.
 */
export function BackendConnectivityProbe(): null {
  useBackendConnectivity();
  return null;
}
