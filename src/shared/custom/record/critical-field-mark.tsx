import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface CriticalFieldMarkProps {
  /** Whether a human has reviewed this critical value (spec §10.3, UC-05). */
  reviewed?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Marks a critical field (F.I.Sh., date, amount, case number, …) inline so the
 * clerk can scan for what still needs checking (spec §10.3). Unreviewed marks
 * use the record-seal (destructive) colour; reviewed use attested (success).
 * The mark is a dotted underline, so colour is not the only signal.
 */
export function CriticalFieldMark({ reviewed, children, className }: CriticalFieldMarkProps) {
  return (
    <span
      data-reviewed={reviewed ? "true" : "false"}
      className={cn(
        "underline decoration-dotted underline-offset-2",
        reviewed ? "text-foreground decoration-success" : "text-destructive decoration-destructive",
        className
      )}
    >
      {children}
    </span>
  );
}
