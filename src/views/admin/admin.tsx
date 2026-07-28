import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DateText } from "@/shared/custom/date-text";
import { Stat } from "@/shared/custom/stat";
import { AUDIT_LOGS, COURT_USERS } from "@/shared/lib/mock-api/data";
import { useCourtAuth } from "@/features/auth/use-court-auth";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * Admin views (spec §16.1 #13–14, FR-12, NFR-05; read-only per D-14): audit
 * log and provider/system status.
 */
export default function AdminView() {
  const { t } = useTranslation();
  const { role } = useCourtAuth();

  const actorName = (id: string) => COURT_USERS.find((u) => u.id === id)?.fullName ?? id;

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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.time")}</TableHead>
                <TableHead>{t("admin.actor")}</TableHead>
                <TableHead>{t("admin.action")}</TableHead>
                <TableHead>{t("admin.entity")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_LOGS.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <DateText value={log.createdAt} />
                  </TableCell>
                  <TableCell>{actorName(log.actorId)}</TableCell>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.entityType}/{log.entityId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
