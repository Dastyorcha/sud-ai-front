# Phase 02 — API Layer, Contracts and Mocking

**Duration:** Week 2, days 1–3
**Spec refs:** §14 (data model), §15 (API contracts), §15.4 (error envelope), §16.5, D-05, D-09
**Prerequisites:** Phase 00, Phase 01
**Status:** in progress. Done: domain types + enums (`src/shared/types/`), uz/en/ru enum labels, court mock fixtures + `court-case`/`participant` mock services. Adapted to the repo's `mock-api` service pattern + plain `useState/useEffect` hooks instead of Zod-contract layer + TanStack Query + MSW. Remaining: hearing/transcript/event/document fixtures + services, and a `useJob` polling hook.

**Goal:** every backend interaction is typed, validated at runtime, and fully mockable. After this phase the frontend can be built to completion with the backend absent.

---

## Step 2.1 — Zod contracts (`src/lib/contracts/`)

One file per entity, mirroring §14 exactly.

```text
user.ts                 court-case.ts        participant.ts
hearing.ts              audio-track.ts       transcript-segment.ts
procedural-event.ts     document-template.ts generated-document.ts
document-version.ts     audit-log.ts         job.ts
enums.ts
```

### Enums — `enums.ts`

Declare every enum from the specification as a Zod enum, export the inferred union. **Keep the exact spec casing.**

```ts
export const ProceduralEventTypeSchema = z.enum([
  "HEARING_OPENED",
  "IDENTITY_VERIFIED",
  "RIGHTS_EXPLAINED",
  "CLAIM_EXPLAINED",
  "RESPONSE_GIVEN",
  "OBJECTION_RAISED",
  "MOTION_SUBMITTED",
  "MOTION_DISCUSSION",
  "EVIDENCE_SUBMITTED",
  "EVIDENCE_EXAMINED",
  "QUESTION_ASKED",
  "ANSWER_GIVEN",
  "BREAK_ANNOUNCED",
  "HEARING_POSTPONED",
  "RULING_ANNOUNCED",
  "HEARING_CLOSED",
  "OTHER",
]); // FR-08 — all 17 values

export const DocumentStatusSchema = z.enum([
  "DRAFT",
  "AI_GENERATED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "EXPORTED",
  "ARCHIVED",
]); // FR-11
```

Also: `CaseStatus`, `CourtType`, `CaseType`, `HearingStatus`, `SegmentStatus`, `ParticipantRole`, `UserRole`, `ReviewStatus`, `JobStatus`.

### Entity example — `transcript-segment.ts` (§14.6)

```ts
export const TranscriptSegmentSchema = z.object({
  id: z.string().uuid(),
  hearing_id: z.string().uuid(),
  audio_track_id: z.string().uuid().nullable(),
  provider_segment_id: z.string().nullable(),
  sequence_no: z.number().int(),
  start_ms: z.number().int(),
  end_ms: z.number().int(),
  speaker_label: z.string().nullable(),
  participant_id: z.string().uuid().nullable(),
  raw_text: z.string(),
  normalized_text: z.string(),
  human_text: z.string().nullable(),
  canonical_text: z.string(),
  confidence: z.number().nullable(),
  status: SegmentStatusSchema,
  is_critical_reviewed: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;
```

**Rule:** API-shaped fields keep backend `snake_case`. Do not camelCase-transform at the boundary — it creates a permanent translation layer that hides contract drift. Frontend-local types use camelCase; API types look like the API.

---

## Step 2.2 — HTTP client (`src/lib/api/http.ts`)

A thin `fetch` wrapper with exactly five responsibilities:

1. Prefix `NEXT_PUBLIC_API_BASE_URL`, set JSON headers
2. Inject `Authorization: Bearer <accessToken>` from the auth store
3. Generate and send `X-Request-Id` (crypto.randomUUID) on every request
4. Timeout via `AbortController` — 10s default, 60s for generation and export
5. Normalise every failure into a typed `ApiError`

### Error normalisation (`src/lib/api/errors.ts`)

§15.4 defines the envelope:

```ts
export class ApiError extends Error {
  code: string; // 'VALIDATION_FAILED'
  status: number;
  details: Array<{ field: string; message: string }>;
  requestId: string;
}
```

Every non-2xx becomes an `ApiError`. Network failure becomes `ApiError` with `code: 'NETWORK_ERROR'`. Timeout becomes `code: 'TIMEOUT'`. **No raw `fetch` rejection ever reaches a component** — components handle one error type.

`details[]` maps directly onto React Hook Form field errors in Phase 04 and Phase 10, which is why the shape is preserved rather than flattened.

### 401 handling — single flight

On 401: call `POST /auth/refresh` once, queue all concurrent 401s behind that single call, retry each original request once. A second failure triggers hard logout. Without single-flight, six simultaneous queries produce six refresh calls and a token race.

---

## Step 2.3 — Endpoint modules (`src/lib/api/endpoints/`)

One function per §15.1 endpoint, grouped by resource. Each parses its response through the Zod schema.

```ts
export async function getTranscript(hearingId: string) {
  const raw = await http.get(`/hearings/${hearingId}/transcript`);
  return z.object({ segments: z.array(TranscriptSegmentSchema) }).parse(raw);
}
```

Full coverage required — auth (4), cases (5), participants (3), hearings (7), transcript (6), events (4), documents (8), jobs (1). **34 endpoints.**

Parsing is not ceremony: when the backend renames a field in week seven, this turns a silent `undefined` rendering as blank into a loud, located error.

