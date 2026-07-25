import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

export interface LoadingStateProps {
  /** Number of skeleton rows to render. */
  rows?: number;
  className?: string;
}

/** Standard loading placeholder for data views — a stack of `Skeleton` rows. */
export function LoadingState({ rows = 3, className }: LoadingStateProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)} role="status" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
