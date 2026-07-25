import type { LucideIcon } from "lucide-react";
import NoData from "@/shared/components/ui/noData";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

/** Standard empty-data state for lists/tables — thin wrapper over `NoData`. */
export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  return <NoData title={title} description={description} icon={icon} className={className} />;
}
