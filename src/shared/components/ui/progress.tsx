import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Completion 0–100. Clamped for safety. */
  value?: number;
}

/** Minimal determinate progress bar — dependency-free (no Radix). Tokens only. */
export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
