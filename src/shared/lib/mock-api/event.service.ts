/**
 * Mock procedural-event service (spec §14.7, FR-08) — drop-in for the
 * `/api/v1/events` endpoints.
 */
import { delay } from "@/shared/lib/mock-api/delay";
import { PROCEDURAL_EVENTS } from "@/shared/lib/mock-api/data";
import type { ProceduralEvent } from "@/shared/types/models";

let events: ProceduralEvent[] = PROCEDURAL_EVENTS.map((e) => ({ ...e }));

export async function listEvents(hearingId: string): Promise<ProceduralEvent[]> {
  await delay();
  return events.filter((e) => e.hearingId === hearingId).sort((a, b) => a.startMs - b.startMs);
}

export async function updateEvent(
  id: string,
  patch: Partial<Pick<ProceduralEvent, "eventType" | "participantId" | "normalizedSummary">>,
): Promise<ProceduralEvent> {
  await delay();
  const current = events.find((e) => e.id === id);
  if (!current) throw new Error(`Event ${id} not found`);
  const updated = { ...current, ...patch };
  events = events.map((e) => (e.id === id ? updated : e));
  return updated;
}

export async function verifyEvent(id: string): Promise<ProceduralEvent> {
  await delay();
  const current = events.find((e) => e.id === id);
  if (!current) throw new Error(`Event ${id} not found`);
  const updated: ProceduralEvent = {
    ...current,
    reviewStatus: "VERIFIED",
    requiresHumanReview: false,
    verifiedBy: "cu-clerk-1",
  };
  events = events.map((e) => (e.id === id ? updated : e));
  return updated;
}

export async function rejectEvent(id: string): Promise<ProceduralEvent> {
  await delay();
  const current = events.find((e) => e.id === id);
  if (!current) throw new Error(`Event ${id} not found`);
  const updated: ProceduralEvent = { ...current, reviewStatus: "REJECTED", requiresHumanReview: false };
  events = events.map((e) => (e.id === id ? updated : e));
  return updated;
}
