/**
 * Real `/hearings/{id}/events` + `/events/{id}` calls (integration guide §11,
 * §16). Extraction requires an approved/locked canonical transcript
 * (integration-06) and is idempotent — re-extracting an already-processed
 * hearing returns the current list rather than duplicating events. Edit and
 * verify are `expectedVersion`-gated (guide §16); editing an event resets
 * `reviewStatus` to `Draft` server-side. `sourceSegmentIds` comes back on
 * every response and must never be dropped locally — it's the UI's
 * traceability trail (guide §18).
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { ProceduralEvent } from "@/shared/types/models";
import type { EventReviewStatus, ParticipantRole, ProceduralEventType } from "@/shared/types/enums";

/** `ProceduralEventResponse` (guide §11) — the exact live shape returned by extract/list/patch/verify. */
export interface ProceduralEventResponse {
  id: string;
  hearingId: string;
  eventType: string;
  participantId: string | null;
  speakerRole: string | null;
  startMs: number;
  endMs: number;
  verbatimText: string;
  normalizedSummary: string;
  confidence: number;
  reviewStatus: string;
  version: number;
  createdAt: string;
  sourceSegmentIds: string[];
}

/** Maps a `ProceduralEventResponse` to the domain `ProceduralEvent`. */
function toEvent(response: ProceduralEventResponse): ProceduralEvent {
  return {
    id: response.id,
    hearingId: response.hearingId,
    eventType: response.eventType as ProceduralEventType,
    participantId: response.participantId,
    speakerRole: response.speakerRole as ParticipantRole | null,
    startMs: response.startMs,
    endMs: response.endMs,
    sourceSegmentIds: response.sourceSegmentIds,
    verbatimText: response.verbatimText,
    normalizedSummary: response.normalizedSummary,
    confidence: response.confidence,
    reviewStatus: response.reviewStatus as EventReviewStatus,
    version: response.version,
    createdAt: response.createdAt,
  };
}

/** Defensive client sort (guide §11: `startMs` then `createdAt`) in case the API doesn't guarantee order. */
function sortEvents(events: ProceduralEventResponse[]): ProceduralEventResponse[] {
  return [...events].sort(
    (a, b) => a.startMs - b.startMs || a.createdAt.localeCompare(b.createdAt)
  );
}

/**
 * Extracts procedural events from the hearing's approved canonical transcript
 * (guide §11 `POST /hearings/{id}/events/extract`, no body,
 * Administrator/Secretary) → `ProceduralEventResponse[]`. Idempotent —
 * re-extracting an already-processed hearing returns the existing list.
 * Handles `409 TRANSCRIPT_NOT_APPROVED`, `409 CANONICAL_TRANSCRIPT_REQUIRED`
 * via the shared `ApiError` path.
 */
export async function extractEvents(hearingId: string): Promise<ProceduralEvent[]> {
  const { data } = await apiClient.post<ProceduralEventResponse[]>(
    `${API_PREFIX}/hearings/${hearingId}/events/extract`
  );
  return sortEvents(data).map(toEvent);
}

/**
 * Lists a hearing's procedural events (guide §11 `GET /hearings/{id}/events`),
 * sorted by `startMs` then `createdAt`. Access = Administrator/Secretary/the
 * assigned Judge; `[]` before extraction has run.
 */
export async function listEvents(hearingId: string): Promise<ProceduralEvent[]> {
  const { data } = await apiClient.get<ProceduralEventResponse[]>(
    `${API_PREFIX}/hearings/${hearingId}/events`
  );
  return sortEvents(data).map(toEvent);
}

/**
 * Body of `PATCH /events/{id}` (guide §11). Every field but `expectedVersion`
 * is optional — an unsent field is left unchanged server-side.
 * `participantId: null` means "not specified", not "clear the mapping"
 * (guide §11 — there's no explicit-clear semantics here).
 */
export interface EditEventInput {
  eventType?: ProceduralEventType;
  participantId?: string | null;
  speakerRole?: ParticipantRole | null;
  normalizedSummary?: string;
  startMs?: number;
  endMs?: number;
  expectedVersion: number;
  reason?: string;
}

/**
 * Edits a procedural event (guide §11 `PATCH /events/{id}`,
 * Administrator/Secretary) — resets `reviewStatus` to `Draft` server-side.
 * `startMs`/`endMs` must stay within the source segments' min/max range, and
 * `RulingAnnounced` requires an explicit ruling phrase in the canonical
 * source — both are server-authoritative; treat any client-side check as a
 * best-effort hint only. Handles `400 INVALID_EVENT_TYPE`, `400
 * PARTICIPANT_NOT_IN_CASE`, `400 EVENT_OUTSIDE_SOURCE_RANGE`, `400
 * RULING_SOURCE_NOT_EXPLICIT`, concurrency, `409 TRANSCRIPT_NOT_APPROVED` via
 * the shared `ApiError` path. `sourceSegmentIds` is untouched by this call and
 * always comes back in the response.
 */
export async function editEvent(eventId: string, input: EditEventInput): Promise<ProceduralEvent> {
  const { data } = await apiClient.patch<ProceduralEventResponse>(
    `${API_PREFIX}/events/${eventId}`,
    input
  );
  return toEvent(data);
}

/** Body of `POST /events/{id}/verify` (guide §11). */
export interface VerifyEventInput {
  expectedVersion: number;
}

/**
 * Verifies a procedural event (guide §11 `POST /events/{id}/verify`) →
 * `Verified`, `version` incremented. Handles `409 EVENT_SOURCE_REQUIRED`,
 * `409 EVENT_SOURCE_INVALID`, `400 RULING_SOURCE_NOT_EXPLICIT`, concurrency
 * via the shared `ApiError` path.
 */
export async function verifyEvent(
  eventId: string,
  input: VerifyEventInput
): Promise<ProceduralEvent> {
  const { data } = await apiClient.post<ProceduralEventResponse>(
    `${API_PREFIX}/events/${eventId}/verify`,
    input
  );
  return toEvent(data);
}
