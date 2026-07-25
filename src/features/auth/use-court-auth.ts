import { useCallback, useSyncExternalStore } from "react";
import { COURT_USERS } from "@/shared/lib/mock-api/data";
import { canCourt, type CourtAction } from "@/shared/constants/court-permissions";
import type { CourtRole } from "@/shared/types/enums";
import type { CourtUser } from "@/shared/types/models";

const ROLE_KEY = "lexkotib:role";
const listeners = new Set<() => void>();

function readRole(): CourtRole {
  const raw = localStorage.getItem(ROLE_KEY);
  return raw && COURT_USERS.some((u) => u.role === raw) ? (raw as CourtRole) : "CLERK";
}

/** Demo-only role switcher: persists the active role and notifies subscribers. */
export function setCourtRole(role: CourtRole): void {
  localStorage.setItem(ROLE_KEY, role);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export interface UseCourtAuthResult {
  user: CourtUser;
  role: CourtRole;
  /** Capability check (spec phase-03 Step 3.4) — ask for actions, not roles. */
  can: (action: CourtAction) => boolean;
}

/**
 * Court session stub (spec §4, FR-01 demo accounts). The active role comes
 * from localStorage (switchable on the admin page for the demo); a real
 * login/JWT session replaces this without changing the `can()` call sites.
 */
export function useCourtAuth(): UseCourtAuthResult {
  const role = useSyncExternalStore(subscribe, readRole);
  const user = COURT_USERS.find((u) => u.role === role) ?? COURT_USERS[0]!;
  const can = useCallback((action: CourtAction) => canCourt(role, action), [role]);
  return { user, role, can };
}
