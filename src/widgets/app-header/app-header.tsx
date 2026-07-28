import { ChevronRight, LogOut, Menu, Scale } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useCourtAuth } from "@/features/auth/use-court-auth";
import { useLogout } from "@/features/auth/use-logout";
import { APP_FULL_NAME, APP_NAME } from "@/shared/constants/app";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useCase } from "@/features/cases/use-case";
import LangSwitcher from "@/shared/custom/lang-switcher";
import { ThemeToggle } from "@/shared/custom/theme-toggle";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

interface AppHeaderProps {
  /** Opens the mobile sidebar drawer — state owned by `AppShell`. */
  onOpenNav: () => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Court app header: logo lockup, breadcrumb (dashboard → active case),
 * theme/lang controls, and the user block (avatar, name, role). Mounted by
 * `AppShell` in place of the legacy `Topbar`. */
export function AppHeader({ onOpenNav }: AppHeaderProps) {
  const { t, locale } = useTranslation();
  const { user, role } = useCourtAuth();
  const { logout } = useLogout();
  const { pathname } = useLocation();

  const caseMatch = matchPath(withLocale(locale, ROUTE_PATHS.CASE_DETAIL), pathname);
  const caseId = caseMatch?.params.caseId;
  const { data: activeCase } = useCase(caseId ?? "");
  const dashboardPath = withLocale(locale, ROUTE_PATHS.DASHBOARD);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t("common.openMenu")}
        onClick={onOpenNav}
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <Link
        to={dashboardPath}
        className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold text-gold-foreground">
          <Scale className="size-5" aria-hidden="true" />
        </span>
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-semibold text-foreground">{APP_NAME}</span>
          <span className="truncate text-xs text-muted-foreground">{APP_FULL_NAME}</span>
        </span>
      </Link>

      <nav aria-label={t("header.breadcrumbLabel")} className="ml-1 min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          <li className="min-w-0 truncate">
            {caseId ? (
              <Link
                to={dashboardPath}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground">{t("nav.dashboard")}</span>
            )}
          </li>
          {caseId ? (
            <>
              <ChevronRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <li className="min-w-0 truncate font-medium text-foreground">
                {activeCase?.caseNumber ?? caseId}
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <ThemeToggle />
        <LangSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-label={t("common.profile")}
              className="h-auto gap-2 rounded-full px-1.5 py-1"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-gold-soft text-xs font-semibold text-gold">
                  {initials(user?.fullName ?? "")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-sm font-medium text-foreground">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {role ? t(`enums.apiRoles.${role}` as MessageKey) : null}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="text-sm font-semibold text-foreground">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground">
                {role ? t(`enums.apiRoles.${role}` as MessageKey) : null}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
