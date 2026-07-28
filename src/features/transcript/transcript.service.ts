/**
 * Real `/transcript-segments` and `/hearings/{id}/{speakers,transcript/*}`
 * calls (integration guide §10, §16). Segment human-edit + verify,
 * speaker→participant mapping, pre-approval validation and hearing-level
 * approve — every mutation is `expectedVersion`-gated (optimistic
 * concurrency, guide §16); callers must write the response's new `version`
 * back into their local state. `rawText`/`normalizedText` are never
 * overwritten here — edits only ever touch `humanText`.
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import { toSegment, type TranscriptSegmentResponse } from "@/features/hearings/hearing.service";
import type { TranscriptSegment } from "@/shared/types/models";
import type { HearingStatus } from "@/shared/types/enums";

/** Body of `PATCH /transcript-segments/{id}` (guide §10). `humanText: null` clears the edit; `reason` ≤512 chars. */
export interface EditSegmentInput {
  humanText: string | null;
  expectedVersion: number;
  reason?: string;
}

/**
 * Edits a segment's human-reviewed text (guide §10 `PATCH
 * /transcript-segments/{id}`) — never touches `rawText`/`normalizedText`.
 * → `HumanEdited`, `version` incremented. Handles `404`, `409
 * CONCURRENCY_CONFLICT`, `409 TRANSCRIPT_LOCKED` via the shared `ApiError`
 * path (`useApiMutation` refetches + warns on conflict, never auto-resends).
 */
export async function editSegmentText(
  segmentId: string,
  input: EditSegmentInput
): Promise<TranscriptSegment> {
  const { data } = await apiClient.patch<TranscriptSegmentResponse>(
    `${API_PREFIX}/transcript-segments/${segmentId}`,
    input
  );
  return toSegment(data);
}

/** Body of `POST /transcript-segments/{id}/verify` (guide §10). */
export interface VerifySegmentInput {
  expectedVersion: number;
  reason?: string;
}

/**
 * Verifies a segment (guide §10 `POST /transcript-segments/{id}/verify`) —
 * the server sets `canonicalText` to `humanText` if present, else
 * `normalizedText`; `409 TRANSCRIPT_TEXT_REQUIRED` if neither exists.
 * → `Canonical`, `version` incremented.
 */
export async function verifySegment(
  segmentId: string,
  input: VerifySegmentInput
): Promise<TranscriptSegment> {
  const { data } = await apiClient.post<TranscriptSegmentResponse>(
    `${API_PREFIX}/transcript-segments/${segmentId}/verify`,
    input
  );
  return toSegment(data);
}

/** `SpeakerResponse` (guide §10 `GET /hearings/{id}/speakers`) — `version` is `0` when unmapped. */
export interface Speaker {
  speakerLabel: string;
  participantId: string | null;
  participantName: string | null;
  version: number;
  segmentCount: number;
}

/** Lists a hearing's diarization speaker labels and their current participant mapping (guide §10). */
export async function getSpeakers(hearingId: string): Promise<Speaker[]> {
  const { data } = await apiClient.get<Speaker[]>(`${API_PREFIX}/hearings/${hearingId}/speakers`);
  return data;
}

/** Body of `PUT /hearings/{id}/speakers/{speakerLabel}` (guide §10). */
export interface MapSpeakerInput {
  participantId: string;
  expectedVersion: number;
  reason?: string;
}

/**
 * Maps (or remaps) a diarization label to a participant — writes
 * `participantId` to every segment carrying that label (guide §10 `PUT
 * /hearings/{id}/speakers/{speakerLabel}`). The label **must** be
 * `encodeURIComponent`-ed in the path. `expectedVersion` is the speaker's
 * current `version` from `getSpeakers` (`0` for a first-time mapping).
 * Handles `400 SPEAKER_LABEL_REQUIRED`, `400 PARTICIPANT_NOT_IN_CASE`, `404
 * SPEAKER_NOT_FOUND`, concurrency, and lock via the shared `ApiError` path.
 */
export async function mapSpeaker(
  hearingId: string,
  speakerLabel: string,
  input: MapSpeakerInput
): Promise<Speaker> {
  const { data } = await apiClient.put<Speaker>(
    `${API_PREFIX}/hearings/${hearingId}/speakers/${encodeURIComponent(speakerLabel)}`,
    input
  );
  return data;
}

/** One pre-approval issue (guide §10) — codes: `HEARING_NOT_READY_FOR_REVIEW | TRANSCRIPT_EMPTY | CANONICAL_TEXT_REQUIRED | INVALID_SEGMENT_TIMESTAMP | SPEAKER_MAPPING_REQUIRED`. */
export interface TranscriptIssue {
  code: string;
  message?: string;
  /** Present when the issue is scoped to one segment (render inline there). */
  segmentId?: string;
}

export interface ValidateTranscriptResult {
  isValid: boolean;
  issues: TranscriptIssue[];
}

/**
 * Runs the pre-approval checklist (guide §10 `POST
 * /hearings/{id}/transcript/validate`, no body) — always `200`, never
 * throws for an invalid transcript. Approve must be gated on `isValid ===
 * true` and every issue rendered (inline where `segmentId` is present).
 */
export async function validateTranscript(hearingId: string): Promise<ValidateTranscriptResult> {
  const { data } = await apiClient.post<ValidateTranscriptResult>(
    `${API_PREFIX}/hearings/${hearingId}/transcript/validate`
  );
  return data;
}

/** Body of `POST /hearings/{id}/transcript/approve` (guide §10) — the **hearing** version, not a segment version. */
export interface ApproveTranscriptInput {
  expectedVersion: number;
}

export interface ApproveTranscriptResult {
  status: HearingStatus;
  lockedAt: string;
  version: number;
}

/**
 * Approves and locks the transcript (guide §10 `POST
 * /hearings/{id}/transcript/approve`) — `expectedVersion` is the hearing's
 * version (from `use-hearing-session`), not a segment's. Locks every
 * segment; further edits get `409 TRANSCRIPT_LOCKED`. Handles `400
 * TRANSCRIPT_VALIDATION_FAILED`, `409 INVALID_HEARING_TRANSITION`, and
 * concurrency via the shared `ApiError` path.
 */
export async function approveTranscript(
  hearingId: string,
  input: ApproveTranscriptInput
): Promise<ApproveTranscriptResult> {
  const { data } = await apiClient.post<ApproveTranscriptResult>(
    `${API_PREFIX}/hearings/${hearingId}/transcript/approve`,
    input
  );
  return data;
}
