import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { useCopilot } from "@/features/copilot/use-copilot";
import { DefectsCard } from "@/widgets/copilot-grid/components/defects-card";
import { LawArticlesCard } from "@/widgets/copilot-grid/components/law-articles-card";
import { DeadlinesCard } from "@/widgets/copilot-grid/components/deadlines-card";
import { AiSuggestionsCard } from "@/widgets/copilot-grid/components/ai-suggestions-card";

export interface CopilotGridProps {
  caseId: string;
}

/**
 * "Sudya maslahatchisi" tab (mockup-07): a 2×2 card grid — procedural
 * defects, relevant law articles, procedural deadlines and AI conclusions —
 * collapsing to a single column on narrow widths. All data is per-case
 * fixtures via `useCopilot` (mock service). Lazy-loaded from `case-detail`.
 */
export default function CopilotGrid({ caseId }: CopilotGridProps) {
  const { data, isLoading, error, refetch } = useCopilot(caseId);

  if (isLoading) return <LoadingState rows={6} />;
  if (error || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DefectsCard defects={data.defects} />
      <LawArticlesCard lawArticles={data.lawArticles} />
      <DeadlinesCard deadlines={data.deadlines} />
      <AiSuggestionsCard suggestions={data.suggestions} />
    </div>
  );
}
