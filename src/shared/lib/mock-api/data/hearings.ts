/**
 * Mock hearings (spec §14.4). `hearing-1` is case-1's completed, processed
 * 34-minute hearing the transcript/events/protocol fixtures hang off;
 * `hearing-2` is an upcoming one for the live-hearing flow.
 */
import type { Hearing } from "@/shared/types/models";

export const HEARINGS: Hearing[] = [
  {
    id: "hearing-1",
    caseId: "case-1",
    scheduledAt: "2026-07-20T10:00:00+05:00",
    startedAt: "2026-07-20T10:04:00+05:00",
    endedAt: "2026-07-20T10:38:00+05:00",
    status: "READY_FOR_REVIEW",
    liveSttProvider: "mock-live",
    liveSttModel: "mock-realtime-v1",
    finalSttProvider: "mock-batch",
    finalSttModel: "mock-whisper-v3",
    audioDurationMs: 2_040_000,
    createdBy: "cu-clerk-1",
  },
  {
    id: "hearing-2",
    caseId: "case-1",
    scheduledAt: "2026-07-28T11:00:00+05:00",
    startedAt: null,
    endedAt: null,
    status: "CREATED",
    liveSttProvider: "mock-live",
    liveSttModel: "mock-realtime-v1",
    finalSttProvider: null,
    finalSttModel: null,
    audioDurationMs: 0,
    createdBy: "cu-clerk-1",
  },
  {
    id: "hearing-3",
    caseId: "case-2",
    scheduledAt: "2026-07-26T09:30:00+05:00",
    startedAt: null,
    endedAt: null,
    status: "CREATED",
    liveSttProvider: "mock-live",
    liveSttModel: "mock-realtime-v1",
    finalSttProvider: null,
    finalSttModel: null,
    audioDurationMs: 0,
    createdBy: "cu-clerk-1",
  },
];
