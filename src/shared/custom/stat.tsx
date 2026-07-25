import type { ReactNode } from "react";

export interface StatProps {
  label: string;
  children: ReactNode;
}

/** Label-over-value stat cell for detail/summary surfaces (e.g. a detail header). */
export function Stat({ label, children }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{children}</span>
    </div>
  );
}
