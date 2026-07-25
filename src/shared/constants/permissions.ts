import type { UserRole } from "@/shared/types/enums";

/**
 * Example gated actions for the RBAC pattern — swap in your real actions
 * (dot-namespaced by the entity they act on, e.g. `record.*`).
 */
export const PERMISSION_ACTION = {
  recordView: "record.view",
  recordCreate: "record.create",
  recordEdit: "record.edit",
  recordDelete: "record.delete",
} as const;
export type PermissionAction = (typeof PERMISSION_ACTION)[keyof typeof PERMISSION_ACTION];

/**
 * Role × action matrix. Frontend-only gate — a real backend must be the
 * actual enforcement point; this only controls what the UI shows/enables.
 */
export const PERMISSIONS: Record<UserRole, Record<PermissionAction, boolean>> = {
  admin: {
    "record.view": true,
    "record.create": true,
    "record.edit": true,
    "record.delete": true,
  },
  editor: {
    "record.view": true,
    "record.create": true,
    "record.edit": true,
    "record.delete": false,
  },
  viewer: {
    "record.view": true,
    "record.create": false,
    "record.edit": false,
    "record.delete": false,
  },
};
