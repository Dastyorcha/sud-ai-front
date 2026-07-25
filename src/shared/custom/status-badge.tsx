import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary-soft text-primary",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        destructive: "bg-destructive-soft text-destructive",
        info: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  /** Localized label — resolve via `t("enums…")` upstream, never free text. */
  label: string;
  icon?: LucideIcon;
  /** Background utility (e.g. `bg-risk-high`) for a leading dot indicator. */
  dotClassName?: string;
  className?: string;
}

/**
 * Generic tone-driven badge — the visual base for every enum badge
 * (`RiskBadge`, `StagePill`, `DueStatusBadge`, …). Callers map an enum ID to
 * `{ tone, label }`; this component only renders it.
 */
export function StatusBadge({
  label,
  tone,
  icon: Icon,
  dotClassName,
  className,
}: StatusBadgeProps) {
  return (
    <Badge className={cn(statusBadgeVariants({ tone }), className)}>
      {dotClassName && (
        <span className={cn("size-1.5 rounded-full", dotClassName)} aria-hidden="true" />
      )}
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {label}
    </Badge>
  );
}
