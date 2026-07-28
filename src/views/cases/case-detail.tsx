import { lazy, Suspense, useState } from "react";
import { Archive, ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import Tabs from "@/shared/components/ui/tabs";
import { DateText } from "@/shared/custom/date-text";
import { DetailGrid } from "@/shared/custom/detail-grid";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { StageBadge } from "@/shared/custom/stage-badge";
import { StatusBadge } from "@/shared/custom/status-badge";
import { CaseTypeTag } from "@/shared/custom/case-type-tag";
import { CaseStats } from "@/widgets/case-stats/case-stats";
import { useCase } from "@/features/cases/use-case";
import { useArchiveCase } from "@/features/cases/use-cases";
import {
  useDeactivateParticipant,
  useParticipants,
} from "@/features/participants/use-participants";
import { useDocuments } from "@/features/documents/use-documents";
import { ParticipantFormDialog } from "@/features/participants/participant-form-dialog";
import { VocabularyPanel } from "@/features/cases/vocabulary-panel";
import { useHearings } from "@/features/hearings/use-hearings";
import { createHearing } from "@/shared/lib/mock-api/hearing.service";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { buildRoute } from "@/shared/constants/route-paths";
import { COURT_USERS } from "@/shared/lib/mock-api/data";
import { useCourtAuth } from "@/features/auth/use-court-auth";
import type { Participant } from "@/shared/types/models";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

// Sub-tab modules (mockup-05/06/07) — lazy so the shell stays light until a
// tab is opened.
const ProtocolWorkspace = lazy(() => import("@/widgets/protocol-workspace/protocol-workspace"));
const DocumentsWorkspace = lazy(() => import("@/widgets/documents-workspace/documents-workspace"));
const CopilotGrid = lazy(() => import("@/widgets/copilot-grid/copilot-grid"));

/**
 * Case detail shell (mockup-04): back nav, case number + parties headline,
 * stage badge and stat cards, followed by the Bayonnoma / Sud hujjatlari /
 * Sudya maslahatchisi sub-tabs (placeholders until mockup-05/06/07 land).
 * Existing requisites/participants/hearings management stays reachable below
 * the tabs. Reads `:caseId` from the route.
 */
export default function CaseDetailView() {
  const { t, locale } = useTranslation();
  const { caseId = "" } = useParams<{ caseId: string }>();
  const { data: courtCase, isLoading, error } = useCase(caseId);
  const { data: participants, refetch: refetchParticipants } = useParticipants(caseId);
  const { data: documents } = useDocuments(caseId);
  const { data: hearings, refetch: refetchHearings } = useHearings(caseId);

  async function addHearing() {
    const inWeek = new Date(Date.now() + 7 * 86_400_000).toISOString();
    await createHearing(caseId, inWeek);
    refetchHearings();
  }

  const { can } = useCourtAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const deactivateMutation = useDeactivateParticipant(caseId);
  const archiveMutation = useArchiveCase(caseId);

  async function confirmArchive() {
    try {
      await archiveMutation.mutateAsync();
      setArchiveConfirmOpen(false);
    } catch {
      // Errors are already toasted by useApiMutation.
    }
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(participant: Participant) {
    setEditing(participant);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deactivateMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Errors are already toasted by useApiMutation.
    }
  }

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="self-start">
      <Link to={withLocale(locale, ROUTE_PATHS.CASES)}>
        <ChevronLeft className="size-4" />
        {t("caseDetail.backToList")}
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <LoadingState rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <ErrorState />
      </div>
    );
  }

  if (!courtCase) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <EmptyState
          title={t("errors.notFoundTitle")}
          description={t("errors.notFoundDescription")}
        />
      </div>
    );
  }

  const judge = COURT_USERS.find((u) => u.id === courtCase.judgeId);
  const parties =
    courtCase.claimantName && courtCase.defendantName
      ? `${courtCase.claimantName} ${t("cases.vs")} ${courtCase.defendantName}`
      : null;
  const isArchived = courtCase.status === "ARCHIVED";
  const canManageParticipants = can("participant.edit") && !isArchived;
  const canArchive = can("case.archive") && !isArchived;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {backLink}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                {courtCase.caseNumber}
              </h1>
              <StatusBadge
                label={t(`enums.caseStatus.${courtCase.status}` as MessageKey)}
                tone={isArchived ? "neutral" : "success"}
              />
              {courtCase.stage && <StageBadge stage={courtCase.stage} />}
              <CaseTypeTag caseType={courtCase.caseType} />
            </div>
            {canArchive && (
              <Button variant="outline" size="sm" onClick={() => setArchiveConfirmOpen(true)}>
                <Archive className="size-4" />
                {t("caseDetail.archive")}
              </Button>
            )}
          </div>
          {parties && <p className="text-lg font-semibold text-foreground">{parties}</p>}
          <p className="text-sm text-muted-foreground">
            {courtCase.subject ?? courtCase.description}
          </p>
          {isArchived && (
            <p className="text-sm text-muted-foreground">{t("caseDetail.archivedNotice")}</p>
          )}
        </div>
      </div>

      <CaseStats
        courtCase={courtCase}
        documentsCount={documents?.length ?? 0}
        participantsCount={participants?.length ?? courtCase.participantCount ?? 0}
      />

      <Tabs
        variant="underline"
        tabs={[
          {
            id: "protocol",
            label: t("caseDetail.tabs.protocol"),
            content: (
              <Suspense fallback={<LoadingState rows={4} />}>
                <ProtocolWorkspace caseId={caseId} />
              </Suspense>
            ),
          },
          {
            id: "documents",
            label: t("caseDetail.tabs.documents"),
            content: (
              <Suspense fallback={<LoadingState rows={4} />}>
                <DocumentsWorkspace caseId={caseId} />
              </Suspense>
            ),
          },
          {
            id: "copilot",
            label: t("caseDetail.tabs.copilot"),
            content: (
              <Suspense fallback={<LoadingState rows={4} />}>
                <CopilotGrid caseId={caseId} />
              </Suspense>
            ),
          },
        ]}
      />

      <section className="flex flex-col gap-6 border-t border-border pt-6">
        <DetailGrid
          items={[
            {
              key: "court",
              label: t("cases.columns.court"),
              value: courtCase.courtName,
            },
            {
              key: "type",
              label: t("cases.columns.type"),
              value: t(`enums.caseType.${courtCase.caseType}` as MessageKey),
            },
            {
              key: "judge",
              label: t("enums.courtRoles.JUDGE"),
              value: judge ? judge.fullName : "—",
            },
            {
              key: "updated",
              label: t("cases.columns.updated"),
              value: <DateText value={courtCase.updatedAt} />,
            },
          ]}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t("cases.columns.participants")}
            </h2>
            {canManageParticipants && (
              <Button size="sm" onClick={openAdd}>
                <Plus className="size-4" />
                {t("participants.add")}
              </Button>
            )}
          </div>
          {participants && participants.length > 0 ? (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.columns.name")}</TableHead>
                    <TableHead>{t("users.columns.role")}</TableHead>
                    <TableHead>{t("cases.columns.organization")}</TableHead>
                    {canManageParticipants && <TableHead className="w-24 text-right" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">{p.displayName}</TableCell>
                      <TableCell>{t(`enums.participantRole.${p.role}` as MessageKey)}</TableCell>
                      <TableCell>{p.organizationName ?? "—"}</TableCell>
                      {canManageParticipants && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("participants.edit")}
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("participants.delete")}
                              onClick={() => setDeleteTarget(p)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{t("hearing.listTitle")}</h2>
            <Button size="sm" variant="outline" onClick={addHearing}>
              <Plus className="size-4" />
              {t("hearing.newHearing")}
            </Button>
          </div>
          {hearings && hearings.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {hearings.map((h) => (
                <li key={h.id}>
                  <Link
                    to={withLocale(locale, buildRoute.hearingDetail(h.id))}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {t("hearing.scheduled")}: <DateText value={h.scheduledAt} />
                      </span>
                      {h.audioDurationMs > 0 && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {Math.round(h.audioDurationMs / 60_000)} min
                        </span>
                      )}
                    </div>
                    <RecordStateBadge kind="hearing" status={h.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState />
          )}
        </div>

        <VocabularyPanel courtCase={courtCase} participants={participants ?? []} />
      </section>

      <ParticipantFormDialog
        caseId={caseId}
        participant={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refetchParticipants}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("participants.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("participants.deleteConfirm", { name: deleteTarget?.displayName ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deactivateMutation.isPending}
            >
              {t("participants.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("caseDetail.archiveConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("caseDetail.archiveConfirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmArchive}
              disabled={archiveMutation.isPending}
            >
              {t("caseDetail.archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
