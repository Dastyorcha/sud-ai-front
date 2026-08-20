/**
 * Real `/hearings` calls (integration guide §9) — create/start/stop, audio
 * upload, transcription queue and transcript GET.
 */
import { apiClient } from "@/shared/lib/http/api-client";
import { API_PREFIX } from "@/shared/config/env";
import type { Hearing, TranscriptSegment } from "@/shared/types/models";
import type { HearingStatus, ParticipantRole, SegmentStatus } from "@/shared/types/enums";

/** `HearingResponse` (guide §9) — the exact live shape. */
interface HearingResponse {
  id: string;
  caseId: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: HearingStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function toHearing(response: HearingResponse): Hearing {
  return {
    id: response.id,
    caseId: response.caseId,
    scheduledAt: response.scheduledAt,
    startedAt: response.startedAt,
    endedAt: response.endedAt,
    status: response.status,
    liveSttProvider: null,
    liveSttModel: null,
    finalSttProvider: null,
    finalSttModel: null,
    audioDurationMs: 0,
    createdBy: "",
    version: response.version,
  };
}

/** Returns all persisted hearings for a case, newest first. */
export async function listCaseHearings(caseId: string): Promise<Hearing[]> {
  const { data } = await apiClient.get<HearingResponse[]>(`${API_PREFIX}/cases/${caseId}/hearings`);
  return data.map(toHearing);
}

/** Returns one persisted hearing. Safe for refreshes and direct links. */
export async function getHearing(hearingId: string): Promise<Hearing> {
  const { data } = await apiClient.get<HearingResponse>(`${API_PREFIX}/hearings/${hearingId}`);
  return toHearing(data);
}

/** Input for `POST /cases/{id}/hearings` (guide §9) — `scheduledAt` is nullable. */
export interface CreateHearingInput {
  caseId: string;
  scheduledAt?: string | null;
}

/** Creates a hearing in `Created` status (guide §9 `POST /cases/{id}/hearings`). */
export async function createHearing({
  caseId,
  scheduledAt = null,
}: CreateHearingInput): Promise<Hearing> {
  const { data } = await apiClient.post<HearingResponse>(`${API_PREFIX}/cases/${caseId}/hearings`, {
    scheduledAt,
  });
  return toHearing(data);
}

/**
 * Starts a hearing (guide §9 `POST /hearings/{id}/start`, from `Created`/
 * `DeviceCheck`) — sets `Recording` + `startedAt`. `409
 * INVALID_HEARING_TRANSITION` if the hearing isn't in a startable state.
 */
export async function startHearing(hearingId: string): Promise<Hearing> {
  const { data } = await apiClient.post<HearingResponse>(
    `${API_PREFIX}/hearings/${hearingId}/start`
  );
  return toHearing(data);
}

/**
 * Stops a hearing (guide §9 `POST /hearings/{id}/stop`, from `Recording`/
 * `Paused`, idempotent while `Finalizing`) — sets `Finalizing` + `endedAt`.
 * `409 INVALID_HEARING_TRANSITION` otherwise.
 */
export async function stopHearing(hearingId: string): Promise<Hearing> {
  const { data } = await apiClient.post<HearingResponse>(
    `${API_PREFIX}/hearings/${hearingId}/stop`
  );
  return toHearing(data);
}

/** Audio file extensions the backend accepts (guide §9), with their expected MIME types. */
const AUDIO_MIME_BY_EXTENSION: Record<string, string[]> = {
  wav: ["audio/wav", "audio/x-wav", "audio/wave"],
  mp3: ["audio/mpeg", "audio/mp3"],
  webm: ["audio/webm"],
};

const MIN_AUDIO_SIZE_BYTES = 1;
const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;

/** Client-side guard mirroring the server's checks (guide §9) — never skip these before uploading. */
export type AudioValidationError =
  "unsupported_audio_format" | "invalid_audio_size" | "audio_signature_mismatch";

/** Validates a file before `uploadAudio` — returns `null` if it passes, or the failing check. */
export function validateAudioFile(file: File): AudioValidationError | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedMimes = AUDIO_MIME_BY_EXTENSION[extension];
  if (!expectedMimes) return "unsupported_audio_format";
  if (file.size < MIN_AUDIO_SIZE_BYTES || file.size > MAX_AUDIO_SIZE_BYTES)
    return "invalid_audio_size";
  // An empty/browser-unset MIME type is common for some recorders — only flag
  // a *mismatched* non-empty type, the size/signature check happens server-side too.
  const normalizedMime = file.type.split(";", 1)[0]?.trim().toLowerCase();
  if (normalizedMime && !expectedMimes.includes(normalizedMime)) return "audio_signature_mismatch";
  return null;
}

