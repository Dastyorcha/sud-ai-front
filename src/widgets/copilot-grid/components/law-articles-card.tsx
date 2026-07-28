import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/custom/empty-state";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { LawArticleRef } from "@/shared/types/copilot";
import { cn } from "@/shared/lib/utils";

export interface LawArticlesCardProps {
  lawArticles: LawArticleRef[];
  className?: string;
}

/**
 * Relevant law-article suggestions (mockup-07) — FPK/FK/IPK tag, article
 * number/title, relevance bar and a Lex.uz-shaped source footer. Demo
 * fixture data via `useCopilot`, not a live Lex.uz lookup.
 */
export function LawArticlesCard({ lawArticles, className }: LawArticlesCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("copilotGrid.lawArticles.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lawArticles.length === 0 ? (
          <EmptyState description={t("copilotGrid.lawArticles.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {lawArticles.map((article) => (
              <li key={article.id} className="flex flex-col gap-2 rounded-md bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0 font-mono">
                    {article.source}
                  </Badge>
                  <span className="truncate text-sm font-medium text-foreground">
                    {article.articleNumber} — {article.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={article.relevance} className="h-1.5" />
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                    {article.relevance}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{article.sourceNote}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default LawArticlesCard;
