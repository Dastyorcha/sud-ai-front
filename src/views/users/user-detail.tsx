import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { DetailGrid } from "@/shared/custom/detail-grid";
import { DateText } from "@/shared/custom/date-text";
import { StatusBadge } from "@/shared/custom/status-badge";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { useMockQuery } from "@/shared/hooks/use-mock-query";
import { getUser } from "@/shared/lib/mock-api/user.service";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface UserDetailProps {
  userId: string;
  onClose: () => void;
}

/** Read-only detail drawer for a single user — opened from `UsersView`. */
export default function UserDetail({ userId, onClose }: UserDetailProps) {
  const { t } = useTranslation();
  const { data: user, isLoading, error } = useMockQuery(() => getUser(userId), [userId]);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{user?.fullName ?? t("pages.users")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading && <LoadingState rows={4} />}
          {error && <ErrorState />}
          {user && (
            <DetailGrid
              items={[
                { key: "email", label: t("users.columns.email"), value: user.email },
                { key: "phone", label: t("users.columns.phone"), value: user.phone || "—" },
                {
                  key: "role",
                  label: t("users.columns.role"),
                  value: t(`enums.roles.${user.role}` as MessageKey),
                },
                {
                  key: "status",
                  label: t("users.columns.status"),
                  value: (
                    <StatusBadge
                      label={user.isActive ? t("users.active") : t("users.inactive")}
                      tone={user.isActive ? "success" : "neutral"}
                    />
                  ),
                },
                {
                  key: "lastLogin",
                  label: t("users.columns.lastLogin"),
                  value: user.lastLoginAt ? <DateText value={user.lastLoginAt} /> : "—",
                },
              ]}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