---

## Step 2.4 — Query layer (`src/lib/query/`)

### Query keys — one factory, no inline arrays

```ts
export const queryKeys = {
  cases: {
    all: ["cases"] as const,
    list: (filters: CaseFilters) => ["cases", "list", filters] as const,
    detail: (id: string) => ["cases", id] as const,
    participants: (id: string) => ["cases", id, "participants"] as const,
  },
  hearings: {
    detail: (id: string) => ["hearings", id] as const,
    transcript: (id: string) => ["hearings", id, "transcript"] as const,
    events: (id: string) => ["hearings", id, "events"] as const,
  },
  documents: {/* ... */},
  jobs: { detail: (id: string) => ["jobs", id] as const },
} as const;
```

### Client defaults

```ts
queries:   { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false }
mutations: { retry: false }
```

`refetchOnWindowFocus` is off deliberately: a clerk alt-tabbing during a hearing must not trigger a transcript refetch that fights the WebSocket stream.

### Optimistic update policy — §16.5, enforced

**Permitted:**

- transcript segment text edit
- speaker assignment
- verify toggle
- participant add/edit

**Forbidden — these await the server:**

- document approve / submit-review / request-changes
- export
- hearing start / pause / resume / stop / finalize
- canonical transcript approval
- case archive

Write this list as a comment in `queryClient.ts`. It is a legal-safety rule, not a performance preference: showing a document as approved before the server confirms it is a lie about a legal act.

---

## Step 2.5 — MSW handlers and the master fixture

### Handlers (`src/mocks/handlers/`)

One handler per endpoint, grouped by resource, returning fixture data with realistic latency (80–250ms jitter).

### The master fixture — build this once, properly

A single synthetic economic-court case, used by MSW, by `mock-ws`, by Playwright, and by the §25 demo. Building four separate datasets is how demos drift from tests.

```text
1 court case          — case № 4-2101-2604/13, economic court
4 participants        — judge, clerk, claimant representative, defendant representative
1 hearing             — 34 minutes, status FINALIZED
~420 transcript segments
                        · 18 with confidence < 0.75
                        · 31 containing critical fields (names, dates, amounts, case numbers)
                        · 4 distinct speaker labels
22 procedural events  — covering 11 of the 17 FR-08 types, each with source_segment_ids
1 protocol document   — status AI_GENERATED
2 generated documents — one APPROVED, one CHANGES_REQUESTED
1 audio file          — 34 min WAV in e2e fixtures, or generated tone if unavailable
48 audit log entries
3 document templates  — 2 ACTIVE, 1 DEPRECATED
```

Content must be genuinely Uzbek legal-register text with real diacritics, real organisation names (fictional but plausible), and real amount formats (`1 234 567,89 soʻm`). Lorem ipsum here would hide layout and font bugs until the demo.

### Scenario toggles

A dev-only toolbar (bottom-right, `NEXT_PUBLIC_USE_MOCKS` gated) switching MSW behaviour:

| Scenario             | Effect                                   |
| -------------------- | ---------------------------------------- |
| `slow-network`       | 3s latency on every request              |
| `validation-error`   | Generation endpoints return §15.4 errors |
| `generation-blocked` | Missing-source precondition fails        |
| `job-fails`          | Job polling ends in `FAILED`             |
| `conflict`           | Segment PATCH returns 409                |
| `empty-account`      | All lists empty                          |
| `unauthorized`       | Next request returns 401                 |

Phase 12's error-state audit is impossible without this toolbar. Build it now.

---

## Step 2.6 — Job polling hook

```ts
useJob(jobId: string | null, options?: { onSucceeded?, onFailed? })
```

- Polls `GET /jobs/{job_id}` every 1s, backing off to 3s after 30 seconds
- Stops on `SUCCEEDED` or `FAILED`
- Exposes `status`, `progress`, `error`, `elapsedMs`
- Used by: final transcription (Phase 07), event extraction (Phase 08), document generation (Phase 10), export (Phase 10)

Long jobs need honest progress. NFR-03 allows 20 minutes for a 60-minute audio final pass — a spinner for 20 minutes is unacceptable, so the hook surfaces elapsed time and the UI shows the expected range.

---

## Files produced

```text
src/lib/contracts/*.ts              (13 files)
src/lib/api/http.ts
src/lib/api/errors.ts
src/lib/api/endpoints/*.ts          (8 files, 34 functions)
src/lib/query/{queryClient,queryKeys}.ts
src/lib/query/useJob.ts
src/mocks/handlers/*.ts
src/mocks/fixtures/*.ts
src/mocks/browser.ts
src/components/dev/ScenarioToolbar.tsx
```

---

## Exit criteria

- [ ] All 34 endpoints callable against MSW with fully typed responses
- [ ] A deliberately broken fixture field fails a unit test with a located Zod error
- [ ] `ApiError` produced for 4xx, 5xx, network failure and timeout
- [ ] Single-flight refresh verified: six concurrent 401s produce one refresh call
- [ ] Master fixture renders real Uzbek text with correct diacritics
- [ ] All seven scenario toggles work from the dev toolbar
- [ ] `useJob` polls, backs off, and terminates correctly in both outcomes

---

## Notes for the implementer

The master fixture is the most under-appreciated deliverable in this plan. It becomes the demo dataset in §25, and the demo is what wins or loses the tender. Give it a full day. Every number, name and date in it should be something you would be comfortable projecting on a wall in front of judges.
