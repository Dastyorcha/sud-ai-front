/**
 * Mock transcript service (spec §14.6, FR-07) — drop-in for the
 * `/api/v1/transcript-segments` endpoints. Edits preserve `rawText` (layers
 * are never overwritten, spec §10.1); speaker mapping applies to every
 * segment with the same label in one call (UC-03/AC-03).
 */
import { delay } from "@/shared/lib/mock-api/delay";
import { TRANSCRIPT_SEGMENTS } from "@/shared/lib/mock-api/data";
import type { TranscriptSegment } from "@/shared/types/models";

let segments: TranscriptSegment[] = TRANSCRIPT_SEGMENTS.map((s) => ({ ...s }));

export async function listSegments(hearingId: string): Promise<TranscriptSegment[]> {
  await delay();
  return segments
    .filter((s) => s.hearingId === hearingId)
    .sort((a, b) => a.sequenceNo - b.sequenceNo);
}

/** Edits a segment's text — human layer; raw ASR text is preserved. */
export async function editSegmentText(id: string, text: string): Promise<TranscriptSegment> {
  await delay();
  const current = segments.find((s) => s.id === id);
  if (!current) throw new Error(`Segment ${id} not found`);
  const updated: TranscriptSegment = {
    ...current,
    humanText: text,
    canonicalText: text,
    status: "EDITED",
    updatedAt: new Date().toISOString(),
  };
  segments = segments.map((s) => (s.id === id ? updated : s));
  return updated;
}

/** Marks a segment verified (and its critical fields reviewed). */
export async function verifySegment(id: string): Promise<TranscriptSegment> {
  await delay();
  const current = segments.find((s) => s.id === id);
  if (!current) throw new Error(`Segment ${id} not found`);
  const updated: TranscriptSegment = {
    ...current,
    status: "VERIFIED",
    isCriticalReviewed: true,
    updatedAt: new Date().toISOString(),
  };
  segments = segments.map((s) => (s.id === id ? updated : s));
  return updated;
}

/**
 * Maps a diarization label to a participant across the whole hearing in one
 * mutation (UC-03, AC-03). Returns the number of segments updated.
 */
export async function mapSpeaker(
  hearingId: string,
  speakerLabel: string,
  participantId: string | null,
): Promise<number> {
  await delay();
  let count = 0;
  segments = segments.map((s) => {
    if (s.hearingId === hearingId && s.speakerLabel === speakerLabel) {
      count++;
      return { ...s, participantId, updatedAt: new Date().toISOString() };
    }
    return s;
  });
  return count;
}
