import { useEffect, useState } from "react";
import { Check, Download, FileText, Save, Send, Sparkles, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { ErrorState } from "@/shared/custom/error-state";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { DateText } from "@/shared/custom/date-text";
import { useCourtAuth } from "@/features/auth/use-court-auth";
import { useActiveTemplates } from "@/features/documents/use-templates";
import {
  useApproveDocument,
  useDocument,
  useDocumentVersions,
  useDownloadDocument,
  useExportDocument,
  useGenerateDocument,
  useHearingDocumentId,
  useRequestDocumentChanges,
  useSubmitDocumentReview,
  useUpdateDocumentContent,
} from "@/features/documents/use-documents";
import { useJobPolling } from "@/shared/lib/query/use-job-polling";
import type { DocumentContent } from "@/shared/types/models";
import type { Hearing } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import { notify } from "@/shared/lib/toast";
import type { GenerateDocumentInput } from "@/features/documents/document.service";

export interface ProtocolPanelProps {
  /** Only `id`/`caseId` are read — accepts either a full `Hearing` or the session-carried real one. */
  hearing: Pick<Hearing, "id" | "caseId">;
}

/**
 * Protocol (bayonnoma) view over the real `/cases/{id}/documents/generate` +
 * `/documents/{id}(/*)` endpoints (integration guide §12, §16). The
 * generated document's id has no list/lookup endpoint (guide §17) — it's
 * carried in `sessionStorage` per hearing (`useHearingDocumentId`), same
 * pattern as `use-hearing-session.ts`. Content is edited as the exact
 * `contentJson` schema (`fields[]`/`sections[].paragraphs[]`, every paragraph
 * carrying `sources[]`) — edits only ever touch `value`/`text`, `sources`
 * always round-trips untouched. A `PATCH` never returns a regeneration
 * `jobId`, so `useDocument`'s `pollForDocx` re-`GET`s until the DOCX catches
 * up. Lifecycle actions are gated by both status and role
 * (`court-permissions.ts`).
 */
export function ProtocolPanel({ hearing }: ProtocolPanelProps) {
  const { t } = useTranslation();
  const { can } = useCourtAuth();
  const { activeTemplates, isLoading: templatesLoading } = useActiveTemplates();
  const [documentId, setDocumentId] = useHearingDocumentId(hearing.id);
  const [templateCode, setTemplateCode] = useState<string | null>(null);
  const [generateJobId, setGenerateJobId] = useState<string | null>(null);
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [exportJobId, setExportJobId] = useState<string | null>(null);

  const generateMutation = useGenerateDocument(hearing.caseId);
  const {
    job: generateJob,
    isSucceeded: generateSucceeded,
    isFailed: generateFailed,
  } = useJobPolling(generateJobId);
  const documentQuery = useDocument(documentId, { pollForDocx: true });
  const doc = documentQuery.data;
  const updateContentMutation = useUpdateDocumentContent(documentId ?? "");
  const downloadMutation = useDownloadDocument(documentId ?? "");
  const submitMutation = useSubmitDocumentReview(documentId ?? "");
  const requestChangesMutation = useRequestDocumentChanges(documentId ?? "");
  const approveMutation = useApproveDocument(documentId ?? "");
  const exportMutation = useExportDocument(documentId ?? "");
  const { isSucceeded: exportSucceeded, isFailed: exportFailed } = useJobPolling(exportJobId);
  const versionsQuery = useDocumentVersions(documentId);

  useEffect(() => {
    setContent(doc?.contentJson ?? null);
  }, [doc]);

  useEffect(() => {
    if (generateSucceeded) void documentQuery.refetch();
    // documentQuery is a fresh object every render — only re-run on the job's own terminal flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateSucceeded]);

  useEffect(() => {
    if (exportSucceeded) void documentQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportSucceeded]);

  const protocolTemplates = activeTemplates?.filter(
    (template) =>
      template.templateCode === "ECONOMIC_HEARING_PROTOCOL" ||
      template.templateCode === "HEARING_PROTOCOL_DEMO"
  );
  const selectedTemplate =
    protocolTemplates?.find((tpl) => tpl.templateCode === templateCode) ?? protocolTemplates?.[0];
  const generateInFlight =
    generateMutation.isPending || (Boolean(generateJobId) && !generateSucceeded && !generateFailed);

  function documentTypeForTemplate(code: string): GenerateDocumentInput["documentType"] {
    switch (code) {
      case "ECONOMIC_CASSATION_LEAVE_WITHOUT_REVIEW":
        return "EconomicCassationLeaveWithoutReview";
      case "CIVIL_DEBT_COURT_ORDER":
        return "CivilDebtCourtOrder";
      case "CRIMINAL_JUDGMENT":
        return "CriminalJudgment";
      default:
        return "HearingProtocol";
    }
  }

  function handleGenerate() {
    if (!selectedTemplate) return;
    generateMutation.mutate(
      {
        documentType: documentTypeForTemplate(selectedTemplate.templateCode),
        hearingId: hearing.id,
        templateCode: selectedTemplate.templateCode,
        templateVersion: selectedTemplate.version,
      },
      {
        onSuccess: (accepted) => {
          setDocumentId(accepted.documentId);
          setGenerateJobId(accepted.jobId);
        },
      }
    );
  }

  function updateFieldValue(key: string, value: string) {
    setContent((prev) =>
      prev
        ? { ...prev, fields: prev.fields.map((f) => (f.key === key ? { ...f, value } : f)) }
        : prev
    );
  }

  function updateParagraphText(sectionKey: string, paragraphId: string, text: string) {
    setContent((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.sectionKey === sectionKey
                ? {
                    ...s,
                    paragraphs: s.paragraphs.map((p) =>
                      p.paragraphId === paragraphId ? { ...p, text } : p
                    ),
                  }
                : s
            ),
          }
        : prev
    );
  }

  function handleSaveContent() {
    if (!doc || !content) return;
    updateContentMutation.mutate(
      { contentJson: content, status: null, expectedVersion: doc.version ?? 0 },
      { onSuccess: () => notify.success(t("protocol.contentSaved")) }
    );
  }

  function handleDownload() {
    if (!doc) return;
    downloadMutation.mutate({ fileName: `${doc.templateCode}-${doc.id}.docx` });
  }

  function handleSubmitReview() {
    if (!doc) return;
    submitMutation.mutate({ expectedVersion: doc.version ?? 0 });
  }

  function handleApprove() {
    if (!doc) return;
    approveMutation.mutate({ expectedVersion: doc.version ?? 0 });
  }

  function handleExport() {
    if (!doc) return;
    exportMutation.mutate(
      { expectedVersion: doc.version ?? 0 },
      { onSuccess: (accepted) => setExportJobId(accepted.jobId) }
    );
  }

  function handleRequestChanges() {
    if (!doc || !reason.trim()) return;
    requestChangesMutation.mutate(
      { expectedVersion: doc.version ?? 0, reason: reason.trim() },
      {
        onSuccess: () => {
          setReasonOpen(false);
          setReason("");
        },
      }
    );
  }

  const isEditable = doc?.status === "Draft" || doc?.status === "ChangesRequested";
  const canEditContent = isEditable && can("document.submit");
  const canSubmit = isEditable && can("document.submit") && Boolean(doc?.docxStorageKey);
  const canReview = doc?.status === "UnderReview" && can("document.approve");
  const canDownload = Boolean(doc?.docxStorageKey);
  const canExport = doc?.status === "Approved" && can("document.export");
  const exportInFlight =
    exportMutation.isPending || (Boolean(exportJobId) && !exportSucceeded && !exportFailed);

  if (!documentId) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState icon={FileText} description={t("protocol.noDocument")} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("protocol.selectTemplate")}</span>
            <Select
              value={selectedTemplate?.templateCode}
              onValueChange={setTemplateCode}
              disabled={templatesLoading || !protocolTemplates?.length}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t("protocol.selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {(protocolTemplates ?? []).map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.templateCode}>
                    {tpl.title} v{tpl.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={!selectedTemplate || generateInFlight}>
            <Sparkles className="size-4" />
            {generateInFlight ? t("protocol.generating") : t("protocol.generate")}
          </Button>
        </div>
        {!templatesLoading && !protocolTemplates?.length && (
          <p className="text-xs text-destructive">{t("protocol.noActiveTemplates")}</p>
        )}
        {generateJobId && !generateSucceeded && !generateFailed && (
          <Progress value={generateJob?.status === "Processing" ? 60 : 15} />
        )}
      </div>
    );
  }

  if (documentQuery.isLoading && !doc) return <LoadingState rows={4} />;
  if (documentQuery.error && !doc)
    return <ErrorState onRetry={() => void documentQuery.refetch()} />;
  if (!doc || !content) return <LoadingState rows={4} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileText className="size-5 text-muted-foreground" />
        <RecordStateBadge kind="document" status={doc.status} />
        <span className="font-mono text-xs text-muted-foreground">
          {doc.templateCode} v{doc.templateVersion ?? "—"}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {canDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
            >
              <Download className="size-4" />
              {t("protocol.download")}
            </Button>
          )}
          {canSubmit && (
            <Button size="sm" onClick={handleSubmitReview} disabled={submitMutation.isPending}>
              <Send className="size-4" />
              {t("protocol.submitReview")}
            </Button>
          )}
          {canReview && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={approveMutation.isPending}>
                <Check className="size-4" />
                {t("protocol.approve")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReasonOpen(true)}>
                {t("protocol.requestChanges")}
              </Button>
            </>
          )}
          {canExport && doc.status !== "Exported" && (
            <Button size="sm" variant="outline" onClick={handleExport} disabled={exportInFlight}>
              <Upload className="size-4" />
              {t("protocol.exportDoc")}
            </Button>
          )}
        </div>
      </div>

      {doc.status === "Exported" && (
        <p className="text-sm text-success">{t("protocol.exported")}</p>
      )}
      {exportInFlight && doc.status !== "Exported" && <Progress value={60} />}

      {documentQuery.isRegenerationTimedOut && (
        <p className="text-sm text-warning">{t("protocol.regenerationTimedOut")}</p>
      )}
      {!doc.docxStorageKey && !documentQuery.isRegenerationTimedOut && (
        <p className="text-sm text-muted-foreground">{t("protocol.regenerating")}</p>
      )}

      {content.fields.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("protocol.fields")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {content.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="font-mono text-xs text-muted-foreground">{field.key}</span>
                <Textarea
                  value={field.value}
                  onChange={(e) => updateFieldValue(field.key, e.target.value)}
                  disabled={!canEditContent}
                  rows={1}
                />
                {field.sources.length === 0 && (
                  <p
                    className={`text-xs font-medium ${
                      field.key === "judge" || field.key === "secretary"
                        ? "text-warning"
                        : "text-destructive"
                    }`}
                  >
                    {t(
                      field.key === "judge" || field.key === "secretary"
                        ? "protocol.manualIdentityField"
                        : "protocol.noSource"
                    )}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {content.sections.map((section) => (
        <Card key={section.sectionKey}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{section.sectionKey}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {section.paragraphs.map((paragraph) => (
              <div key={paragraph.paragraphId} className="flex flex-col gap-1">
                <Textarea
                  value={paragraph.text}
                  onChange={(e) =>
                    updateParagraphText(section.sectionKey, paragraph.paragraphId, e.target.value)
                  }
                  disabled={!canEditContent}
                  rows={3}
                />
                {paragraph.sources.length > 0 ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    {t("protocol.sources")}:{" "}
                    {paragraph.sources.map((s) => `${s.type}:${s.id}`).join(", ")}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-destructive">{t("protocol.noSource")}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {canEditContent && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{t("protocol.editHint")}</p>
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={handleSaveContent}
            disabled={updateContentMutation.isPending}
          >
            <Save className="size-4" />
            {t("protocol.saveChanges")}
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("protocol.versionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!versionsQuery.data || versionsQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("protocol.versionsEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {versionsQuery.data.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 border-b border-border pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    v{entry.versionNo}
                  </span>
                  <RecordStateBadge kind="document" status={entry.status} />
                  <span className="text-foreground">{entry.changeType}</span>
                  {entry.reason && <span className="text-muted-foreground">— {entry.reason}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">
                    <DateText value={entry.createdAt} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={reasonOpen} onOpenChange={setReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("protocol.requestChangesTitle")}</DialogTitle>
            <DialogDescription>{t("protocol.requestChangesDescription")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("protocol.reasonPlaceholder")}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={!reason.trim() || requestChangesMutation.isPending}
            >
              {t("protocol.requestChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
