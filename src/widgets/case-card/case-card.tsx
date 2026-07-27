import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { StageBadge } from "@/shared/custom/stage-badge";
import { CaseTypeTag } from "@/shared/custom/case-type-tag";
import { Money } from "@/shared/custom/money";
import { DateText } from "@/shared/custom/date-text";
import { buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { CourtCase } from "@/shared/types/models";

export interface CaseCardProps {
  courtCase: CourtCase;
}

/**
 * One case in the dashboard grid (mockup): case number + stage, "X vs Y"
 * parties, subject, type tag, claim amount and updated date. The whole card
 * is a link into the case-detail workspace.
 */
export function CaseCard({ courtCase }: CaseCardProps) {
  const { t, locale } = useTranslation();
  const { claimantName, defendantName } = courtCase;
  const parties =
    claimantName && defendantName ? `${claimantName} ${t("cases.vs")} ${defendantName}` : null;

  return (
    <Link
      to={withLocale(locale, buildRoute.caseDetail(courtCase.id))}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:border-primary/50 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <span className="font-mono text-sm font-medium text-foreground">
            {courtCase.caseNumber}
          </span>
          <StageBadge stage={courtCase.stage} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {parties && (
            <p className="text-sm font-semibold leading-snug text-foreground">{parties}</p>
          )}
          <p className="line-clamp-2 text-sm text-muted-foreground">{courtCase.subject}</p>
          <CaseTypeTag caseType={courtCase.caseType} className="w-fit" />
          <div className="flex items-center justify-between border-t border-border pt-3">
            {courtCase.claimAmount != null ? (
              <Money
                value={courtCase.claimAmount}
                className="text-sm font-medium text-foreground"
              />
            ) : (
              <span />
            )}
            <DateText value={courtCase.updatedAt} className="text-xs text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
