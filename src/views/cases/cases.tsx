import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge } from "@/shared/custom/status-badge";
import { DateText } from "@/shared/custom/date-text";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { useCases } from "@/features/cases/use-cases";
import { ROUTE_PATHS, buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Case list (spec FR-02, UC-01, §16.1 #3). Searchable table backed by the
 * mock `court-case.service`, one row per case, click opens the detail page.
 * Mirrors the `views/users` reference pattern; search is debounced (400ms)
 * because it drives a server-style re-fetch.
 */
export default function CasesView() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const filters = useMemo(() => ({ search: debouncedSearch }), [debouncedSearch]);
  const { data, isLoading, error } = useCases({ filters });
  const cases = data?.items ?? [];

  function openCase(caseId: string) {
    navigate(withLocale(locale, buildRoute.caseDetail(caseId)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t("pages.cases")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("cases.description")}</p>
        </div>
        <Button asChild>
          <Link to={withLocale(locale, ROUTE_PATHS.CASE_NEW)}>
            <Plus className="size-4" />
            {t("cases.newCase")}
          </Link>
        </Button>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("common.search")}
        className="max-w-sm"
      />

      {isLoading && <LoadingState rows={5} />}
      {error && <ErrorState />}
      {!isLoading && !error && cases.length === 0 && <EmptyState />}

      {!isLoading && !error && cases.length > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("cases.columns.caseNumber")}</TableHead>
                <TableHead>{t("cases.columns.court")}</TableHead>
                <TableHead>{t("cases.columns.type")}</TableHead>
                <TableHead>{t("cases.columns.status")}</TableHead>
                <TableHead className="text-right">{t("cases.columns.participants")}</TableHead>
                <TableHead>{t("cases.columns.updated")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((courtCase) => (
                <TableRow
                  key={courtCase.id}
                  className="cursor-pointer"
                  onClick={() => openCase(courtCase.id)}
                >
                  <TableCell className="font-mono text-sm">{courtCase.caseNumber}</TableCell>
                  <TableCell>{courtCase.courtName}</TableCell>
                  <TableCell>{t(`enums.caseType.${courtCase.caseType}` as MessageKey)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={t(`enums.caseStatus.${courtCase.status}` as MessageKey)}
                      tone={courtCase.status === "ACTIVE" ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {courtCase.participantCount}
                  </TableCell>
                  <TableCell>
                    <DateText value={courtCase.updatedAt} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
