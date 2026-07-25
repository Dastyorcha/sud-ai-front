/**
 * Mock transcript segments for hearing-1 (spec §14.6). Generated
 * deterministically from a scripted courtroom exchange so every run (and the
 * demo) shows identical data. Speaker labels follow diarization output
 * (`SPEAKER_01`…), partially mapped to participants as UC-03 leaves them
 * after a first mapping pass.
 */
import type { TranscriptSegment } from "@/shared/types/models";

interface Line {
  speaker: string;
  participantId: string | null;
  text: string;
  /** Marked low-confidence to exercise the review queue. */
  low?: boolean;
  critical?: boolean;
}

/** Scripted exchange, cycled to fill the hearing (spec demo dataset). */
const SCRIPT: Line[] = [
  {
    speaker: "SPEAKER_01",
    participantId: null,
    text: "Sud majlisi ochiq deb e'lon qilinadi. Ish raqami 4-2101-2604/13.",
    critical: true,
  },
  {
    speaker: "SPEAKER_01",
    participantId: null,
    text: "Ishtirokchilarning shaxsi aniqlandi, huquq va majburiyatlari tushuntirildi.",
  },
  {
    speaker: "SPEAKER_02",
    participantId: "p-1-claimant-rep",
    text: "Hurmatli sud, da'vogar “Oq Yo'l Logistika” MChJ nomidan da'vo talablarini to'liq qo'llab-quvvatlaymiz.",
    critical: true,
  },
  {
    speaker: "SPEAKER_02",
    participantId: "p-1-claimant-rep",
    text: "Shartnoma bo'yicha ikki yuz ellik million so'm qarzdorlik mavjud.",
    critical: true,
    low: true,
  },
  {
    speaker: "SPEAKER_03",
    participantId: "p-1-defendant-rep",
    text: "Javobgar vakili sifatida da'vo talablariga qisman e'tiroz bildiramiz.",
  },
  {
    speaker: "SPEAKER_03",
    participantId: "p-1-defendant-rep",
    text: "To'lov muddati shartnomaning 4.2-bandiga ko'ra hali kelmagan.",
    low: true,
  },
  {
    speaker: "SPEAKER_02",
    participantId: "p-1-claimant-rep",
    text: "Hurmatli sud, javobgardan hisob-kitob dalolatnomasini talab qilib olish haqida iltimosnoma bildiramiz.",
  },
  {
    speaker: "SPEAKER_01",
    participantId: null,
    text: "Iltimosnoma muhokamaga qo'yiladi. Javobgar tomonning fikri so'raladi.",
  },
  {
    speaker: "SPEAKER_03",
    participantId: "p-1-defendant-rep",
    text: "Iltimosnomaga e'tirozimiz yo'q.",
  },
  {
    speaker: "SPEAKER_01",
    participantId: null,
    text: "Sud iltimosnomani qanoatlantirish haqida ajrim chiqardi.",
  },
];

const SEGMENT_COUNT = 60;
const HEARING_MS = 2_040_000;
const STEP = Math.floor(HEARING_MS / SEGMENT_COUNT);

function buildSegments(): TranscriptSegment[] {
  const out: TranscriptSegment[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const line = SCRIPT[i % SCRIPT.length];
    if (!line) continue;
    const startMs = i * STEP + 4_000;
    // Deterministic pseudo-variation.
    const confidence = line.low ? 0.62 + (i % 5) * 0.02 : 0.88 + (i % 6) * 0.02;
    out.push({
      id: `seg-${i + 1}`,
      hearingId: "hearing-1",
      audioTrackId: "track-1",
      providerSegmentId: `prov-${i + 1}`,
      sequenceNo: i + 1,
      startMs,
      endMs: startMs + STEP - 1_500,
      speakerLabel: line.speaker,
      participantId: line.participantId,
      rawText: line.text,
      normalizedText: line.text,
      humanText: null,
      canonicalText: line.text,
      confidence: Math.min(0.99, confidence),
      status: line.low ? "FINAL" : i % 7 === 0 ? "VERIFIED" : "FINAL",
      isCriticalReviewed: !line.critical,
      createdAt: "2026-07-20T10:40:00+05:00",
      updatedAt: "2026-07-20T10:40:00+05:00",
    });
  }
  return out;
}

export const TRANSCRIPT_SEGMENTS: TranscriptSegment[] = buildSegments();
