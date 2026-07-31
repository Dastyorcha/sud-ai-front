import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { DateText } from "@/shared/custom/date-text";
import { Stat } from "@/shared/custom/stat";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { useSession } from "@/features/auth/use-session";
import { useCourtAuth } from "@/features/auth/use-court-auth";
import { useAuditLogs } from "@/features/audit/use-audit-logs";
import type { AuditLogFilters } from "@/features/audit/audit.service";
import { API_ROLE } from "@/shared/constants/court-permissions";
import { ROUTE_PATHS, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

const PAGE_SIZE = 50;

/** Renders a `before`/`after` audit cell — pretty-prints valid JSON, falls back to the raw string, or an em dash for `null`. */
function AuditJsonCell({ value, emptyLabel }: { value: string | null; emptyLabel: string }) {
  if (!value) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }
  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    // Not valid JSON — show the raw string as-is (guide §13).
  }
  return (
    <pre className="max-w-xs overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-foreground">
      {pretty}
    </pre>
  );
}

/**
 * Admin views (spec §16.1 #13–14, FR-12, NFR-05; read-only per D-14): audit
 * log (integration guide §13, `GET /audit-logs`, Administrator-only — a
 * non-admin session is redirected to `/403`) and provider/system status.
 */
export default function AdminView() {
  const { t, locale } = useTranslation();
  const { role } = useCourtAuth();
  const { hasSession, query: sessionQuery } = useSession();
  const isAdmin = role === API_ROLE.ADMINISTRATOR;

  const [actionInput, setActionInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [entityIdInput, setEntityIdInput] = useState("");
  const [actorIdInput, setActorIdInput] = useState("");
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => {
      setFilters({
        action: actionInput.trim() || undefined,
        entityType: entityTypeInput.trim() || undefined,
        entityId: entityIdInput.trim() || undefined,
        actorId: actorIdInput.trim() || undefined,
      });
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [actionInput, entityTypeInput, entityIdInput, actorIdInput]);

  const { data, isLoading, error } = useAuditLogs({
    filters,
    page,
    pageSize: PAGE_SIZE,
    enabled: isAdmin,
  });

  // Still resolving the session — avoid a false redirect before the role is known.
  if (hasSession && sessionQuery.isLoading) {
    return <LoadingState rows={6} />;
  }

  if (!isAdmin) {
    return <Navigate to={withLocale(locale, ROUTE_PATHS.FORBIDDEN)} replace />;
  }

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("pages.admin")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.providers")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-4">
            <span className="text-xs text-muted-foreground">{t("admin.activeRole")}</span>
            <p className="text-sm font-medium text-foreground">
              {role ? t(`enums.apiRoles.${role}` as MessageKey) : "—"}
            </p>
          </div>
          <Stat label={t("admin.liveProvider")}>mock-live</Stat>
          <Stat label={t("admin.finalProvider")}>mock-batch</Stat>
          <Stat label={t("admin.latency")}>1.8 s</Stat>
          <Stat label={t("admin.queueDepth")}>0</Stat>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditLog")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Input
              value={actionInput}
              onChange={(event) => setActionInput(event.target.value)}
              placeholder={t("admin.filterAction")}
              className="max-w-48"
            />
            <Input
              value={entityTypeInput}
              onChange={(event) => setEntityTypeInput(event.target.value)}
              placeholder={t("admin.filterEntityType")}
              className="max-w-48"
            />
            <Input
              value={entityIdInput}
              onChange={(event) => setEntityIdInput(event.target.value)}
              placeholder={t("admin.filterEntityId")}
              className="max-w-48"
            />
            <Input
              value={actorIdInput}
              onChange={(event) => setActorIdInput(event.target.value)}
              placeholder={t("admin.filterActorId")}
              className="max-w-48"
            />
          </div>

          {isLoading && <LoadingState rows={5} />}
          {error && <ErrorState />}
          {!isLoading && !error && logs.length === 0 && <EmptyState />}

          {!isLoading && !error && logs.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.time")}</TableHead>
                    <TableHead>{t("admin.actor")}</TableHead>
                    <TableHead>{t("admin.action")}</TableHead>
                    <TableHead>{t("admin.entity")}</TableHead>
                    <TableHead>{t("admin.before")}</TableHead>
                    <TableHead>{t("admin.after")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <DateText value={log.createdAt} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.actorId ?? t("admin.noChange")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.action}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entityType}/{log.entityId}
                      </TableCell>
                      <TableCell>
                        <AuditJsonCell value={log.before} emptyLabel={t("admin.noChange")} />
                      </TableCell>
                      <TableCell>
                        <AuditJsonCell value={log.after} emptyLabel={t("admin.noChange")} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {t("admin.pageInfo", { page, totalPages })}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    {t("admin.previousPage")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    {t("admin.nextPage")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
