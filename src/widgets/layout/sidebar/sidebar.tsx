import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/shared/components/ui/separator";
import { APP_NAME } from "@/shared/constants/app";
import { NAV_ITEMS } from "@/shared/constants/nav-items";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { SidebarNavItem } from "./sidebar-nav-item";

interface SidebarProps {
  /** Fired after a nav row is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/** Dark app sidebar: brand, the three TZ nav sections, and a footer block.
 * Rendered as a static aside on desktop and inside a `Sheet` on mobile
 * (composed by `AppShell`). */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { locale, t } = useTranslation();
  const { pathname } = useLocation();
  const dashboardPath = withLocale(locale, ROUTE_PATHS.DASHBOARD);

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          to={dashboardPath}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            {APP_NAME.charAt(0)}
          </span>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const target = withLocale(locale, item.path);
          const isActive =
            target === dashboardPath ? pathname === target : pathname.startsWith(target);
          return (
            <SidebarNavItem
              key={item.key}
              item={item}
              isActive={isActive}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="px-4 py-3 text-xs text-sidebar-foreground/60">
        {t("common.allRightsReserved", { year: new Date().getFullYear(), app: APP_NAME })}
      </div>
    </div>
  );
}
