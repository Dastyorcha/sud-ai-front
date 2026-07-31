import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { CaseCard } from "@/widgets/case-card/case-card";
import { useCases } from "@/features/cases/use-cases";
import { CASE_STATUS, type CaseStatus } from "@/shared/types/enums";
import { buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

const NewCaseWizard = lazy(() => import("@/widgets/new-case-wizard/new-case-wizard"));

/** Real API case statuses only (guide §8) — `CASE_STATUS` also carries the
 * mock layer's `ACTIVE`/`ARCHIVED` values for `case-new.tsx`, which this
 * live-API filter must not surface. */
const CASE_STATUS_FILTER_VALUES = [
  CASE_STATUS.Draft,
  CASE_STATUS.Active,
  CASE_STATUS.Completed,
  CASE_STATUS.Archived,
] as const;

/**
 * Case dashboard grid (mockup-02, wired to the live API — guide §8): search
 * (→ `caseNumber` contains) + status filter over `useCases()`, live result
 * count, gold "Yangi ish ochish" CTA, and a responsive grid of `CaseCard`s.
 * `caseType`/`stage` filters were dropped — `GET /cases` only supports
 * `caseNumber`/`courtName`/`status` server-side (integration-04 design note).
 */
export default function CasesView() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | CaseStatus>("ALL");
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const filters = useMemo(
    () => ({
      caseNumber: debouncedSearch,
      ...(status !== "ALL" ? { status } : {}),
    }),
    [debouncedSearch, status]
  );
  const { data, isLoading, error } = useCases({ filters, pageSize: 100 });
  const cases = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t("pages.cases")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("cases.description")}</p>
        </div>
        <Button variant="gold" onClick={() => setWizardOpen(true)}>
          <Plus className="size-4" />
          {t("cases.newCaseCta")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("common.search")}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | CaseStatus)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("cases.allStatuses")}</SelectItem>
            {CASE_STATUS_FILTER_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`enums.caseStatus.${s}` as MessageKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isLoading && !error && (
          <span className="ml-auto self-center text-sm text-muted-foreground">
            {t("cases.resultsCount", { count: cases.length })}
          </span>
        )}
      </div>

      {isLoading && <LoadingState rows={6} />}
      {error && <ErrorState />}
      {!isLoading && !error && cases.length === 0 && <EmptyState />}

      {!isLoading && !error && cases.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cases.map((courtCase) => (
            <CaseCard key={courtCase.id} courtCase={courtCase} />
          ))}
        </div>
      )}

      {wizardOpen && (
        <Suspense fallback={null}>
          <NewCaseWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onCreated={(caseId) => {
              setWizardOpen(false);
              notify.success(t("caseWizard.createdToast"));
              navigate(withLocale(locale, buildRoute.caseDetail(caseId)));
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
