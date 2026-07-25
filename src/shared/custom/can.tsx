import type { ReactNode } from "react";
import type { PermissionAction } from "@/shared/constants/permissions";
import { usePermission } from "@/features/auth/use-permission";

export interface CanProps {
  action: PermissionAction;
  children: ReactNode;
  /** Rendered instead when the current role can't perform `action`. */
  fallback?: ReactNode;
}

/** Renders `children` only if the current role can perform `action` (TZ §3.2). */
export function Can({ action, children, fallback = null }: CanProps) {
  const { can } = usePermission();

  return can(action) ? <>{children}</> : <>{fallback}</>;
}
