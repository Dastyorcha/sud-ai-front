import type { Locale } from "@/shared/lib/i18n/locale";

/**
 * Single source of truth for every route path in the panel.
 * Never hardcode a path in a <Route>/<Link>/navigate — import from here.
 * Detail routes expose both the pattern (for <Route path>) and a builder
 * (for navigation with a concrete id).
 *
 * Paths here are **locale-less** — the app mounts them all under `/:lang`
 * (see `src/app/app.tsx`). Use `withLocale()` to build a concrete, navigable
 * URL for a given locale.
 */
export const ROUTE_PATHS = {
  // Product sections (see NAV_ITEMS)
  DASHBOARD: "/",
  USERS: "/users",

  // Auth / session
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  RESET_PASSWORD: "/auth/reset-password",
  SELECT_ORGANIZATION: "/select-organization",

  // System / dev
  TOOLS: "/tools",
  FORBIDDEN: "/403",
  NOT_FOUND: "/404",
  MAINTENANCE: "/maintenance",
} as const;

export type RoutePathKey = keyof typeof ROUTE_PATHS;

/**
 * Builder for the users detail surface. The detail view is a drawer over the
 * list page, addressed by a query param (`?user=`) rather than a nested
 * route — so the list stays mounted underneath and its filters/URL state
 * persist. For same-page opens use the list's own param setter (preserves
 * other params); this builder is for cross-page navigation.
 */
export const buildRoute = {
  userDetail: (userId: string) => `${ROUTE_PATHS.USERS}?user=${userId}`,
} as const;

/** Query-param key for the user detail drawer. */
export const DETAIL_PARAM = {
  user: "user",
} as const;

/**
 * Prefixes a locale-less path (a `ROUTE_PATHS` value or a `buildRoute.*`
 * result) with the `:lang` segment, e.g. `withLocale("uz", ROUTE_PATHS.TOOLS)`
 * → `/uz/tools`. Use this for every in-app `<Link>`/`navigate()` call.
 */
export function withLocale(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
