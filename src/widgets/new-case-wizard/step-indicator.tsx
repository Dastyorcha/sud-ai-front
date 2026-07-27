import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface StepIndicatorProps {
  /** 1-indexed current step. */
  current: number;
  /** Localized short label per step, in order. */
  labels: string[];
  className?: string;
}

/**
 * Numbered step indicator for the new-case wizard: done steps show a check,
 * the active step is highlighted gold, future steps are muted.
 */
export function StepIndicator({ current, labels, className }: StepIndicatorProps) {
  return (
    <ol className={cn("flex items-center gap-1 sm:gap-2", className)}>
      {labels.map((label, index) => {
        const step = index + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isDone && "border-gold bg-gold text-gold-foreground",
                  isActive && !isDone && "border-gold text-gold",
                  !isDone && !isActive && "border-border text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {step < labels.length && (
              <div
                className={cn("h-px flex-1", isDone ? "bg-gold" : "bg-border")}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
