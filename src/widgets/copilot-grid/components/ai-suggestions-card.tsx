import { Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/custom/empty-state";
import { appendToSection } from "@/features/document-fill/document-append-bus";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";
import type { CopilotSuggestion } from "@/shared/types/copilot";
import { cn } from "@/shared/lib/utils";

export interface AiSuggestionsCardProps {
  suggestions: CopilotSuggestion[];
  className?: string;
}

/**
 * AI conclusions & recommendations (mockup-07) — "Hujjatga qo'shish" pushes
 * the suggestion text into the document editor's "III. Asoslantiruvchi"
 * section via `document-append-bus` (queued if no editor is mounted) and
 * confirms with a toast either way.
 */
export function AiSuggestionsCard({ suggestions, className }: AiSuggestionsCardProps) {
  const { t } = useTranslation();

  function handleAdd(suggestion: CopilotSuggestion) {
    appendToSection("reasoning", suggestion.text);
    notify.success(t("copilotGrid.suggestions.addedToast"));
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("copilotGrid.suggestions.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <EmptyState description={t("copilotGrid.suggestions.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="flex flex-col gap-2 rounded-md bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="shrink-0">
                    {suggestion.tag}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">{suggestion.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{suggestion.text}</p>
                <Button
                  size="sm"
                  variant="gold"
                  className="self-start"
                  onClick={() => handleAdd(suggestion)}
                >
                  <Plus className="size-4" />
                  {t("copilotGrid.suggestions.addToDocument")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default AiSuggestionsCard;
