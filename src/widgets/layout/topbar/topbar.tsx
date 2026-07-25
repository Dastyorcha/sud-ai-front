import { LogOut, Menu } from "lucide-react";
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
import { useAuth } from "@/features/auth/use-auth";
import LangSwitcher from "@/shared/custom/lang-switcher";
import { ThemeToggle } from "@/shared/custom/theme-toggle";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

interface TopbarProps {
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

/** App topbar: mobile menu trigger, lang switcher, theme toggle, and the
 * profile menu. */
export function Topbar({ onOpenNav }: TopbarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

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

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <ThemeToggle />
        <LangSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("common.profile")}
              className="rounded-full"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="text-sm font-semibold text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">
                {t(`enums.roles.${user.role}` as MessageKey)} · {user.organizationName}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="size-4" aria-hidden="true" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
