/**
 * Mock `Participant` service (spec §14.3, UC-01) — drop-in for the
 * `/api/v1/cases/:id/participants` and `/api/v1/participants/:id` endpoints.
 * Keeps a session-mutable store and syncs the owning case's `participantCount`
 * so the case list stays accurate after edits.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import { PARTICIPANTS } from "@/shared/lib/mock-api/data";
import { getCase, updateCase } from "@/shared/lib/mock-api/court-case.service";
import type { Participant } from "@/shared/types/models";
import type { ParticipantRole } from "@/shared/types/enums";

/** Input for adding a participant (spec `POST /cases/:id/participants`). */
export interface CreateParticipantInput {
  caseId: string;
  displayName: string;
  organizationName?: string | null;
  role: ParticipantRole;
  identifier?: Record<string, unknown>;
  languagePreferences?: string[];
}

let participants: Participant[] = PARTICIPANTS.map((p) => ({ ...p }));

/** Recomputes and persists the owning case's participant count. */
async function syncCount(caseId: string): Promise<void> {
  const count = participants.filter((p) => p.caseId === caseId).length;
  const existing = await getCase(caseId);
  if (existing && existing.participantCount !== count) {
    await updateCase(caseId, { participantCount: count });
  }
}

/** All participants of a case, in creation order. Swap to the list endpoint later. */
export async function listParticipants(caseId: string): Promise<Participant[]> {
  await delay();
  return participants.filter((p) => p.caseId === caseId);
}

/** Adds a participant (spec `POST /cases/:id/participants`). */
export async function createParticipant(input: CreateParticipantInput): Promise<Participant> {
  await delay();
  const created: Participant = {
    id: crypto.randomUUID(),
    caseId: input.caseId,
    displayName: input.displayName,
    organizationName: input.organizationName ?? null,
    role: input.role,
    identifier: input.identifier ?? {},
    languagePreferences: input.languagePreferences ?? ["uz"],
    voiceReferenceUri: null,
    createdAt: new Date().toISOString(),
  };
  participants = [...participants, created];
  await syncCount(input.caseId);
  return created;
}

/** Patches a participant (spec `PATCH /participants/:id`). Throws if not found. */
export async function updateParticipant(
  id: string,
  patch: Partial<Omit<Participant, "id" | "caseId" | "createdAt">>
): Promise<Participant> {
  await delay();
  const current = participants.find((p) => p.id === id);
  if (!current) throw new Error(`Participant ${id} not found`);
  const updated = { ...current, ...patch };
  participants = participants.map((p) => (p.id === id ? updated : p));
  return updated;
}

/** Deletes a participant (spec `DELETE /participants/:id`). Throws if not found. */
export async function deleteParticipant(id: string): Promise<void> {
  await delay();
  const target = participants.find((p) => p.id === id);
  if (!target) throw new Error(`Participant ${id} not found`);
  participants = participants.filter((p) => p.id !== id);
  await syncCount(target.caseId);
}
