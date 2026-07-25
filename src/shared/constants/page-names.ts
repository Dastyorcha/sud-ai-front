import type { RoutePathKey } from "@/shared/constants/route-paths";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Page-title message keys, keyed by `ROUTE_PATHS` key so a route and its
 * translated title stay in sync. Resolve with `t(PAGE_NAMES.KEY)` from
 * `useTranslation()` — never hardcode a page title.
 */
export const PAGE_NAMES: Record<RoutePathKey, MessageKey> = {
  DASHBOARD: "pages.dashboard",
  USERS: "pages.users",
  CASES: "pages.cases",
  CASE_NEW: "pages.cases",
  CASE_DETAIL: "pages.cases",
  HEARING_DETAIL: "pages.hearing",
  LOGIN: "pages.login",
  REGISTER: "pages.register",
  RESET_PASSWORD: "pages.resetPassword",
  SELECT_ORGANIZATION: "pages.selectOrganization",
  TOOLS: "pages.tools",
  FORBIDDEN: "pages.forbidden",
  NOT_FOUND: "pages.notFound",
  MAINTENANCE: "pages.maintenance",
};
