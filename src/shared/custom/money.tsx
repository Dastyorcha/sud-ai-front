import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

export interface MoneyProps {
  /** Integer UZS amount (TZ money is always an integer). */
  value: number;
  className?: string;
}

/** Localized integer-UZS money display (`formatMoney`), tabular for alignment in tables/grids. */
export function Money({ value, className }: MoneyProps) {
  const { formatMoney } = useTranslation();

  return <span className={cn("tabular-nums", className)}>{formatMoney(value)}</span>;
}
