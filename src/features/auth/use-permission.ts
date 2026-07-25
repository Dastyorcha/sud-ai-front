import { useMemo } from "react";
import { PERMISSIONS, type PermissionAction } from "@/shared/constants/permissions";
import { useAuth } from "./use-auth";

export interface UsePermissionResult {
  /** Whether the current session's role may perform `action` (TZ §3.2). */
  can: (action: PermissionAction) => boolean;
}

/**
 * Role-based permission check for the current session (`useAuth().user.role`).
 * Frontend-only gate — the backend is the real enforcement point (§3.3);
 * this only controls what the UI shows/enables.
 */
export function usePermission(): UsePermissionResult {
  const { user } = useAuth();

  return useMemo(
    () => ({
      can: (action: PermissionAction) => PERMISSIONS[user.role][action],
    }),
    [user.role]
  );
}
