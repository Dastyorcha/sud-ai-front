/**
 * Mock `Hearing` service (spec §14.4, FR-03, §17.3) — drop-in for the
 * `/api/v1/hearings` endpoints. Enforces the session state machine: invalid
 * transitions throw, as the real API would 409.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import { HEARINGS } from "@/shared/lib/mock-api/data";
import type { Hearing } from "@/shared/types/models";
import type { HearingStatus } from "@/shared/types/enums";

let hearings: Hearing[] = HEARINGS.map((h) => ({ ...h }));

/**
 * Allowed transitions (spec §17.3). Only the mock's UPPER_SNAKE values are
 * ever produced/consumed here — the PascalCase entries exist purely so this
 * `Record<HearingStatus, …>` stays exhaustive against the real-API values
 * additively appended to `HEARING_STATUS` (`shared/types/enums.ts`).
 */
const TRANSITIONS: Record<HearingStatus, HearingStatus[]> = {
  CREATED: ["DEVICE_CHECK", "RECORDING"],
  DEVICE_CHECK: ["RECORDING", "CREATED"],
  RECORDING: ["PAUSED", "FINALIZING"],
  PAUSED: ["RECORDING", "FINALIZING"],
  FINALIZING: ["PROCESSING"],
  PROCESSING: ["READY_FOR_REVIEW", "FAILED"],
  READY_FOR_REVIEW: ["APPROVED"],
  APPROVED: [],
  FAILED: ["PROCESSING"],
  Created: [],
  DeviceCheck: [],
  Recording: [],
  Paused: [],
  Finalizing: [],
  Failed: [],
};

export async function listHearings(caseId: string): Promise<Hearing[]> {
  await delay();
  return hearings.filter((h) => h.caseId === caseId);
}

export async function getHearing(id: string): Promise<Hearing | null> {
  await delay();
  return hearings.find((h) => h.id === id) ?? null;
}

export async function createHearing(caseId: string, scheduledAt: string): Promise<Hearing> {
  await delay();
  const created: Hearing = {
    id: crypto.randomUUID(),
    caseId,
    scheduledAt,
    startedAt: null,
    endedAt: null,
    status: "CREATED",
    liveSttProvider: "mock-live",
    liveSttModel: "mock-realtime-v1",
    finalSttProvider: null,
    finalSttModel: null,
    audioDurationMs: 0,
    createdBy: "cu-clerk-1",
  };
  hearings = [...hearings, created];
  return created;
}

/** Moves a hearing through the state machine; throws on an illegal transition. */
export async function transitionHearing(id: string, to: HearingStatus): Promise<Hearing> {
  await delay();
  const current = hearings.find((h) => h.id === id);
  if (!current) throw new Error(`Hearing ${id} not found`);
  if (!TRANSITIONS[current.status].includes(to)) {
    throw new Error(`Illegal transition ${current.status} -> ${to}`);
  }
  const now = new Date().toISOString();
  const updated: Hearing = {
    ...current,
    status: to,
    startedAt: to === "RECORDING" && !current.startedAt ? now : current.startedAt,
    endedAt: to === "FINALIZING" ? now : current.endedAt,
    finalSttProvider: to === "PROCESSING" ? "mock-batch" : current.finalSttProvider,
    finalSttModel: to === "PROCESSING" ? "mock-whisper-v3" : current.finalSttModel,
  };
  hearings = hearings.map((h) => (h.id === id ? updated : h));
  return updated;
}
