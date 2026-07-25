import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { COURT_USERS } from "@/shared/lib/mock-api/data";
import type { CourtCase, Participant } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/** Case-type-specific legal phrases fed to the STT vocabulary (spec §9.7). */
const LEGAL_TERMS: Record<string, string[]> = {
  ECONOMIC_DISPUTE: ["Iqtisodiy protsessual kodeks", "da'vogar", "javobgar", "iltimosnoma"],
  DEBT_RECOVERY: ["qarzdorlik", "undiruv", "ijro varaqasi", "da'vogar", "javobgar"],
  CONTRACT_DISPUTE: ["shartnoma", "majburiyat", "da'vogar", "javobgar", "e'tiroz"],
  BANKRUPTCY: ["bankrotlik", "kreditor", "qarzdor", "tugatish"],
  OTHER: ["da'vogar", "javobgar", "iltimosnoma"],
};

export interface VocabularyPanelProps {
  courtCase: CourtCase;
  participants: Participant[];
}

/**
 * Case vocabulary panel (spec §9.7, UC-01 step 5). Auto-derives STT terms from
 * participants, court composition and case-type legal phrases, grouped by
 * origin with weights. Read-only in this increment.
 */
export function VocabularyPanel({ courtCase, participants }: VocabularyPanelProps) {
  const { t } = useTranslation();

  const groups = useMemo(() => {
    const participantTerms = participants.flatMap((p) =>
      p.organizationName && p.organizationName !== p.displayName
        ? [p.displayName, p.organizationName]
        : [p.displayName],
    );
    const judge = COURT_USERS.find((u) => u.id === courtCase.judgeId);
    const courtTerms = [courtCase.courtName, ...(judge ? [judge.fullName] : [])];
    const legalTerms = LEGAL_TERMS[courtCase.caseType] ?? LEGAL_TERMS.OTHER ?? [];

    return [
      { key: "participants" as const, terms: [...new Set(participantTerms)] },
      { key: "court" as const, terms: [...new Set(courtTerms)] },
      { key: "legal" as const, terms: legalTerms },
    ];
  }, [courtCase, participants]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vocab.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("vocab.note")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t(`vocab.groups.${group.key}`)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.terms.map((term) => (
                <Badge key={term} variant="secondary" className="font-normal">
                  {term}
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">1.0</span>
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
