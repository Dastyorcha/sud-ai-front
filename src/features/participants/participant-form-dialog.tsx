import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  createParticipant,
  updateParticipant,
} from "@/shared/lib/mock-api/participant.service";
import { PARTICIPANT_ROLE, type ParticipantRole } from "@/shared/types/enums";
import type { Participant } from "@/shared/types/models";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

const roleValues = Object.values(PARTICIPANT_ROLE) as [ParticipantRole, ...ParticipantRole[]];

export interface ParticipantFormDialogProps {
  caseId: string;
  /** Present → edit mode; absent → add mode. */
  participant?: Participant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful create/update so the caller can refetch. */
  onSaved: () => void;
}

/**
 * Add / edit a participant (spec §14.3, UC-01 Step 4.5). Small controlled form
 * in a dialog — create when `participant` is absent, update when present.
 */
export function ParticipantFormDialog({
  caseId,
  participant,
  open,
  onOpenChange,
  onSaved,
}: ParticipantFormDialogProps) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [role, setRole] = useState<ParticipantRole>("CLAIMANT");
  const [submitting, setSubmitting] = useState(false);

  // Sync form state whenever the dialog opens or the target participant changes.
  useEffect(() => {
    setDisplayName(participant?.displayName ?? "");
    setOrganizationName(participant?.organizationName ?? "");
    setRole(participant?.role ?? "CLAIMANT");
  }, [participant, open]);

  async function handleSave() {
    if (!displayName.trim()) return;
    setSubmitting(true);
    try {
      if (participant) {
        await updateParticipant(participant.id, {
          displayName: displayName.trim(),
          organizationName: organizationName.trim() || null,
          role,
        });
      } else {
        await createParticipant({
          caseId,
          displayName: displayName.trim(),
          organizationName: organizationName.trim() || null,
          role,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch {
      notify.error(t("errors.genericTitle"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {participant ? t("participants.editTitle") : t("participants.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="participant-name">{t("users.columns.name")}</Label>
            <Input
              id="participant-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("caseForm.participantNamePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="participant-org">{t("cases.columns.organization")}</Label>
            <Input
              id="participant-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={t("caseForm.organizationPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("users.columns.role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as ParticipantRole)}>
              <SelectTrigger>
                <SelectValue placeholder={t("caseForm.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {roleValues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`enums.participantRole.${v}` as MessageKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={submitting || !displayName.trim()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
