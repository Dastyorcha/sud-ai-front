import { useCallback } from "react";
import { useSession } from "@/features/auth/use-session";
import type { SessionUser } from "@/features/auth/auth.service";
import { canCourt, type ApiRole, type CourtAction } from "@/shared/constants/court-permissions";

export interface UseCourtAuthResult {
  user: SessionUser | undefined;
  role: ApiRole | undefined;
  /** Capability check (spec phase-03 Step 3.4) — ask for actions, not roles. */
  can: (action: CourtAction) => boolean;
}

/**
 * Real session + capability check (integration-03), replacing the demo
 * `localStorage` role switcher. Wraps `useSession()` (`GET /auth/me`);
 * `can()`'s shape is unchanged so existing call sites (`ProtocolPanel`,
 * `AppHeader`) didn't need to change.
 */
export function useCourtAuth(): UseCourtAuthResult {
  const { user } = useSession();
  const role = user?.role;
  const can = useCallback((action: CourtAction) => (role ? canCourt(role, action) : false), [role]);
  return { user, role, can };
}
