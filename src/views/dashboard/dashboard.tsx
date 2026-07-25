import { Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/custom/status-badge";
import { DateText } from "@/shared/custom/date-text";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { useCases } from "@/features/cases/use-cases";
import { ROUTE_PATHS, buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Dashboard as work queues, not metrics (plan Step 4.1): recent cases +
 * quick actions. Hearing/approval queues are added when those entities land.
 */
export default function Dashboard() {
  const { t, locale } = useTranslation();
  const { data, isLoading } = useCases({ pageSize: 5 });
  const recent = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("pages.dashboard")}
        </h1>
        <Button asChild>
          <Link to={withLocale(locale, ROUTE_PATHS.CASE_NEW)}>
            <Plus className="size-4" />
            {t("cases.newCase")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.recentCases")}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={withLocale(locale, ROUTE_PATHS.CASES)}>
              {t("dashboard.viewAll")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingState rows={4} />}
          {!isLoading && recent.length === 0 && <EmptyState />}
          {!isLoading && recent.length > 0 && (
            <ul className="divide-y divide-border">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link
                    to={withLocale(locale, buildRoute.caseDetail(c.id))}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {c.caseNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.courtName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        label={t(`enums.caseStatus.${c.status}` as MessageKey)}
                        tone={c.status === "ACTIVE" ? "success" : "neutral"}
                      />
                      <DateText value={c.updatedAt} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
