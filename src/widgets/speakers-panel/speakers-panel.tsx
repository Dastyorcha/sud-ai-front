import { useMemo } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LoadingState } from "@/shared/custom/loading-state";
import { EmptyState } from "@/shared/custom/empty-state";
import { speakerColorClass } from "@/shared/custom/record/speaker-color";
import { useMockQuery } from "@/shared/hooks/use-mock-query";
import { listSegments } from "@/shared/lib/mock-api/transcript.service";
import { useParticipants } from "@/features/participants/use-participants";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface SpeakersPanelProps {
  caseId: string;
  hearingId: string;
  className?: string;
}

/**
 * Speakers panel (mockup-05 #3): one row per distinct diarization label —
 * color dot (shared `speakerColorClass` with the transcript rows), mapped
 * participant name and role, or the raw provider label when unmapped.
 */
export function SpeakersPanel({ caseId, hearingId, className }: SpeakersPanelProps) {
  const { t } = useTranslation();
  const { data: segments, isLoading } = useMockQuery(() => listSegments(hearingId), [hearingId]);
  const { data: participants } = useParticipants(caseId);

  const speakers = useMemo(() => {
    const byLabel = new Map<string, string | null>();
    for (const s of segments ?? []) {
      if (!s.speakerLabel) continue;
      if (!byLabel.has(s.speakerLabel) || s.participantId) {
        byLabel.set(s.speakerLabel, s.participantId ?? byLabel.get(s.speakerLabel) ?? null);
      }
    }
    return [...byLabel.entries()].map(([label, participantId]) => ({
      label,
      participant: participants?.find((p) => p.id === participantId) ?? null,
    }));
  }, [segments, participants]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden="true" />
          {t("protocolWorkspace.speakersTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState rows={3} />
        ) : speakers.length === 0 ? (
          <EmptyState description={t("protocolWorkspace.noSpeakers")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {speakers.map(({ label, participant }) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${speakerColorClass(label)}`}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {participant?.displayName ?? label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {participant
                      ? t(`enums.participantRole.${participant.role}` as MessageKey)
                      : label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
