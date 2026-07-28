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

/**
 * The five API roles `/auth/me` returns (guide §2/§7.4) — reconciled from
 * the repo's earlier mock `CourtRole` enum (`ADMIN|CLERK|JUDGE|LEGAL_EXPERT|
 * DEMO_OPERATOR`, `src/shared/types/enums.ts`, still used by the mock domain
 * fixtures until integration-04+ swaps them) to the real session's values.
 */
export const API_ROLE = {
  ADMINISTRATOR: "Administrator",
  SECRETARY: "Secretary",
  JUDGE: "Judge",
  LEGAL_EXPERT: "LegalExpert",
  DEMO_OPERATOR: "DemoOperator",
} as const;
export type ApiRole = (typeof API_ROLE)[keyof typeof API_ROLE];

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
