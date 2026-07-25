import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/constants/nav-items";
import { withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  /** Optional count badge slot — e.g. open case count (wired later). */
  count?: number;
  /** Fired after navigating — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/** One sidebar nav row: icon + localized label + optional count slot. */
export function SidebarNavItem({ item, isActive, count, onNavigate }: SidebarNavItemProps) {
  const { locale, t } = useTranslation();
  const Icon = item.icon;

  return (
    <Button
      asChild
      variant="ghost"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "h-11 w-full justify-start gap-3 rounded-md px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      )}
    >
      <Link to={withLocale(locale, item.path)} onClick={onNavigate}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t(item.labelKey)}</span>
        {count !== undefined && (
          <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground tabular-nums">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
