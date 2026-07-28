import { useState } from "react";
import { FileText, Send, Check, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { StatusBadge } from "@/shared/custom/status-badge";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { useMockQuery } from "@/shared/hooks/use-mock-query";
import {
  listDocuments,
  listVersions,
  transitionDocument,
} from "@/shared/lib/mock-api/document.service";
import { startJob } from "@/shared/lib/mock-api/job.service";
import { useJob } from "@/shared/hooks/use-job";
import { useCourtAuth } from "@/features/auth/use-court-auth";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

interface Section {
  code: string;
  title: string;
  text: string;
  origin: "template" | "ai" | "human";
  sourceSegmentIds: string[];
}

export interface ProtocolPanelProps {
  /** Only `id`/`caseId` are read — accepts either a full `Hearing` or the session-carried real one. */
  hearing: Pick<Hearing, "id" | "caseId">;
}

/**
 * Protocol (bayonnoma) view (spec FR-09, UC-06, §12). Shows the generated
 * document's sections with origin + source traceability, and drives the
 * FR-11 approval workflow. Approval/submit are never optimistic (§16.5) —
 * each action awaits the service before updating.
 */
export function ProtocolPanel({ hearing }: ProtocolPanelProps) {
  const { t } = useTranslation();
  const { can } = useCourtAuth();
  const {
    data: documents,
    isLoading,
    refetch,
  } = useMockQuery(() => listDocuments(hearing.caseId), [hearing.caseId]);
  const doc = documents?.find((d) => d.hearingId === hearing.id) ?? null;
  const { data: versions } = useMockQuery(
    () => (doc ? listVersions(doc.id) : Promise.resolve([])),
    [doc?.id]
  );
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const exportJob = useJob(exportJobId);

  if (isLoading) return <LoadingState rows={4} />;
  if (!doc) return <EmptyState description={t("protocol.noDocument")} />;

  const latest = versions?.[0];
  const sections = ((latest?.contentJson as { sections?: Section[] } | undefined)?.sections ??
    []) as Section[];

  async function act(to: "UNDER_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "EXPORTED") {
    if (!doc) return;
    try {
      await transitionDocument(doc.id, to);
      if (to === "EXPORTED") {
        const job = await startJob("docx_to_pdf", 3_000);
        setExportJobId(job.id);
      }
      refetch();
    } catch {
      notify.error(t("errors.genericTitle"));
    }
  }

  const originTone = { template: "neutral", ai: "info", human: "success" } as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="size-5 text-muted-foreground" />
        <RecordStateBadge kind="document" status={doc.status} />
        <span className="font-mono text-xs text-muted-foreground">
          {doc.templateCode} v{doc.templateVersion}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {(doc.status === "AI_GENERATED" ||
            doc.status === "DRAFT" ||
            doc.status === "CHANGES_REQUESTED") &&
            can("document.submit") && (
              <Button size="sm" onClick={() => act("UNDER_REVIEW")}>
                <Send className="size-4" />
                {t("protocol.submitReview")}
              </Button>
            )}
          {doc.status === "UNDER_REVIEW" && can("document.approve") && (
            <>
              <Button size="sm" onClick={() => act("APPROVED")}>
                <Check className="size-4" />
                {t("protocol.approve")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => act("CHANGES_REQUESTED")}>
                {t("protocol.requestChanges")}
              </Button>
            </>
          )}
          {doc.status === "APPROVED" && can("document.export") && (
            <Button size="sm" variant="outline" onClick={() => act("EXPORTED")}>
              <Download className="size-4" />
              {t("protocol.exportDoc")}
            </Button>
          )}
        </div>
      </div>

      {exportJob && exportJob.status !== "SUCCEEDED" && <Progress value={exportJob.progress} />}
      {exportJob?.status === "SUCCEEDED" && (
        <p className="text-sm text-success">{t("protocol.exported")}</p>
      )}

      {sections.map((s) => (
        <Card key={s.code}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{s.title}</CardTitle>
              <StatusBadge label={t(`protocol.origin.${s.origin}`)} tone={originTone[s.origin]} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm leading-7 text-foreground">{s.text}</p>
            {s.sourceSegmentIds.length > 0 && (
              <p className="font-mono text-xs text-muted-foreground">
                {t("protocol.sources")}: {s.sourceSegmentIds.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
