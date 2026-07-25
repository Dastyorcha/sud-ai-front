/**
 * Core domain enums. Enum IDs are the stable technical values shared with a
 * backend; UI labels live in the i18n message tree under `enums.*` (see
 * `src/shared/lib/i18n/messages/uz.ts`) — keys mirror these exact enum
 * values, so resolve with `t(\`enums.roles.${role}\`)` etc. Never store a
 * label as a free-text value.
 */

/** Example role set for the RBAC pattern (see `shared/constants/permissions.ts`). */
export const USER_ROLE = {
  admin: "admin",
  editor: "editor",
  viewer: "viewer",
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const SORT_DIRECTION = {
  asc: "asc",
  desc: "desc",
} as const;
export type SortDirection = (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];
