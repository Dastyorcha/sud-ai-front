import type { CourtRole } from "@/shared/types/enums";

/**
 * Court capability map (spec §4, plan phase-03 Step 3.4). Components ask for
 * capabilities, never roles — when a role gains powers, only this file
 * changes. Frontend-only gate; a real backend is the enforcement point.
 */
export const COURT_ACTION = {
  caseCreate: "case.create",
  caseArchive: "case.archive",
  participantEdit: "participant.edit",
  hearingRecord: "hearing.record",
  transcriptEdit: "transcript.edit",
  transcriptApprove: "transcript.approve",
  documentSubmit: "document.submit",
  documentApprove: "document.approve",
  documentExport: "document.export",
  adminView: "admin.view",
} as const;
export type CourtAction = (typeof COURT_ACTION)[keyof typeof COURT_ACTION];

const ALL: CourtAction[] = Object.values(COURT_ACTION);

/** Role × action matrix (spec §4.1–4.5). */
export const COURT_CAPABILITIES: Record<CourtRole, readonly CourtAction[]> = {
  ADMIN: ALL,
  CLERK: [
    "case.create",
    "case.archive",
    "participant.edit",
    "hearing.record",
    "transcript.edit",
    "transcript.approve",
    "document.submit",
    "document.export",
  ],
  JUDGE: ["document.approve", "document.export"],
  LEGAL_EXPERT: ["admin.view"],
  DEMO_OPERATOR: [
    "case.create",
    "participant.edit",
    "hearing.record",
    "transcript.edit",
    "transcript.approve",
    "document.submit",
  ],
} as const;

export function canCourt(role: CourtRole, action: CourtAction): boolean {
  return COURT_CAPABILITIES[role].includes(action);
}
