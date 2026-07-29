# Integration 07 — Procedural events

- **Status:** idea
- **Size:** medium
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §11 (procedural events), §16 (concurrency)

## Goal

Wire the events panel to the real API: extract from the approved canonical
transcript, list, edit, and verify events — with source-grounding rules and
`expectedVersion` concurrency.

## Scope & non-goals

- **In scope:** `events/extract`, `events` list, `events/{id}` PATCH,
  `events/{id}/verify`; source-range and ruling-source rules; review-status
  transitions (`Draft`/`Verified`).
- **Out of scope:** document generation (integration-08).

## Affected files

| Path (FSD layer)                           | New? | Intent                                    |
| ------------------------------------------ | ---- | ----------------------------------------- |
| `src/features/events/event.service.ts`     | yes  | extract/list/patch/verify calls           |
| `src/features/events/use-events.ts`        | yes  | list + mutations over TanStack Query      |
| `src/features/events/events-panel.tsx`     | no   | wire extract/edit/verify to service       |
| `src/shared/types/models.ts`               | no   | align `ProceduralEvent` to guide response |
| `src/shared/lib/mock-api/event.service.ts` | no   | deleted (integration-11)                  |
| `docs/codemap.md`                          | no   | sync                                      |

## Design notes

- **Preconditions:** events require an approved/locked canonical transcript
  (integration-06 must have run for the hearing).
- **Response** `ProceduralEventResponse` (guide §11): `{ id, hearingId, eventType,
participantId, speakerRole, startMs, endMs, verbatimText, normalizedSummary,
confidence, reviewStatus, version, createdAt, sourceSegmentIds[] }`. Align
  `models.ts`; `eventType` is one of the 14 PascalCase values; `reviewStatus ∈
Draft | Verified`.
- **Extract** `POST /hearings/{id}/events/extract` (no body,
  Administrator/Secretary) → `ProceduralEventResponse[]`. Idempotent — returns the
  existing list if already extracted. Handle `409 TRANSCRIPT_NOT_APPROVED`,
  `409 CANONICAL_TRANSCRIPT_REQUIRED`.
- **List** `GET /hearings/{id}/events` sorted by `startMs`→`createdAt`; access =
  Administrator/Secretary/assigned Judge; `[]` when none.
- **PATCH `/events/{id}`** (Administrator/Secretary): partial `{ eventType,
participantId, speakerRole, normalizedSummary, startMs, endMs, expectedVersion,
reason? }`. Editing resets `reviewStatus` to `Draft`. Unsent fields unchanged;
  `participantId: null` is treated as "not specified" (no explicit clear — guide
  §11). Timing must stay within the source segments' min/max; `RulingAnnounced`
  only if the canonical source has an explicit ruling phrase. Handle
  `400 INVALID_EVENT_TYPE`, `400 PARTICIPANT_NOT_IN_CASE`,
  `400 EVENT_OUTSIDE_SOURCE_RANGE`, `400 RULING_SOURCE_NOT_EXPLICIT`, concurrency,
  `409 TRANSCRIPT_NOT_APPROVED`.
- **Verify** `POST /events/{id}/verify` body `{ expectedVersion }` → `Verified`,
  version++. Handle `409 EVENT_SOURCE_REQUIRED`, `409 EVENT_SOURCE_INVALID`,
  `400 RULING_SOURCE_NOT_EXPLICIT`, concurrency.
- **Source references** (`sourceSegmentIds`) must be preserved through edits — the
  UI shows traceability and never drops them (guide §18).

## Steps

1. [ ] Align `ProceduralEvent` type to guide response — `refactor: align procedural event type to api`
2. [ ] Add `event.service.ts` (extract/list/patch/verify) — `feat: procedural event service`
3. [ ] Add `use-events.ts` (list + mutations + invalidation) — `feat: events hooks over live api`
4. [ ] Wire `events-panel` extract/edit/verify; enforce source range + ruling rules in UI — `feat: events panel live wiring`
5. [ ] docs: sync `docs/codemap.md` — `docs: sync procedural event service`

## Risks / ripple / escalation

- `models.ts` shared with integration-08 (document sources). Keep event shape
  stable.
- Ruling/source-range validations are server-authoritative — mirror them as
  best-effort client hints, but rely on the API error for correctness.
- Rollback: mock service remains until integration-11.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual: extract on an approved transcript → list; edit an event (→ `Draft`) with
  out-of-range timing → localized `EVENT_OUTSIDE_SOURCE_RANGE`; verify a grounded
  event → `Verified`; re-extract is idempotent.
