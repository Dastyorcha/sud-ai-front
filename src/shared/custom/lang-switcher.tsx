import { ChevronDown, Globe } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { LOCALES, LOCALE_LABELS, LOCALE_STORAGE_KEY, type Locale } from "@/shared/lib/i18n/locale";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/** Swaps the `:lang` segment of `pathname`, keeping the rest of the path
 * and the query string intact. */
function buildLocalePath(pathname: string, search: string, nextLocale: Locale): string {
  const segments = pathname.split("/");
  // segments[0] === "" (leading slash), segments[1] is the current :lang.
  segments[1] = nextLocale;
  return `${segments.join("/") || "/"}${search}`;
}

export interface LangSwitcherProps {
  /** Extra classes for the trigger button — e.g. to match a dark header. */
  className?: string;
}

/** Locale dropdown — switches the `:lang` route segment, preserves the
 * current page + query, and persists the choice for the next visit to `/`. */
export default function LangSwitcher({ className }: LangSwitcherProps) {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = (nextLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    if (nextLocale === locale) return;
    navigate(buildLocalePath(location.pathname, location.search, nextLocale));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("langSwitcher.changeLanguage")}
          className={cn("gap-1.5", className)}
        >
          <Globe className="size-4" aria-hidden="true" />
          <span className="uppercase">{locale}</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((item) => (
          <DropdownMenuItem
            key={item}
            onSelect={() => handleSelect(item)}
            className={cn("cursor-pointer", item === locale && "font-semibold text-primary")}
          >
            {LOCALE_LABELS[item]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
