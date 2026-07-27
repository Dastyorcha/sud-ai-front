import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
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
import { CASE_STAGE, CASE_TYPE, type CaseStage, type CaseType } from "@/shared/types/enums";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Case dashboard grid (mockup-02): search + type/stage filters over
 * `useCases()`, live result count, gold "Yangi ish ochish" CTA, and a
 * responsive grid of `CaseCard`s. Client-side over the mock service, mirrors
 * `views/dashboard` for the CTA/link pattern.
 */
export default function CasesView() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [caseType, setCaseType] = useState<"ALL" | CaseType>("ALL");
  const [stage, setStage] = useState<"ALL" | CaseStage>("ALL");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      ...(caseType !== "ALL" ? { caseType } : {}),
      ...(stage !== "ALL" ? { stage } : {}),
    }),
    [debouncedSearch, caseType, stage]
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
        <Button variant="gold" asChild>
          <Link to={withLocale(locale, ROUTE_PATHS.CASE_NEW)}>
            <Plus className="size-4" />
            {t("cases.newCaseCta")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("common.search")}
          className="max-w-sm"
        />
        <Select value={caseType} onValueChange={(v) => setCaseType(v as "ALL" | CaseType)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("cases.allTypes")}</SelectItem>
            {(Object.values(CASE_TYPE) as CaseType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {t(`enums.caseType.${type}` as MessageKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={(v) => setStage(v as "ALL" | CaseStage)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("cases.allStages")}</SelectItem>
            {(Object.values(CASE_STAGE) as CaseStage[]).map((s) => (
              <SelectItem key={s} value={s}>
                {t(`enums.caseStage.${s}` as MessageKey)}
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
    </div>
  );
}
