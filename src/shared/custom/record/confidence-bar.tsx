import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { cn } from "@/shared/lib/utils";

/** Below this, a segment is treated as low-confidence (spec §10.3, D-05). */
const LOW_CONFIDENCE = 0.75;

export interface ConfidenceBarProps {
  /** STT confidence in the range 0..1. */
  value: number;
  className?: string;
}

/**
 * A 3px confidence meter (spec §16.3). Fill is `foreground` at ≥0.75, `warning`
 * below — but colour is never the only signal: the numeric value is exposed via
 * ARIA for screen readers.
 */
export function ConfidenceBar({ value, className }: ConfidenceBarProps) {
  const { t } = useTranslation();
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);
  const low = clamped < LOW_CONFIDENCE;

  return (
    <div
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${t("record.confidence")}: ${percent}%`}
      className={cn("h-[3px] w-full overflow-hidden rounded-full bg-border", className)}
    >
      <div
        className={cn("h-full rounded-full", low ? "bg-warning" : "bg-foreground")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
