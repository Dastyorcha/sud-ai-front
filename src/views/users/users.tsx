import { lazy, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge } from "@/shared/custom/status-badge";
import { DateText } from "@/shared/custom/date-text";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { useUsers } from "@/features/users/use-users";
import { DETAIL_PARAM } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

const UserDetail = lazy(() => import("@/views/users/user-detail"));

/**
 * Example CRUD list page — the reference pattern to copy when building a
 * real feature: a searchable table backed by the mock-api, with a row click
 * opening a detail drawer addressed by a query param (`?user=`).
 */
export default function UsersView() {
  const { t } = useTranslation();
  const { data: users, isLoading, error } = useUsers();
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get(DETAIL_PARAM.user);

  const filtered = useMemo(() => {
    if (!users) return [];
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
  }, [users, search]);

  function openUser(userId: string) {
    setSearchParams((params) => {
      params.set(DETAIL_PARAM.user, userId);
      return params;
    });
  }

  function closeUser() {
    setSearchParams((params) => {
      params.delete(DETAIL_PARAM.user);
      return params;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("pages.users")}</h1>
        <p className="text-sm text-muted-foreground">{t("users.description")}</p>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("common.search")}
        className="max-w-sm"
      />

      {isLoading && <LoadingState rows={5} />}
      {error && <ErrorState />}
      {!isLoading && !error && filtered.length === 0 && <EmptyState />}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.columns.name")}</TableHead>
                <TableHead>{t("users.columns.role")}</TableHead>
                <TableHead>{t("users.columns.status")}</TableHead>
                <TableHead>{t("users.columns.lastLogin")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => openUser(user.id)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.fullName}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{t(`enums.roles.${user.role}` as MessageKey)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={user.isActive ? t("users.active") : t("users.inactive")}
                      tone={user.isActive ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? <DateText value={user.lastLoginAt} /> : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedUserId && (
        <Suspense>
          <UserDetail userId={selectedUserId} onClose={closeUser} />
        </Suspense>
      )}
    </div>
  );
}
