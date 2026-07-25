import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface ThemeToggleProps {
  className?: string;
}

/** Light/dark toggle — flips `next-themes`' resolved theme. Icon-only button
 * with an `aria-label`; the actual `.dark` class swap + persistence is
 * handled by `next-themes` (see `src/app/providers.tsx`). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("common.toggleTheme")}
      className={cn(
        "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
