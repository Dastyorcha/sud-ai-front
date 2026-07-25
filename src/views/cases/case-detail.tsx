import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/custom/status-badge";
import { DateText } from "@/shared/custom/date-text";
import { DetailGrid } from "@/shared/custom/detail-grid";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { useCase } from "@/features/cases/use-case";
import { useParticipants } from "@/features/participants/use-participants";
import { COURT_USERS } from "@/shared/lib/mock-api/data";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Case detail (spec §16.1 #5, UC-01). Compact first cut: requisites +
 * participants. Hearings, documents and the vocabulary panel (Steps 4.4–4.6)
 * land in later increments. Reads `:caseId` from the route.
 */
export default function CaseDetailView() {
  const { t, locale } = useTranslation();
  const { caseId = "" } = useParams<{ caseId: string }>();
  const { data: courtCase, isLoading, error } = useCase(caseId);
  const { data: participants } = useParticipants(caseId);

  const backLink = (
    <Button variant="ghost" size="sm" asChild>
      <Link to={withLocale(locale, ROUTE_PATHS.CASES)}>
        <ChevronLeft className="size-4" />
        {t("common.back")}
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <LoadingState rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <ErrorState />
      </div>
    );
  }

  if (!courtCase) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <EmptyState
          title={t("errors.notFoundTitle")}
          description={t("errors.notFoundDescription")}
        />
      </div>
    );
  }

  const judge = COURT_USERS.find((u) => u.id === courtCase.judgeId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {backLink}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
            {courtCase.caseNumber}
          </h1>
          <StatusBadge
            label={t(`enums.caseStatus.${courtCase.status}` as MessageKey)}
            tone={courtCase.status === "ACTIVE" ? "success" : "neutral"}
          />
        </div>
        <p className="text-sm text-muted-foreground">{courtCase.courtName}</p>
      </div>

      <DetailGrid
        items={[
          {
            key: "court",
            label: t("cases.columns.court"),
            value: courtCase.courtName,
          },
          {
            key: "type",
            label: t("cases.columns.type"),
            value: t(`enums.caseType.${courtCase.caseType}` as MessageKey),
          },
          {
            key: "judge",
            label: t("enums.courtRoles.JUDGE"),
            value: judge ? judge.fullName : "—",
          },
          {
            key: "updated",
            label: t("cases.columns.updated"),
            value: <DateText value={courtCase.updatedAt} />,
          },
        ]}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t("cases.columns.participants")}</h2>
        {participants && participants.length > 0 ? (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.columns.name")}</TableHead>
                  <TableHead>{t("users.columns.role")}</TableHead>
                  <TableHead>{t("cases.columns.organization")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">{p.displayName}</TableCell>
                    <TableCell>{t(`enums.participantRole.${p.role}` as MessageKey)}</TableCell>
                    <TableCell>{p.organizationName ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}
