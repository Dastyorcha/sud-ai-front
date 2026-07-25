import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface DetailGridItem {
  /** Stable key for the row (field name, not display text). */
  key: string;
  label: string;
  value: ReactNode;
}

export interface DetailGridProps {
  items: DetailGridItem[];
  className?: string;
}

/** Read-only key/value grid for detail/summary views (e.g. the user detail drawer). */
export function DetailGrid({ items, className }: DetailGridProps) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <div key={item.key} className="flex flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className="text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
