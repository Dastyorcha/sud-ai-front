import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Money } from "@/shared/custom/money";
import { DateText } from "@/shared/custom/date-text";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import type { CourtCase } from "@/shared/types/models";
import { cn } from "@/shared/lib/utils";

const EVIDENCE_ITEMS = [
  "claimStatement",
  "contract",
  "paymentProof",
  "correspondence",
  "witnessStatements",
] as const;

type EvidenceItem = (typeof EVIDENCE_ITEMS)[number];

export interface CaseFactsPanelProps {
  courtCase: CourtCase;
  className?: string;
}

/**
 * "Ish ma'lumotlari" facts panel (mockup-06) — case number, parties, subject,
 * claim amount, filed date, plus a local evidence checklist (demo-only
 * state, not persisted).
 */
export function CaseFactsPanel({ courtCase, className }: CaseFactsPanelProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Record<EvidenceItem, boolean>>({
    claimStatement: true,
    contract: false,
    paymentProof: false,
    correspondence: false,
    witnessStatements: false,
  });

  const parties =
    courtCase.claimantName && courtCase.defendantName
      ? `${courtCase.claimantName} ${t("cases.vs")} ${courtCase.defendantName}`
      : "—";

  function toggle(item: EvidenceItem) {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-base">{t("documentsWorkspace.factsPanel.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">
              {t("documentsWorkspace.factsPanel.caseNumber")}
            </dt>
            <dd className="font-mono font-medium text-foreground">{courtCase.caseNumber}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{t("documentsWorkspace.factsPanel.parties")}</dt>
            <dd className="truncate text-right font-medium text-foreground">{parties}</dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="shrink-0 text-muted-foreground">
              {t("documentsWorkspace.factsPanel.subject")}
            </dt>
            <dd className="text-right text-foreground">{courtCase.subject}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">
              {t("documentsWorkspace.factsPanel.claimAmount")}
            </dt>
            <dd className="font-medium tabular-nums text-foreground">
              {courtCase.claimAmount != null ? <Money value={courtCase.claimAmount} /> : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">
              {t("documentsWorkspace.factsPanel.filedDate")}
            </dt>
            <dd className="font-medium text-foreground">
              <DateText value={courtCase.createdAt} />
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t("documentsWorkspace.factsPanel.evidenceTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("documentsWorkspace.factsPanel.evidenceHint")}
          </p>
          <ul className="flex flex-col gap-2">
            {EVIDENCE_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Checkbox
                  id={`evidence-${item}`}
                  checked={checked[item]}
                  onCheckedChange={() => toggle(item)}
                />
                <Label htmlFor={`evidence-${item}`} className="text-sm font-normal">
                  {t(`documentsWorkspace.factsPanel.evidence.${item}` as MessageKey)}
                </Label>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default CaseFactsPanel;