/** `AudioTrackResponse` (guide §9) — the exact live shape. */
interface AudioTrackResponse {
  id: string;
  hearingId: string;
  channelNo: number;
  mappedRole: ParticipantRole | null;
  storageUri: string;
  codec: string;
  sampleRate: number;
  checksumSha256: string;
  sizeBytes: number;
  createdAt: string;
}

/**
 * Uploads an audio file for a hearing (guide §9 `POST /hearings/{id}/audio`,
 * `multipart/form-data`, field `file`). Callers must run `validateAudioFile`
 * first. **Never** set `Content-Type` manually — the browser derives the
 * multipart boundary from the `FormData` body; axios only sends a JSON
 * `Content-Type` when we set one, so omitting it here is what makes this
 * request multipart. Handles `400 INVALID_AUDIO_SIZE` /
 * `UNSUPPORTED_AUDIO_FORMAT` / `AUDIO_SIGNATURE_MISMATCH` and `409
 * TRANSCRIPT_LOCKED` via the shared `ApiError` → `errorMessageKey()` path.
 */
export async function uploadAudio(hearingId: string, file: File): Promise<AudioTrackResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<AudioTrackResponse>(
    `${API_PREFIX}/hearings/${hearingId}/audio`,
    form
  );
  return data;
}

/** `202` response of `POST /hearings/{id}/transcribe` (guide §9). */
export interface TranscribeAccepted {
  jobId: string;
  status: string;
}

/**
 * Queues final transcription (guide §9 `POST /hearings/{id}/transcribe`, no
 * body, `202`). Requires ≥1 uploaded audio track and the hearing in
 * `Finalizing` (or retried from `Failed`) — `409 HEARING_AUDIO_MISSING` /
 * `INVALID_HEARING_TRANSITION` otherwise. Re-queuing returns the existing
 * active job. Poll the returned `jobId` with `useJobPolling`.
 */
export async function transcribeHearing(hearingId: string): Promise<TranscribeAccepted> {
  const { data } = await apiClient.post<TranscribeAccepted>(
    `${API_PREFIX}/hearings/${hearingId}/transcribe`
  );
  return data;
}

/**
 * `TranscriptSegmentResponse` (guide §9/§10) — the exact live shape. Exported
 * for `features/transcript/transcript.service.ts`, whose PATCH/verify
 * endpoints return the same shape.
 */
export interface TranscriptSegmentResponse {
  id: string;
  hearingId: string;
  audioTrackId: string | null;
  providerSegmentId: string | null;
  sequenceNo: number;
  startMs: number;
  endMs: number;
  speakerLabel: string | null;
  participantId: string | null;
  rawText: string;
  normalizedText: string;
  humanText: string | null;
  canonicalText: string;
  confidence: number | null;
  status: string;
  isCriticalReviewed?: boolean;
  createdAt: string;
  updatedAt?: string;
  version: number;
}

/** Maps a `TranscriptSegmentResponse` to the domain `TranscriptSegment` — shared with `transcript.service.ts`. */
export function toSegment(response: TranscriptSegmentResponse): TranscriptSegment {
  return {
    id: response.id,
    hearingId: response.hearingId,
    audioTrackId: response.audioTrackId,
    providerSegmentId: response.providerSegmentId,
    sequenceNo: response.sequenceNo,
    startMs: response.startMs,
    endMs: response.endMs,
    speakerLabel: response.speakerLabel,
    participantId: response.participantId,
    rawText: response.rawText,
    normalizedText: response.normalizedText,
    humanText: response.humanText,
    canonicalText: response.canonicalText,
    confidence: response.confidence,
    status: response.status as SegmentStatus,
    isCriticalReviewed: response.isCriticalReviewed ?? false,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt ?? response.createdAt,
    version: response.version,
  };
}

/**
 * Reads the transcript once transcription succeeds (guide §9
 * `GET /hearings/{id}/transcript`) — sorted by `sequenceNo`. May return an
 * empty array if called before the job actually finished writing segments.
 */
export async function getTranscript(hearingId: string): Promise<TranscriptSegment[]> {
  const { data } = await apiClient.get<{
    hearingId: string;
    segments: TranscriptSegmentResponse[];
  }>(`${API_PREFIX}/hearings/${hearingId}/transcript`);
  return [...data.segments].sort((a, b) => a.sequenceNo - b.sequenceNo).map(toSegment);
}
