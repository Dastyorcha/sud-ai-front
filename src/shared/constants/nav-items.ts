import { LayoutDashboard, Users, Gavel, FileText, type LucideIcon } from "lucide-react";
import { ROUTE_PATHS } from "@/shared/constants/route-paths";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface NavItem {
  /** Stable key for React lists and active-state matching. */
  key: string;
  /** Message key for the visible label — resolve with `t(labelKey)`. */
  labelKey: MessageKey;
  /** Route this item links to (locale-less — pass through `withLocale()`). */
  path: string;
  /** Sidebar icon. */
  icon: LucideIcon;
}

/**
 * Primary navigation, rendered in the sidebar. Add an entry here for every
 * new product section; permission-gating (hiding items the user can't
 * access) is applied at render time, not here.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: "dashboard",
    labelKey: "nav.dashboard",
    path: ROUTE_PATHS.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    key: "cases",
    labelKey: "nav.cases",
    path: ROUTE_PATHS.CASES,
    icon: Gavel,
  },
  {
    key: "documents",
    labelKey: "nav.documents",
    path: ROUTE_PATHS.DOCUMENTS,
    icon: FileText,
  },
  {
    key: "users",
    labelKey: "nav.users",
    path: ROUTE_PATHS.USERS,
    icon: Users,
  },
] as const;
