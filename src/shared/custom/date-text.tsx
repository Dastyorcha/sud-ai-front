import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

export interface DateTextProps {
  /** ISO date string, `Date`, or epoch ms — anything `formatDate` accepts. */
  value: Date | number | string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

/** Locale-aware date display (`formatDate`), always rendered in Tashkent time. */
export function DateText({ value, options, className }: DateTextProps) {
  const { formatDate } = useTranslation();

  return <span className={cn("tabular-nums", className)}>{formatDate(value, options)}</span>;
}
