import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, FileText, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Money } from "@/shared/custom/money";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { CourtCase } from "@/shared/types/models";
import { cn } from "@/shared/lib/utils";

export interface CaseStatsProps {
  courtCase: CourtCase;
  documentsCount: number;
  participantsCount: number;
  className?: string;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold tabular-nums text-foreground">
            {value}
          </span>
          <span className="truncate text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Four stat cards on the case-detail shell (mockup): documents, filing duration, participants, claim amount. */
export function CaseStats({
  courtCase,
  documentsCount,
  participantsCount,
  className,
}: CaseStatsProps) {
  const { t } = useTranslation();
  const durationDays = Math.max(
    0,
    Math.round((Date.now() - new Date(courtCase.createdAt).getTime()) / 86_400_000)
  );

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      <StatCard icon={FileText} label={t("caseDetail.stats.documents")} value={documentsCount} />
      <StatCard
        icon={CalendarClock}
        label={t("caseDetail.stats.duration")}
        value={t("caseDetail.stats.durationValue", { count: durationDays })}
      />
      <StatCard icon={Users} label={t("caseDetail.stats.participants")} value={participantsCount} />
      <StatCard
        icon={Wallet}
        label={t("caseDetail.stats.claimAmount")}
        value={courtCase.claimAmount != null ? <Money value={courtCase.claimAmount} /> : "—"}
      />
    </div>
  );
}
