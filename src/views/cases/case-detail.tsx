import { useState } from "react";
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
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
import { DateText } from "@/shared/custom/date-text";
import { DetailGrid } from "@/shared/custom/detail-grid";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { StageBadge } from "@/shared/custom/stage-badge";
import { CaseTypeTag } from "@/shared/custom/case-type-tag";
import { CaseStats } from "@/widgets/case-stats/case-stats";
import { useCase } from "@/features/cases/use-case";
import { useParticipants } from "@/features/participants/use-participants";
import { useDocuments } from "@/features/documents/use-documents";
import { ParticipantFormDialog } from "@/features/participants/participant-form-dialog";
import { VocabularyPanel } from "@/features/cases/vocabulary-panel";
import { useHearings } from "@/features/hearings/use-hearings";
import { createHearing } from "@/shared/lib/mock-api/hearing.service";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { buildRoute } from "@/shared/constants/route-paths";
import { deleteParticipant } from "@/shared/lib/mock-api/participant.service";
import { COURT_USERS } from "@/shared/lib/mock-api/data";
import type { Participant } from "@/shared/types/models";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

/**
 * Case detail (spec §16.1 #5, UC-01). Compact first cut: requisites +
 * participants. Hearings, documents and the vocabulary panel (Steps 4.4–4.6)
 * land in later increments. Reads `:caseId` from the route.
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

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setDeleting(true);
    try {
      await deleteParticipant(deleteTarget.id);
      setDeleteTarget(null);
      refetchParticipants();
    } catch {
      notify.error(t("errors.genericTitle"));
    } finally {
      setDeleting(false);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {backLink}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
              {courtCase.caseNumber}
            </h1>
            <StageBadge stage={courtCase.stage} />
            <CaseTypeTag caseType={courtCase.caseType} />
          </div>
          {parties && <p className="text-lg font-semibold text-foreground">{parties}</p>}
          <p className="text-sm text-muted-foreground">{courtCase.subject}</p>
        </div>
      </div>

      <CaseStats
        courtCase={courtCase}
        documentsCount={documents?.length ?? 0}
        participantsCount={participants?.length ?? courtCase.participantCount}
      />

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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {t("cases.columns.participants")}
          </h2>
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4" />
            {t("participants.add")}
          </Button>
        </div>
        {participants && participants.length > 0 ? (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.columns.name")}</TableHead>
                  <TableHead>{t("users.columns.role")}</TableHead>
                  <TableHead>{t("cases.columns.organization")}</TableHead>
                  <TableHead className="w-24 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">{p.displayName}</TableCell>
                    <TableCell>{t(`enums.participantRole.${p.role}` as MessageKey)}</TableCell>
                    <TableCell>{p.organizationName ?? "—"}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="flex flex-col gap-3">
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
      </section>

      <VocabularyPanel courtCase={courtCase} participants={participants ?? []} />

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
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {t("participants.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
