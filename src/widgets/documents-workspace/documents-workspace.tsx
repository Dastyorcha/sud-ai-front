import { useEffect, useMemo, useState } from "react";
import { Download, FileCheck2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { TemplateSelector } from "@/widgets/template-selector/template-selector";
import { CaseFactsPanel } from "@/widgets/case-facts-panel/case-facts-panel";
import {
  PROCEDURAL_DOCUMENT_TEMPLATES,
  type ProceduralDocumentTemplate,
} from "@/shared/constants/document-templates";
import { useCase } from "@/features/cases/use-case";
import { useParticipants } from "@/features/participants/use-participants";
import { useHearings } from "@/features/hearings/use-hearings";
import { useActiveTemplates } from "@/features/documents/use-templates";
import { useDocument, useDocuments, useGenerateDocument } from "@/features/documents/use-documents";
import { downloadDocument, type GenerateDocumentInput } from "@/features/documents/document.service";
import { useJobPolling } from "@/shared/lib/query/use-job-polling";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";

export interface DocumentsWorkspaceProps { caseId: string }

interface ReferenceTemplateConfig {
  templateCode: string;
  documentType: GenerateDocumentInput["documentType"];
  requiresOutcome: boolean;
}

const REFERENCE_TEMPLATES: Record<string, ReferenceTemplateConfig> = {
  "economic-hearing-protocol-v1": {
    templateCode: "ECONOMIC_HEARING_PROTOCOL",
    documentType: "HearingProtocol",
    requiresOutcome: false,
  },
  "economic-cassation-leave-without-review-v1": {
    templateCode: "ECONOMIC_CASSATION_LEAVE_WITHOUT_REVIEW",
    documentType: "EconomicCassationLeaveWithoutReview",
    requiresOutcome: true,
  },
  "civil-debt-court-order-v1": {
    templateCode: "CIVIL_DEBT_COURT_ORDER",
    documentType: "CivilDebtCourtOrder",
    requiresOutcome: true,
  },
  "criminal-judgment-v1": {
    templateCode: "CRIMINAL_JUDGMENT",
    documentType: "CriminalJudgment",
    requiresOutcome: true,
  },
};

/** Real source-grounded AI document factory backed by the expert reference templates. */
export default function DocumentsWorkspace({ caseId }: DocumentsWorkspaceProps) {
  const { t } = useTranslation();
  const caseQuery = useCase(caseId);
  const participantsQuery = useParticipants(caseId);
  const hearingsQuery = useHearings(caseId);
  const templatesQuery = useActiveTemplates();
  const documentsQuery = useDocuments(caseId);
  const generateMutation = useGenerateDocument(caseId);
  const [selectedTemplate, setSelectedTemplate] = useState<ProceduralDocumentTemplate | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState("");
  const [clerkName, setClerkName] = useState("");
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [outcomeText, setOutcomeText] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [objectionPeriod, setObjectionPeriod] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { isSucceeded, isFailed, job } = useJobPolling(jobId);
  const documentQuery = useDocument(documentId, { pollForDocx: true });

  const approvedHearing = useMemo(
    () => hearingsQuery.data?.find((hearing) => hearing.status === "Approved"),
    [hearingsQuery.data]
  );
  const selectedConfig = selectedTemplate ? REFERENCE_TEMPLATES[selectedTemplate.id] : undefined;
  const liveTemplate = templatesQuery.activeTemplates?.find(
    (template) => template.templateCode === selectedConfig?.templateCode
  );
  const activeParticipants = useMemo(
    () => participantsQuery.data?.filter((participant) => participant.isActive) ?? [],
    [participantsQuery.data]
  );
  const claimant = activeParticipants.find((participant) => participant.role === "Claimant");
  const defendant = activeParticipants.find((participant) => participant.role === "Defendant");

  useEffect(() => {
    if (selectedTemplate || !caseQuery.data) return;
    const preferredId = caseQuery.data.courtType === "CRIMINAL"
      ? "criminal-judgment-v1"
      : caseQuery.data.caseType === "DEBT_RECOVERY"
        ? "civil-debt-court-order-v1"
        : "economic-hearing-protocol-v1";
    const preferred = PROCEDURAL_DOCUMENT_TEMPLATES.find((item) => item.id === preferredId);
    if (preferred) setSelectedTemplate(preferred);
  }, [caseQuery.data, selectedTemplate]);

  useEffect(() => {
    const judge = activeParticipants.find((participant) => participant.role === "Judge");
    const clerk = activeParticipants.find((participant) => participant.role === "Secretary");
    if (judge && !judgeName) setJudgeName(judge.displayName);
    if (clerk && !clerkName) setClerkName(clerk.displayName);
  }, [activeParticipants, clerkName, judgeName]);

  useEffect(() => {
    if (!isSucceeded) return;
    void documentQuery.refetch();
    void documentsQuery.refetch();
    notify.success(t("documentsWorkspace.realGenerator.ready"));
    // Query objects are unstable; the job's terminal flag is the intended trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSucceeded]);

  function partyDetails(participant: typeof claimant): string {
    if (!participant) return "";
    return [participant.displayName, participant.organizationName].filter(Boolean).join(" — ");
  }

  function handleGenerate() {
    if (!selectedConfig || !liveTemplate || !approvedHearing) {
      notify.error(t("documentsWorkspace.realGenerator.missingPrerequisite"));
      return;
    }
    if (selectedConfig.documentType !== "HearingProtocol" && !judgeName.trim()) {
      notify.error(t("documentsWorkspace.realGenerator.judgeRequired"));
      return;
    }
    if (selectedConfig.requiresOutcome && !outcomeText.trim()) {
      notify.error(t("documentsWorkspace.realGenerator.outcomeRequired"));
      return;
    }
    const templateFields = Object.fromEntries(
      Object.entries({
        document_date: documentDate,
        hearing_date: approvedHearing.startedAt?.slice(0, 10) || documentDate,
        judge_name: judgeName,
        presiding_judge: judgeName,
        signing_judge_name: judgeName,
        clerk_name: clerkName,
        outcome_text: outcomeText,
        creditor_details: partyDetails(claimant),
        debtor_details: partyDetails(defendant),
        bank_details: bankDetails,
        objection_period: objectionPeriod,
      }).filter(([, value]) => value.trim().length > 0)
    );
    generateMutation.mutate(
      {
        documentType: selectedConfig.documentType,
        hearingId: approvedHearing.id,
        templateCode: liveTemplate.templateCode,
        templateVersion: liveTemplate.version,
        templateFields,
      },
      {
        onSuccess: (accepted) => {
          setDocumentId(accepted.documentId);
          setJobId(accepted.jobId);
        },
      }
    );
  }

  async function handleDownload(id: string, templateCode: string) {
    setDownloadingId(id);
    try {
      await downloadDocument(id, `${templateCode.toLowerCase()}-${id}.docx`);
    } catch {
      notify.error(t("documentsWorkspace.realGenerator.downloadFailed"));
    } finally {
      setDownloadingId(null);
    }
  }

  if (caseQuery.isLoading) return <LoadingState rows={5} />;
  if (caseQuery.error || !caseQuery.data) return <ErrorState />;
  const generated = (documentsQuery.data ?? []).filter((document) =>
    Object.values(REFERENCE_TEMPLATES).some((item) => item.templateCode === document.templateCode)
  );
  const generating = generateMutation.isPending || (Boolean(jobId) && !isSucceeded && !isFailed);
  const preview = documentQuery.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,320px)_1fr]">
        <TemplateSelector selectedId={selectedTemplate?.id ?? null} onSelect={setSelectedTemplate} supportedOnly />
        <CaseFactsPanel courtCase={caseQuery.data} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-gold" />
              {t("documentsWorkspace.realGenerator.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!approvedHearing && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{t("documentsWorkspace.realGenerator.approvedTranscriptRequired")}</p>}
            {selectedTemplate && !liveTemplate && <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{t("documentsWorkspace.realGenerator.templateUnavailable")}</p>}
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("documentsWorkspace.realGenerator.documentDate")}
              <Input type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("documentsWorkspace.realGenerator.judgeName")}
              <Input value={judgeName} onChange={(event) => setJudgeName(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("documentsWorkspace.realGenerator.clerkName")}
              <Input value={clerkName} onChange={(event) => setClerkName(event.target.value)} />
            </label>
            {selectedConfig?.requiresOutcome && (
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t("documentsWorkspace.realGenerator.outcome")}
                <Textarea rows={5} value={outcomeText} onChange={(event) => setOutcomeText(event.target.value)} placeholder={t("documentsWorkspace.realGenerator.outcomePlaceholder")} />
              </label>
            )}
            {selectedConfig?.documentType === "CivilDebtCourtOrder" && (
              <>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  {t("documentsWorkspace.realGenerator.bankDetails")}
                  <Textarea rows={3} value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  {t("documentsWorkspace.realGenerator.objectionPeriod")}
                  <Input value={objectionPeriod} onChange={(event) => setObjectionPeriod(event.target.value)} />
                </label>
              </>
            )}
            <Button variant="gold" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="size-4" />
              {generating ? t("documentsWorkspace.realGenerator.generating") : t("documentsWorkspace.realGenerator.generate")}
            </Button>
            {isFailed && <p className="text-sm text-destructive">{job?.errorMessageSafe || t("documentsWorkspace.realGenerator.failed")}</p>}
          </CardContent>
        </Card>
      </div>

      {preview?.contentJson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>{t("documentsWorkspace.realGenerator.preview")}</span>
              {preview.docxStorageKey && (
                <Button size="sm" onClick={() => handleDownload(preview.id, preview.templateCode)} disabled={downloadingId === preview.id}>
                  <Download className="size-4" />
                  {t("documentsWorkspace.realGenerator.downloadDocx")}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {preview.contentJson.sections.map((section) => (
              <section key={section.sectionKey} className="rounded-lg border border-border p-4">
                <h3 className="mb-3 font-mono text-xs font-semibold uppercase text-muted-foreground">{section.sectionKey}</h3>
                <div className="flex flex-col gap-3">
                  {section.paragraphs.map((paragraph) => (
                    <div key={paragraph.paragraphId} className="text-sm leading-6 text-foreground">
                      <p>{paragraph.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("documentsWorkspace.realGenerator.sourceCount", { count: paragraph.sources.length })}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("documentsWorkspace.realGenerator.generatedList")}</CardTitle></CardHeader>
        <CardContent>
          {generated.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <FileText className="size-8" /><p className="text-sm">{t("documentsWorkspace.realGenerator.empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {generated.map((document) => (
                <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="size-5 text-emerald-600" />
                    <div><p className="text-sm font-medium">{document.templateCode}</p><p className="text-xs text-muted-foreground">v{document.templateVersion ?? "—"} · {document.status}</p></div>
                  </div>
                  <Button size="sm" variant="outline" disabled={!document.docxStorageKey || downloadingId === document.id} onClick={() => handleDownload(document.id, document.templateCode)}>
                    <Download className="size-4" />
                    {document.docxStorageKey ? t("documentsWorkspace.realGenerator.downloadDocx") : t("documentsWorkspace.realGenerator.preparingDocx")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
