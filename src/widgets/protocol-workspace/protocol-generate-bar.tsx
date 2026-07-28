import { FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { buildRoute, withLocale } from "@/shared/constants/route-paths";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export interface ProtocolGenerateBarProps {
  hearingId: string;
}

/**
 * Generate bar (mockup-05 #5): the FPK 273 note plus the gold CTA that hands
 * off to the existing phase-09 protocol editor (`ProtocolPanel`, reached via
 * the Hearing Detail workspace's protocol tab) — no document generation logic
 * lives here.
 */
export function ProtocolGenerateBar({ hearingId }: ProtocolGenerateBarProps) {
  const { t, locale } = useTranslation();

  return (
    <Card className="border-gold/40 bg-gold-soft">
      <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
          <p className="text-sm text-foreground">{t("protocolWorkspace.generateNote")}</p>
        </div>
        <Button asChild variant="gold" className="w-full sm:w-auto">
          <Link to={withLocale(locale, buildRoute.hearingDetail(hearingId))}>
            <Sparkles className="size-4" />
            {t("protocolWorkspace.generateCta")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
