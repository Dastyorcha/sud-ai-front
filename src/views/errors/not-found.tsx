import { FileQuestion } from "lucide-react";
import NoData from "@/shared/components/ui/noData";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

/** 404 — no route matched. Rendered both for `*` under a valid `:lang` and
 * for an unsupported `:lang` segment (see `LocaleRoot` in `src/app/app.tsx`). */
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4">
      <NoData
        icon={FileQuestion}
        title={t("errors.notFoundTitle")}
        description={t("errors.notFoundDescription")}
      />
    </div>
  );
}
