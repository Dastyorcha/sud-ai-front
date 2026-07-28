# Integration 05 — Hearings, audio upload & transcription

- **Status:** doing
- **Size:** large
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §9 (hearing/audio/transcribe/transcript), §17 (gaps)

## Goal

Wire the hearing lifecycle to the real API: create/start/stop, `multipart` audio
upload, queue transcription, poll the job, and load the transcript — replacing
`hearing.service` + `job.service` mocks and the scripted live feed's data source.

## Scope & non-goals

- **In scope:** hearing create/start/stop, audio upload (FormData + validation),
  `transcribe` queue, job polling via `useJobPolling`, transcript GET, and the
  routing-state carry of `hearingId` + `version` (no hearing GET exists).
- **Out of scope:** transcript editing/speakers/approve (integration-06),
  SignalR live hub (integration-10), audio capture UI internals (kept as-is; only
  the upload target changes).

## Affected files

| Path (FSD layer)                                               | New? | Intent                                                 |
| -------------------------------------------------------------- | ---- | ------------------------------------------------------ |
| `src/features/hearings/hearing.service.ts`                     | yes  | create/start/stop/audio/transcribe/transcript calls    |
| `src/features/hearings/use-hearings.ts`                        | no   | rewrite: create + lifecycle mutations                  |
| `src/features/hearings/use-hearing-session.ts`                 | yes  | hold `hearingId`+`version` in router state             |
| `src/features/transcript/*`                                    | no   | transcript GET source swap (read-only load here)       |
| `src/views/hearings/hearing-detail.tsx`                        | no   | drive lifecycle + upload + poll from real service      |
| `src/shared/types/models.ts`                                   | no   | align `Hearing`/`AudioTrack`/`TranscriptSegment`/`Job` |
| `src/shared/lib/mock-api/hearing.service.ts`, `job.service.ts` | no   | deleted (integration-11)                               |
| `docs/codemap.md`                                              | no   | sync                                                   |

## Design notes

- **No hearing GET / hearing-list endpoint (guide §17).** After
  create/start/stop, persist the returned `HearingResponse` (esp. `id` +
  `version`) in **router/session state** (`use-hearing-session`). Deep-link /
  refresh cannot re-fetch a hearing yet — surface a clear "reopen from case" path
  and note the backend follow-up. Never invent a GET.
- **Lifecycle** (guide §9): `POST /cases/{id}/hearings` (`scheduledAt` nullable) →
  `Created`; `POST /hearings/{id}/start` (from `Created`/`DeviceCheck`) →
  `Recording` + `startedAt`; `POST /hearings/{id}/stop` (from `Recording`/`Paused`,
  idempotent in `Finalizing`) → `Finalizing` + `endedAt`. Handle
  `409 INVALID_HEARING_TRANSITION`. `DeviceCheck`/`Paused` have no endpoints (§17)
  — don't offer those transitions.
- **Audio upload** `POST /hearings/{id}/audio`, `multipart/form-data`, field
  `file`. Client-guard before upload: extension ∈ `.wav/.mp3/.webm`, matching
  MIME, 1 byte–100 MB. **Do not set `Content-Type`** — let the browser set the
  boundary (so this call bypasses the axios JSON default; use a dedicated
  `FormData` request or per-call header strip). Handle `400 INVALID_AUDIO_SIZE`,
  `400 UNSUPPORTED_AUDIO_FORMAT`, `400 AUDIO_SIGNATURE_MISMATCH`,
  `409 TRANSCRIPT_LOCKED`. Response = `AudioTrackResponse`.
- **Transcribe** `POST /hearings/{id}/transcribe` (no body) → `202
{ jobId, status }`. Preconditions: ≥1 audio uploaded, hearing `Finalizing` (or
  `Failed` retry). Re-queue returns the existing active job. Handle
  `409 HEARING_AUDIO_MISSING`, `409 INVALID_HEARING_TRANSITION`.
- **Job polling** via `useJobPolling(jobId)` (integration-02): stop at
  `Succeeded`/`Failed`; on `Failed` show `errorCode`/`errorMessageSafe` + offer
  retry (re-`transcribe`).
- **Transcript GET** `GET /hearings/{id}/transcript` → `{ hearingId, segments[] }`
  sorted by `sequenceNo`. Call after job `Succeeded` (empty segments possible if
  called early). Segment shape per guide §9 (raw/normalized/human/canonical text,
  `status`, `confidence`, `version` added in editor plan).

## Steps

1. [x] Align `Hearing`/`AudioTrack`/`TranscriptSegment`/`Job` types to guide — `refactor: align hearing/transcript/job types to api`
2. [x] Add `hearing.service.ts` (create/start/stop/transcript) — `feat: hearing lifecycle service`
3. [x] Add `use-hearing-session.ts` carrying `hearingId`+`version` in router state — `feat: hearing session state carry`
4. [x] Add audio upload (FormData, client validation, no manual Content-Type) — `feat: hearing audio upload`
5. [x] Wire `transcribe` + `useJobPolling` + retry-on-failed in hearing-detail — `feat: transcription queue and job polling`
6. [x] Load transcript after job success into the transcript panel (read-only) — `feat: load transcript from api`
7. [x] docs: sync `docs/codemap.md` — `docs: sync hearing/audio services`

## Risks / ripple / escalation

- Shared surface: `models.ts` (transcript/job types reused by integration-06/07),
  hearing-detail view.
- Escalation: hearing GET/list gap — confirm the routing-state-carry UX (no deep
  link) is acceptable for the demo.
- FormData upload must bypass the axios JSON `Content-Type`; verify the boundary
  header is browser-set.
- Rollback: mocks remain until integration-11.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual: create → start → upload a valid WAV → stop → transcribe → job polls to
  `Succeeded` → transcript loads; upload an oversized/wrong-format file → localized
  error; force a failed job → retry path works.
