# Integration 06 — Transcript editor, speakers, validate & approve

- **Status:** idea
- **Size:** large
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §10 (transcript editor), §16 (concurrency)

## Goal

Make the transcript editor write to the real API: per-segment human edit +
verify, speaker→participant mapping, pre-approval validation, and hearing-level
approve — all with `expectedVersion` optimistic concurrency.

## Scope & non-goals

- **In scope:** segment PATCH/verify, speakers GET/PUT, validate, approve, and
  the version bookkeeping the guide mandates (§16). Approve gating on
  `validate.isValid`.
- **Out of scope:** transcript load (integration-05), events (integration-07).

## Affected files

| Path (FSD layer)                                   | New? | Intent                                           |
| -------------------------------------------------- | ---- | ------------------------------------------------ |
| `src/features/transcript/transcript.service.ts`    | yes  | segment edit/verify, speakers, validate, approve |
| `src/features/transcript/use-transcript-editor.ts` | yes  | segment mutations + version tracking             |
| `src/features/transcript/use-speakers.ts`          | yes  | speaker list + map/remap                         |
| `src/features/transcript/transcript-panel.tsx`     | no   | wire edit/verify/validate/approve to service     |
| `src/features/hearings/use-hearing-session.ts`     | no   | hold hearing `version` for approve               |
| `src/shared/lib/mock-api/transcript.service.ts`    | no   | deleted (integration-11)                         |
| `docs/codemap.md`                                  | no   | sync                                             |

## Design notes

- **Roles/access:** all endpoints require Administrator/Judge/Secretary + case
  access; `expectedVersion` is **mandatory** on every mutation. After each
  success, write the response's new `version` into local state (guide §16).
- **Segment status flow** (guide §4): `Raw | Normalized | HumanEdited |
Canonical`. `rawText`/`normalizedText` are never overwritten; the editor writes
  `humanText`; verify promotes selected text to `canonicalText`.
- **PATCH `/transcript-segments/{id}`** body `{ humanText, expectedVersion,
reason? }` (`humanText: null` clears the edit; `reason` ≤512). → `HumanEdited`,
  version++. Handle `404`, `409 CONCURRENCY_CONFLICT`, `409 TRANSCRIPT_LOCKED`.
- **POST `/transcript-segments/{id}/verify`** body `{ expectedVersion, reason? }`.
  Canonical text = `humanText` else `normalizedText`; neither → error. → `Canonical`,
  `canonicalText` filled, version++. Handle `409 TRANSCRIPT_TEXT_REQUIRED`.
- **Speakers:** `GET /hearings/{id}/speakers` → `[{ speakerLabel, participantId,
participantName, version, segmentCount }]` (`version=0` when unmapped).
  `PUT /hearings/{id}/speakers/{speakerLabel}` body `{ participantId,
expectedVersion, reason? }` — writes `participantId` to every segment of that
  label. **`encodeURIComponent(speakerLabel)`** in the path. Remap sends the
  current version from GET. Handle `400 SPEAKER_LABEL_REQUIRED`,
  `400 PARTICIPANT_NOT_IN_CASE`, `404 SPEAKER_NOT_FOUND`, concurrency, locked.
- **Validate** `POST /hearings/{id}/transcript/validate` (no body) → always `200`
  `{ isValid, issues[] }`; issue codes `HEARING_NOT_READY_FOR_REVIEW |
TRANSCRIPT_EMPTY | CANONICAL_TEXT_REQUIRED | INVALID_SEGMENT_TIMESTAMP |
SPEAKER_MAPPING_REQUIRED`. Enable **Approve only when `isValid === true`**;
  render issues inline (per-segment where `segmentId` present).
- **Approve** `POST /hearings/{id}/transcript/approve` body `{ expectedVersion }`
  — this is the **hearing** version (from create/start/stop response, carried in
  `use-hearing-session`), not a segment version. → `{ status: "Approved",
lockedAt, version }`; locks the whole transcript (further edits `409
TRANSCRIPT_LOCKED`). Handle `400 TRANSCRIPT_VALIDATION_FAILED`,
  `409 INVALID_HEARING_TRANSITION`, concurrency.
- **Concurrency UX:** on `409 CONCURRENCY_CONFLICT`, refetch the segment/speaker
  list, warn the user, do not auto-resend (guide §16.4). `useApiMutation` handles
  this centrally.

## Steps

1. [ ] Add `transcript.service.ts` (segment edit/verify, speakers get/put, validate, approve) — `feat: transcript editor service`
2. [ ] Add `use-transcript-editor.ts` with per-segment version tracking + edit/verify — `feat: transcript segment mutations`
3. [ ] Add `use-speakers.ts` (list + map/remap, encoded label) — `feat: speaker mapping hooks`
4. [x] Wire validate + gate Approve on `isValid`; render issues — `feat: transcript validation gate`
5. [x] Wire approve using hearing version from session — `feat: transcript approve with hearing version`
6. [ ] Wire panel UI to all of the above; concurrency + locked UX — `feat: transcript editor live wiring`
7. [ ] docs: sync `docs/codemap.md` — `docs: sync transcript editor service`

## Risks / ripple / escalation

- Highest-concurrency surface in the app — version bookkeeping errors surface as
  spurious `409`s. Verify version write-back after every mutation.
- Hearing-version-for-approve depends on integration-05's session carry; if the
  user navigated away and lost it, approve can't proceed — surface clearly.
- Rollback: mock service remains until integration-11.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual: edit a segment (version++), verify → Canonical; map a speaker, remap
  with stale version → `409` refetch + warn; validate with an unmapped speaker →
  Approve disabled + issue shown; map all → validate `isValid` → approve → editor
  read-only (locked).
