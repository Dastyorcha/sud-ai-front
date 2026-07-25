import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { StatusBadge } from "@/shared/custom/status-badge";
import { DateText } from "@/shared/custom/date-text";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { RecordStateBadge } from "@/shared/custom/record/record-state-badge";
import { useMockQuery } from "@/shared/hooks/use-mock-query";
import { listDocuments, listTemplates } from "@/shared/lib/mock-api/document.service";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/**
 * Documents page (spec §16.1 #10 + #12): generated documents for all cases
 * and the read-only template catalogue (D-14).
 */
export default function DocumentsView() {
  const { t } = useTranslation();
  const { data: documents, isLoading: docsLoading } = useMockQuery(() => listDocuments(), []);
  const { data: templates, isLoading: tplLoading } = useMockQuery(() => listTemplates(), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("pages.documents")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("documents.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.generated")}</CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading && <LoadingState rows={3} />}
          {!docsLoading && (!documents || documents.length === 0) && <EmptyState />}
          {!docsLoading && documents && documents.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cases.columns.type")}</TableHead>
                  <TableHead>{t("documents.template")}</TableHead>
                  <TableHead>{t("cases.columns.status")}</TableHead>
                  <TableHead>{t("cases.columns.updated")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.documentType}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {d.templateCode} v{d.templateVersion}
                    </TableCell>
                    <TableCell>
                      <RecordStateBadge kind="document" status={d.status} />
                    </TableCell>
                    <TableCell>
                      <DateText value={d.createdAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documents.templates")}</CardTitle>
        </CardHeader>
        <CardContent>
          {tplLoading && <LoadingState rows={3} />}
          {!tplLoading && templates && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("documents.template")}</TableHead>
                  <TableHead>{t("documents.version")}</TableHead>
                  <TableHead>{t("cases.columns.status")}</TableHead>
                  <TableHead>{t("documents.approvedBy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{tpl.title}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {tpl.templateCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tpl.version}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={tpl.status}
                        tone={tpl.status === "ACTIVE" ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tpl.approvedBy ?? t("documents.notApproved")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
