# LexKotib AI — Frontend Implementation Plan

**Scope:** frontend only (`apps/web`)
**Source of truth:** `LexKotib_AI_MVP_Texnik_Spetsifikatsiya.md` v1.0 (2026-07-19)
**Plan version:** 1.0
**Target:** working MVP for the tender demo, 10 weeks
**Language policy:** code, identifiers and comments in English; all UI strings in Uzbek (Latin).

Every open question in the spec has been decided below. Section references like `§16.2`, `FR-05`, `NFR-03` point back to the specification.

---

## 0. Decision register

These are locked. Change only through a new ADR in `docs/adr/`.

| # | Decision | Rationale |
|---|---|---|
| D-01 | **Next.js 16 (App Router) + React 19 + TypeScript strict** | §8.2 recommends Next.js; App Router gives route groups for role-gated areas. |
| D-02 | **Standalone repo `lexkotib-web`, pnpm, structured as if it already lived at `apps/web`** | Monorepo (§20) can absorb it later with zero refactor. |
| D-03 | **Client-rendered application shell.** Only `/login` is server-rendered. All authenticated routes are client components. No SSR data fetching. | The product is a realtime workstation, not a content site. SSR would fight the WebSocket and the audio pipeline. |
| D-04 | **Tailwind CSS v4 + shadcn/ui (Radix primitives)**, tokens as CSS variables | §8.2 leaves component library to the team. Radix gives the keyboard/focus behaviour required by §16.6 for free. |
| D-05 | **TanStack Query v5** for server state, **Zustand** for live-session state, **React Hook Form + Zod** for forms | Exactly §16.5. |
| D-06 | **TipTap v2** for protocol and document editors (not Lexical) | Node-level attributes let each paragraph carry `sourceSegmentIds`, which is what the traceability panel (§12.3) needs. Lexical would require a custom node registry to do the same. |
| D-07 | **AudioWorklet → PCM `s16le`, 24 000 Hz, mono.** MediaRecorder is not used. | The WS contract in §9.4 declares `pcm_s16le / 24000 / 1`. MediaRecorder can only emit WebM/Opus containers. |
| D-08 | **WaveSurfer.js** for segment playback and the hearing waveform | §8.2. |
| D-09 | **MSW v2** for REST mocking + a local **`mock-ws` Node server** replaying a scripted hearing | Frontend must be demoable before backend exists. One env flag switches to the real API. |
| D-10 | **Auth: in-memory access token + httpOnly refresh cookie.** Refresh on 401, single-flight. | FR-01 allows either; the cookie keeps the refresh token out of JS reach. |
| D-11 | **i18n: uz-Latin only in MVP**, but every string goes through `next-intl` dictionaries from day one | §Phase 4 roadmap adds Russian; retrofitting strings later is the expensive path. |
| D-12 | **Testing: Vitest + Testing Library (unit/component), Playwright (E2E), Storybook 9 (design system + transcript components)** | §16.6 requires component tests and E2E on critical flows. |
| D-13 | **Documents UI is schema-driven**, rendering whatever `input_schema` a template declares (§13.2) | The legal expert has not frozen the document list (§13.1). Hardcoded forms would be thrown away. |
| D-14 | **Admin pages (§16.1 #12–14) are read-only in MVP** | Template approval is a legal-expert process, not a UI feature, in MVP scope. |
| D-15 | **Chrome/Chromium desktop is the only tested target**, Edge best-effort, minimum viewport 1280×800 | NFR-06. No mobile layout work. |

---

## 1. Design system direction

The product's world is the *official record*: registers, stamps, procedural sequence, the moment a spoken sentence becomes a legal fact. The interface should feel like an instrument for producing a record, not a SaaS dashboard.

### 1.1 Palette (6 tokens)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#14161A` | Primary text, spine rail |
| `--paper` | `#FCFCFA` | Application background, document canvas |
| `--rule` | `#DCDDD8` | Hairlines, table borders, pane dividers |
| `--muted` | `#6E7278` | Timestamps, metadata, disabled |
| `--seal` | `#7A1F2B` | **Record state only:** recording indicator, unverified critical field, blocked generation, destructive confirm |
| `--attested` | `#1F5D4C` | Verified segment, approved document, connected STT |

Amber `#8A6212` is the single seventh value, reserved for low-confidence (`confidence < 0.75`) and latency warnings. No other colour enters the product. Colour is never decorative here — every hue means a record state, which is what makes the transcript scannable at a glance after four hours of work.

### 1.2 Typography

**IBM Plex** family, three roles:

- **Plex Sans** — all UI chrome, forms, navigation.
- **Plex Mono** — timestamps, case numbers, sequence numbers, speaker labels, UUID fragments, amounts. Anything the clerk verifies character-by-character is monospaced so digit substitution is visible.
- **Plex Serif** — the protocol and document canvas only. The editor should look like the DOCX it exports.

Plex is chosen over Inter for one hard reason beyond character: it covers `U+02BB` (ʻ) needed for *oʻ / gʻ* in Uzbek Latin. **Verify this in Step 1.4 before committing**; if coverage fails, fall back to Noto Sans/Serif and keep the same three-role structure.

Type scale: `12 / 13 / 14 / 16 / 20 / 28 / 40`. Body 14px, dense. Line-height 1.5 for UI, 1.7 for the document canvas.

### 1.3 Signature element — the record spine

A fixed 56px vertical rail on the left of every hearing-scoped screen (live, transcript, events, protocol, document). It renders the hearing's full duration as a timeline with tick marks for procedural events, a moving playhead, and a shaded band for the currently visible transcript range.

It is the same component on all five screens. Clicking a tick scrubs the audio, scrolls the transcript to the source segment, and highlights the linked protocol paragraph. This turns the abstract principle in §2.2 (source-grounded generation) into a single physical object the clerk manipulates. It is the one bold element; everything else stays quiet.

### 1.4 Motion

Two animations exist in the product:

1. Interim → final segment settle: 120ms opacity + weight transition.
2. Source-trace flash: 200ms `--seal` outline pulse on the linked segments when a document paragraph is selected.

Everything else is instant. `prefers-reduced-motion` disables both.

---

## 2. Repository structure

```text
lexkotib-web/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (app)/
│   │   │   ├── layout.tsx                # shell: spine + nav + header
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   │   ├── page.tsx              # list
│   │   │   │   ├── new/
│   │   │   │   └── [caseId]/
│   │   │   │       ├── page.tsx          # detail
│   │   │   │       ├── participants/
│   │   │   │       └── documents/
│   │   │   ├── hearings/[hearingId]/
│   │   │   │   ├── setup/
│   │   │   │   ├── live/
│   │   │   │   ├── transcript/
│   │   │   │   ├── events/
│   │   │   │   └── protocol/
│   │   │   ├── documents/[documentId]/
│   │   │   └── admin/
│   │   │       ├── templates/
│   │   │       ├── audit/
│   │   │       └── providers/
│   │   └── layout.tsx
│   ├── features/                         # feature-first, not type-first
│   │   ├── auth/
│   │   ├── cases/
│   │   ├── participants/
│   │   ├── hearings/
│   │   ├── audio/                        # capture pipeline
│   │   ├── live-session/                 # WS client + store
│   │   ├── transcript/
│   │   ├── events/
│   │   ├── protocol/
│   │   ├── documents/
│   │   └── audit/
│   ├── components/
│   │   ├── ui/                           # shadcn primitives
│   │   ├── record/                       # spine, timestamp, speaker chip, confidence bar
│   │   └── layout/
│   ├── lib/
│   │   ├── api/                          # http client, endpoints, error envelope
│   │   ├── contracts/                    # Zod schemas mirroring §14 / §15
│   │   ├── query/                        # queryClient, query keys
│   │   ├── ws/                           # protocol types, socket manager
│   │   ├── audio/                        # worklet, encoder, buffer
│   │   └── i18n/
│   ├── mocks/                            # MSW handlers + fixtures
│   └── styles/
├── mock-ws/                              # standalone Node WS replay server
├── e2e/                                  # Playwright
├── public/worklets/pcm-encoder.js
└── docs/adr/
```

**Rule:** a feature folder owns its components, hooks, schemas and tests. Cross-feature imports go through `lib/` or `components/`, never feature→feature.

---

## 3. Phase plan

Twelve phases across ten weeks. Each phase lists steps, deliverables and an exit condition. A phase is not closed until its exit condition is demonstrable in the browser.

---

### PHASE 0 — Foundation (Week 1, days 1–2)

**Spec refs:** §20, §21, §30, D-01…D-04

**Step 0.1 — Initialise project**
- `pnpm create next-app@latest lexkotib-web --ts --app --tailwind --eslint --src-dir --import-alias "@/*"`
- Node 22 LTS pinned in `.nvmrc`, pnpm version pinned in `packageManager`.

**Step 0.2 — TypeScript strictness**
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`.
- `verbatimModuleSyntax: true` so type imports never reach the bundle.

**Step 0.3 — Lint / format / hooks**
- ESLint flat config: `next/core-web-vitals`, `@typescript-eslint` strict-type-checked, `eslint-plugin-import` with a boundary rule forbidding `features/a → features/b`.
- Prettier + `prettier-plugin-tailwindcss`.
- Husky + lint-staged: typecheck changed, lint, format on commit.
- Commitlint, conventional commits. Branches `feature/LK-<n>-<slug>` per §21.

**Step 0.4 — CI (GitHub Actions)**
- Job matrix: `typecheck` → `lint` → `test:unit` → `build` → `test:e2e` (Playwright, Chromium only).
- Upload Playwright trace + video on failure. PR blocked on red.

**Step 0.5 — Environment contract**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8787/ws
NEXT_PUBLIC_USE_MOCKS=true          # MSW + mock-ws
NEXT_PUBLIC_AUDIO_SAMPLE_RATE=24000
NEXT_PUBLIC_AUDIO_CHUNK_MS=250
NEXT_PUBLIC_MAX_BUFFERED_CHUNKS=2400   # 10 minutes offline capacity
```
- `src/lib/env.ts` parses these with Zod at module load. A missing variable fails the build, not runtime.

**Step 0.6 — Docker**
- Multi-stage `Dockerfile` using `output: 'standalone'`. No Vercel dependency — the pilot is on-prem (§27 Phase 2).

**Exit:** `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm e2e` all green in CI on an empty page.

---

### PHASE 1 — Design system and application shell (Week 1, days 3–5)

**Spec refs:** §1 above, §16.1, §16.6

**Step 1.1 — Tokens**
- `src/styles/tokens.css`: the six colours + amber, type scale, spacing scale (4px base), radii (`2px` only — this product has almost no rounding), two shadow levels.
- Tailwind v4 `@theme` block maps tokens to utilities. No raw hex anywhere else in the codebase; ESLint rule to enforce.

**Step 1.2 — Fonts**
- Self-host IBM Plex Sans/Mono/Serif via `next/font/local` (subset Latin + Latin Extended). No Google Fonts CDN — on-prem deployment must work air-gapped.
- **Verify `ʻ` (U+02BB), `Oʻ`, `Gʻ` render correctly** in all three faces before proceeding.

**Step 1.3 — shadcn/ui installation and restyle**
- Install: button, input, select, dialog, dropdown-menu, tabs, table, toast, tooltip, popover, checkbox, badge, separator, scroll-area, command, alert-dialog, sheet, skeleton.
- Restyle every primitive to the tokens in one pass. Default shadcn look must not survive.

**Step 1.4 — Record primitives** (`components/record/`)
- `<Timestamp ms={number} />` — mono, `HH:MM:SS`, click emits a seek event.
- `<SpeakerChip label participantId? role? />` — shows `SPEAKER_02` in mono until mapped, then the procedural role.
- `<ConfidenceBar value />` — 3px bar, amber under 0.75.
- `<RecordStateBadge status />` — covers all FR-11 statuses and segment statuses with fixed colours.
- `<CriticalFieldMark type>` — underline + type icon for F.I.Sh. / sana / summa / ish raqami (§10.3).
- `<RecordSpine />` — the signature element. Props: `durationMs`, `events[]`, `playheadMs`, `visibleRange`, `onSeek`.

**Step 1.5 — Application shell**
- `(app)/layout.tsx`: header (case number, judge, elapsed time, connection state), left nav, optional spine, content, right inspector slot.
- Three global states shipped as components, used everywhere: `<LoadingState />`, `<EmptyState />`, `<ErrorState onRetry />`. §16.6 requires all three.
- Global keyboard map registry so shortcuts can't collide across features.

**Step 1.6 — Storybook**
- Every `components/record/*` and `components/ui/*` gets a story with all states. This is the visual contract for the rest of the build.

**Exit:** Storybook published in CI; shell renders with mock nav; zero default-shadcn styling remains.

---

### PHASE 2 — API layer, contracts and mocking (Week 2, days 1–3)

**Spec refs:** §14, §15, §15.4, D-09

**Step 2.1 — Zod contracts** (`lib/contracts/`)
Mirror §14 tables and §15 payloads, one file per entity:
`user`, `court-case`, `participant`, `hearing`, `audio-track`, `transcript-segment`, `procedural-event`, `document-template`, `generated-document`, `document-version`, `audit-log`, `job`.

All enums declared as Zod enums and exported as TS unions — `CaseStatus`, `HearingStatus`, `SegmentStatus`, `ProceduralEventType` (all 17 values from FR-08), `DocumentStatus` (7 values from FR-11), `ParticipantRole`.

**Step 2.2 — HTTP client** (`lib/api/http.ts`)
- Thin `fetch` wrapper. Responsibilities: base URL, JSON, `Authorization` header injection, `X-Request-Id` generation, timeout via `AbortController` (10s default, 60s for generation calls).
- Parses the §15.4 error envelope into a typed `ApiError { code, message, details[], requestId }`. Every non-2xx becomes an `ApiError` — no raw fetch errors leak into components.
- 401 → single-flight refresh → retry once → on second failure, hard logout.

**Step 2.3 — Endpoint modules** (`lib/api/endpoints/`)
One function per §15.1 endpoint, each parsing its response through the Zod schema. A backend contract drift becomes a loud parse error in development, not a silent `undefined` in the UI.

**Step 2.4 — Query layer**
- `queryKeys` factory: `['cases']`, `['cases', id]`, `['hearings', id, 'transcript']`, etc. No inline key arrays anywhere.
- Defaults: `staleTime: 30_000`, `retry: 2` with exponential backoff, `retry: false` for mutations.
- **Optimistic updates are permitted only for:** transcript segment text edit, speaker assignment, verify toggle. **Forbidden for:** document approval, submit-review, export, hearing start/stop (§16.5).

**Step 2.5 — MSW handlers + fixtures**
- Handlers for all §15.1 endpoints.
- Fixtures: one full synthetic economic-court case — 4 participants, 1 hearing of 34 minutes, ~420 transcript segments, 22 procedural events, 1 protocol, 2 documents. This fixture is also the demo dataset (§25) and the E2E dataset. Build it once, correctly.
- Scenario toggles readable from a dev toolbar: `slow-network`, `validation-error`, `generation-blocked`, `job-fails`, `empty-account`.

**Step 2.6 — Job polling hook**
`useJob(jobId)` polls `GET /jobs/{job_id}` at 1s, backing off to 3s after 30s, surfacing `QUEUED / RUNNING / SUCCEEDED / FAILED` with progress. Used by final transcription, event extraction, document generation and export.

**Exit:** every endpoint callable against MSW with typed responses; a deliberate contract break fails a unit test.

---

### PHASE 3 — Authentication and RBAC (Week 2, days 4–5)

**Spec refs:** FR-01, §4

**Step 3.1 — Login page**
- Email + password, RHF + Zod, inline errors, disabled-with-spinner submit, no page reload.
- Demo account hints visible only when `NEXT_PUBLIC_USE_MOCKS=true`.

**Step 3.2 — Session**
- Access token held in a Zustand store in memory only. Never localStorage — §NFR-01 treats this data as sensitive.
- Refresh token in httpOnly cookie set by backend; `POST /auth/refresh` on 401 and on app boot.
- `GET /auth/me` hydrates user + role on boot; a `<SessionGate>` blocks render until resolved.

**Step 3.3 — Route protection**
- `middleware.ts` redirects unauthenticated requests to `/login?next=...` based on cookie presence.
- Client-side `<RoleGate allow={['CLERK','ADMIN']}>` for finer control. Roles per §4: `ADMIN`, `CLERK`, `JUDGE`, `LEGAL_EXPERT`, `DEMO_OPERATOR`.

**Step 3.4 — Role-to-capability map**
A single `capabilities.ts` translating role → permissions (`case.create`, `hearing.record`, `transcript.edit`, `document.approve`, `admin.audit.read`, …). Components ask for capabilities, never for roles. When the judge role gains powers later, one file changes.

**Step 3.5 — Idle and logout**
- 30-minute idle → confirmation dialog → logout. A hearing that is actively recording suppresses idle logout.
- Logout clears the query cache entirely.

**Exit:** four demo accounts log in and see role-appropriate navigation; direct URL access to a forbidden route is refused.

---

### PHASE 4 — Cases and participants (Week 3)

**Spec refs:** FR-02, UC-01, §14.2, §14.3, §9.7

**Step 4.1 — Case list**
- Data table: case number (mono), court, type, status, participant count, last hearing, updated.
- Server-driven pagination, debounced search (400ms), filters by status/type, sortable columns, URL-synced state via `nuqs` so a filtered view is shareable.
- Empty state directs to case creation.

**Step 4.2 — Case creation (3-step wizard)**
1. Case details — case number, court, court type, case type, judge.
2. Participants — repeatable rows: display name, organization, procedural role, identifier. Minimum one claimant and one defendant enforced by Zod.
3. Review — read-only summary, then create.

Wizard state lives in a Zustand store with `sessionStorage` persistence so an accidental refresh doesn't destroy 10 minutes of typing. Cross-step validation runs before step advance.

**Step 4.3 — Case detail**
Tabs: Overview / Participants / Hearings / Documents / Vocabulary.
Header shows case number, status badge, archive action behind a confirmation dialog (§16.6 requires confirmation on audited actions).

**Step 4.4 — Participants management**
Inline add/edit/delete with optimistic update and rollback. Role select drawn from `ParticipantRole` enum. Deleting a participant referenced by transcript segments is blocked with an explanatory message, not a generic error.

**Step 4.5 — Vocabulary panel (§9.7)**
Read-only list of auto-derived terms with weights, grouped by origin (participants / organizations / document numbers / legal terms). Manual term addition with weight `1.0`. This directly improves STT accuracy, so it is prominent, not hidden in settings.

**Exit:** UC-01 completes end to end against mocks, including refresh-resilience mid-wizard.

---

### PHASE 5 — Audio capture pipeline (Week 4, days 1–3)

**Spec refs:** FR-04, §9.3, §9.4, §9.5, D-07

This is the highest technical risk in the frontend. It is built and proven standalone, before any UI depends on it.

**Step 5.1 — Device management**
- `navigator.mediaDevices.enumerateDevices()` with a permission-first flow: explain why the microphone is needed *before* triggering the browser prompt.
- Three permission states handled explicitly: prompt / granted / denied. Denied shows Chrome-specific recovery instructions.
- `devicechange` listener: if the active device disappears mid-hearing, recording pauses and a blocking dialog offers device reselection. Recording never silently continues on the wrong microphone.

**Step 5.2 — Capture graph**
```
getUserMedia({ audio: { channelCount: 1, echoCancellation: false,
                        noiseSuppression: false, autoGainControl: false } })
  → MediaStreamSource
  → AnalyserNode        (level meter only, never in the data path)
  → AudioWorkletNode    (pcm-encoder.js)
  → postMessage(Int16Array)
```
Echo cancellation, noise suppression and AGC are **off**: they are tuned for calls and damage multi-speaker courtroom audio and diarization quality.

**Step 5.3 — PCM worklet** (`public/worklets/pcm-encoder.js`)
- Receives Float32 at the context rate (typically 48 000 Hz).
- Downsamples to 24 000 Hz with a simple low-pass + decimation.
- Converts to `Int16` little-endian, clamped.
- Accumulates to exactly `AUDIO_CHUNK_MS` (250ms = 6 000 samples = 12 000 bytes) and posts to the main thread.
- Zero allocation in `process()` — pre-allocated ring buffers only.

**Step 5.4 — Chunk manager** (`features/audio/chunk-manager.ts`)
- Assigns a monotonic `sequence` and `timestamp_ms` per chunk.
- Base64-encodes for the §9.4 `audio.chunk` payload.
- Maintains an in-memory ring buffer of unacknowledged chunks capped by `MAX_BUFFERED_CHUNKS`.
- Overflows spill to **IndexedDB** (`lexkotib-audio` store, keyed `hearingId:sequence`) per §9.5.
- Exposes `pendingCount`, `droppedCount`, `bytesBuffered` for the UI.

**Step 5.5 — Level meter**
RMS from the analyser at 20fps via `requestAnimationFrame`. Silence detection: RMS below threshold for 15 continuous seconds raises a "microphone may be muted" warning (FR-04 mute detection).

**Step 5.6 — Audio file upload path**
Drag-and-drop upload for the demo fallback (§25). Accepts wav/mp3/m4a, shows duration and size, uploads with progress, and routes into the same finalize flow. **This is a required demo fallback, not a nice-to-have.**

**Step 5.7 — Standalone spike page**
`/dev/audio` (dev builds only): device picker, level meter, live chunk counter, buffer depth, local playback of the last 30 seconds decoded back from PCM. Proves the pipeline without the backend.

**Exit:** 30 continuous minutes of capture with no memory growth, no dropped chunks, correct sequence continuity across a manual device switch.

---

### PHASE 6 — Live hearing screen (Week 4 day 4 — Week 5)

**Spec refs:** FR-03, FR-05, §9.4, §9.5, §16.2, UC-02, AC-01, AC-02, NFR-03

**Step 6.1 — WebSocket protocol types** (`lib/ws/protocol.ts`)
Discriminated unions for both directions, exactly matching §9.4:
- Client → server: `audio.session.start`, `audio.chunk`, `audio.session.stop`.
- Server → client: `transcript.interim`, `transcript.final`, `session.warning`, plus `ack` carrying `last_ack_sequence` (§9.5).
Every inbound message is Zod-parsed. An unrecognized message type is logged and ignored, never thrown.

**Step 6.2 — Socket manager** (`lib/ws/socket-manager.ts`)
Explicit state machine:
```
IDLE → CONNECTING → OPEN → STREAMING → PAUSED → STOPPING → CLOSED
                       ↘ RECONNECTING ↗
```
- Exponential backoff: 0.5s, 1s, 2s, 4s, 8s, capped at 10s, unlimited attempts while a hearing is active.
- On reconnect: send `audio.session.start` with `resume: true`, wait for `last_ack_sequence`, replay everything after it from the ring buffer / IndexedDB in order.
- Heartbeat ping every 15s; no pong within 10s counts as a dead connection.
- The socket never lives inside a React component. Components subscribe to the store.

**Step 6.3 — Live session store (Zustand)**
Slices: `connection` (state, latency, reconnect count, dropped chunks), `session` (hearing id, status, elapsed, provider metadata), `transcript` (final segments array + interim map keyed by `segment_key`).

Interim segments are stored in a `Map`, not the array. When a `transcript.final` arrives with a matching key, the interim is deleted and the final appended atomically — this prevents the duplicate-flash that plagues naive live transcript UIs.

**Step 6.4 — Screen layout** (implements the §16.2 wireframe exactly)
```
┌──────────────────────────────────────────────────────────────┐
│ Ish № 4-2101-2604/13 | Sudya | 00:14:22 | ● Yozilmoqda | STT │
├──────┬───────────────┬───────────────────────────────────────┤
│      │ Ishtirokchilar│ Jonli transkript                      │
│spine │ Sudya         │ [00:01:10] Sudya                      │
│      │ Kotib         │ Sud majlisi ochiq deb e'lon qilinadi  │
│      │ Da'vogar vak. │                                       │
│      │ Javobgar vak. │ [00:01:18] SPEAKER_02   (interim…)    │
├──────┴───────────────┴───────────────────────────────────────┤
│ Daraja ▮▮▮▯ │ Pauza │ To'xtatish │ Ulanish │ Yo'qolgan: 0    │
└──────────────────────────────────────────────────────────────┘
```

**Step 6.5 — Live transcript rendering**
- Interim text: `--muted`, italic, no timestamp badge. Final: full `--ink`, mono timestamp, speaker chip.
- Auto-scroll with **scroll lock** (FR-05): scrolling up disengages auto-scroll and shows a "Jump to latest (N new)" pill.
- Windowed rendering above 200 segments (`@tanstack/react-virtual`).
- Latency indicator derived from `now − end_ms` on the last final segment, coloured against the NFR-03 targets: green under 2.5s, amber under 6s, `--seal` beyond.

**Step 6.6 — Controls**
Start / Pause / Resume / Stop wired to §15.1 hearing endpoints and the socket state machine. Stop requires confirmation and shows a progress dialog while the buffer flushes — closing the tab during flush triggers `beforeunload`.

**Step 6.7 — Resilience UX (AC-02)**
- Offline banner with buffered-seconds counter.
- Reconnect toast showing attempt number.
- Post-reconnect summary: "42 sekundlik audio qayta yuborildi."
- Discontinuity marker rendered inline in the transcript where the backend reports a gap.

**Step 6.8 — `mock-ws` server**
Node + `ws`. Replays the fixture hearing with realistic timing: interim deltas every ~300ms, finalization every 3–8s, `confidence` jitter. CLI flags: `--drop-after=120` (simulate disconnect), `--latency=2500`, `--warn=HIGH_LATENCY`. This server is what makes Phase 6 testable and demoable without backend.

**Exit:** AC-01 and AC-02 satisfied against `mock-ws`: 30 minutes of continuous live transcript, one forced disconnect fully recovered with zero lost audio.

---

### PHASE 7 — Transcript review and editor (Week 6)

**Spec refs:** FR-06, FR-07, UC-03, UC-05, §16.3, AC-03

**Step 7.1 — Finalize flow**
After stop: trigger `POST /hearings/{id}/finalize`, show job progress via `useJob`, then route to `/hearings/{id}/transcript`. The screen is usable in read-only mode while the job runs.

**Step 7.2 — Virtualized segment list**
`@tanstack/react-virtual`, target 5 000 segments at 60fps. Each row: timestamp, speaker chip, text, confidence bar, critical-field marks, verify checkbox. Row height is measured, not fixed, because edited text reflows.

**Step 7.3 — Segment editing**
- Inline contenteditable-free approach: click to enter an edit state with a plain textarea (predictable IME behaviour for Uzbek/Russian input).
- Original ASR text is always preserved and viewable via a "asl matn" toggle (UC-05 step 4).
- Debounced autosave (800ms) with an explicit save-state indicator: `Saqlanmoqda… / Saqlandi / Saqlanmadi — qayta urinish`.
- Split at cursor position; merge selected adjacent segments. Both are optimistic with rollback.

**Step 7.4 — Speaker mapping (UC-03, AC-03)**
A dedicated modal listing every distinct `speaker_label` with sample utterances and a 5-second audio preview per label. The clerk maps each label to a participant once; the mapping applies to all segments in a single mutation with an undo toast. Progress indicator: "4 tadan 3 tasi bog'landi."

**Step 7.5 — Audio playback**
WaveSurfer instance loading the hearing audio once; segment playback seeks a region rather than loading per-segment files. `Space` plays/pauses the focused segment. Playhead position feeds the record spine.

**Step 7.6 — Critical field review (§10.3)**
- Marks for F.I.Sh., organization, case number, date, time, amount, percent, document number, law article, address.
- A dedicated review queue: "Tekshirilmagan kritik maydonlar: 14" with next/previous navigation (`Alt+↓` / `Alt+↑`).
- Mismatch against case-card data is flagged in `--seal` with both values shown side by side.

**Step 7.7 — Filters and search**
Filter chips: unverified / low confidence / critical fields / speaker / edited. Full-text search with match highlighting and `Enter`/`Shift+Enter` navigation.

**Step 7.8 — Keyboard model**
`J`/`K` next-prev segment, `E` edit, `V` verify, `S` split, `M` merge, `P` play, `Ctrl+Z`/`Ctrl+Shift+Z` undo-redo (feature-local undo stack, 50 entries), `?` shortcut sheet. Documented in the help sheet, not folklore.

**Step 7.9 — Canonical approval**
"Canonical transkriptni tasdiqlash" is blocked until every critical field is reviewed. The blocking dialog lists precisely what remains, with jump links. Approval is non-optimistic (§16.5).

**Step 7.10 — Concurrency**
On mutation conflict (`409`), show a non-destructive banner: "Bu segment boshqa foydalanuvchi tomonidan o'zgartirildi" with view-theirs / keep-mine options. Never silently overwrite.

**Exit:** UC-05 complete; canonical transcript approvable; 5 000-segment fixture scrolls and edits without jank.

---

### PHASE 8 — Procedural events review (Week 7, days 1–2)

**Spec refs:** FR-08, §11, UC-06 steps 1–3

**Step 8.1 — Extraction trigger**
`POST /hearings/{id}/events/extract`, job progress, results streamed into the events view. Disabled with an explanation until canonical transcript is approved.

**Step 8.2 — Event timeline**
Chronological list grouped by phase. Each card: event type badge (17 types, FR-08), speaker/participant, time range, `normalized_summary`, confidence, review status.

**Step 8.3 — Source panel**
Expanding a card reveals `verbatim_text` and its source segments, each clickable to jump the transcript and audio. **An event with no source segments renders as an error, not as data** — §11.3 forbids it, and the UI must make a backend violation visible.

**Step 8.4 — Human review**
Edit event type, participant and summary; verify; delete false positives; add a manual event by selecting transcript segments. Events with `requires_human_review=true` are pinned to the top and counted in a progress bar.

**Step 8.5 — Spine integration**
Verified events become ticks on the record spine, coloured by category. This is the moment the signature element earns its place.

**Exit:** every extracted event reviewable and traceable to source; unsourced events surfaced as errors.

---

### PHASE 9 — Protocol (bayonnoma) editor (Week 7 day 3 — Week 8 day 2)

**Spec refs:** FR-09, §12, UC-06, §16.4

**Step 9.1 — Generation gate (§12.4)**
Before enabling generation, the UI checks and displays all seven blocking conditions as a checklist: canonical transcript approved, participants known, hearing start/end present, required events unambiguous, template version active, no critical field conflicts, required procedural ruling present in source. Each failed item links to its fix. **Generation is never attempted when a precondition fails.**

**Step 9.2 — TipTap editor configured for a legal document**
- Custom node attributes on every block: `sourceSegmentIds: string[]`, `sourceEventIds: string[]`, `origin: 'template' | 'ai' | 'human'`, `templateSectionCode`.
- Serif canvas, A4-proportioned column, page-like padding. What you edit resembles what exports.
- Restricted toolbar: headings, bold, italic, ordered/unordered list, table. No colours, no fonts, no arbitrary styling — the template owns the design.

**Step 9.3 — Section navigator**
Left rail listing the §12.2 blocks (court requisites, date/time/place, court composition, clerk, participants, attendance, opening, rights explained, explanations, motions and objections, evidence, procedural actions announced, break/postponement, closing, attesting requisites). Each shows filled / missing / needs-review, with jump-to-section.

**Step 9.4 — Traceability inspector (§12.3)**
Right panel, driven by cursor position. For the current paragraph: source segments, timestamps, inline audio playback, confidence, verified state. Selecting a paragraph flashes its sources in the mini-transcript — the one place the source-trace motion is used.

**Step 9.5 — Origin visualisation**
AI-generated paragraphs carry a subtle left border; human-edited ones lose it and gain an editor+timestamp on hover. The clerk can always tell what the machine wrote.

**Step 9.6 — Missing-field panel**
Enumerates unfilled required fields with jump links. Submit-for-review is disabled while any remain, with the count shown on the disabled button.

**Step 9.7 — Versions**
Version selector with side-by-side diff between any two versions (word-level). Read-only for historical versions.

**Exit:** UC-06 complete; a protocol draft is generated, traced, edited and submitted for review.

---

### PHASE 10 — Documents and approval workflow (Week 8 day 3 — Week 9 day 2)

**Spec refs:** FR-10, FR-11, §13, UC-07, AC-05, AC-06

**Step 10.1 — Template catalogue**
`GET /document-templates` rendered as cards: title, `template_code`, version, status, approval metadata (§13.2). Inactive templates are visible but non-selectable with the reason shown.

**Step 10.2 — Schema-driven generation form (D-13)**
Renders inputs from the template's `input_schema`:
- Fields auto-filled from case card / transcript / events are marked with their origin and are read-only by default, with an explicit "override" action that records the change.
- Fields with no source are empty and clearly marked "manbadan topilmadi".
- **The form never invents a value.** This is the UI-side enforcement of §2.2 and AC-05.

**Step 10.3 — Validation and blocking**
Rules-engine errors from §15.4 map to fields with the Uzbek messages the backend returns. If any required field lacks a source, generation is blocked with a panel explaining precisely which and why — not a generic toast.

**Step 10.4 — Generation and job tracking**
`POST /cases/{id}/documents/generate` → `{document_id, job_id}` → poll → open the document editor. Failure states are actionable (retry / edit inputs / contact admin).

**Step 10.5 — Document editor**
Same TipTap infrastructure as Phase 9, with the template's section structure. Shares the traceability inspector, missing-field panel and version selector components.

**Step 10.6 — Approval workflow (FR-11)**
- Status machine rendered as a stepper: `DRAFT → AI_GENERATED → UNDER_REVIEW → CHANGES_REQUESTED → APPROVED → EXPORTED → ARCHIVED`.
- Actions gated by capability: clerk submits, judge approves or requests changes.
- Request-changes requires a reason (min 10 characters) — it becomes the notification and the audit record.
- Approve shows a confirmation dialog naming the document and template version. **No optimistic update** (§16.5). After approval the editor becomes read-only and locked.

**Step 10.7 — Export**
`POST /documents/{id}/export` with DOCX/PDF choice, job progress, download via signed URL (never a blob built client-side — NFR-01 routes file access through backend/signed URLs). PDF preview in an embedded viewer before download.

**Exit:** UC-07 complete for two document types; AC-05 demonstrated — a missing source blocks generation; AC-06 demonstrated — approval locks the document.

---

### PHASE 11 — Admin views (Week 9, day 3)

**Spec refs:** §4.1, FR-12, §16.1 #12–14, NFR-05

**Step 11.1 — Template catalogue (read-only)** — all templates, versions, status, approver, approval date.

**Step 11.2 — Audit log** — virtualized table over the FR-12 record shape. Filters: actor, action, entity type, date range. Row expansion shows the `before`/`after` JSON diff. Export to CSV.

**Step 11.3 — Provider and system status** — active live/final STT provider and model, latency, reconnect count, queue depth, error rate, model and prompt versions (NFR-05). Read-only.

**Exit:** an auditor can reconstruct who changed what, when, from the UI alone.

---

### PHASE 12 — Hardening, demo and acceptance (Week 9 day 4 — Week 10)

**Spec refs:** §16.6, §23, §24.3, §25, NFR-03, NFR-06

**Step 12.1 — Accessibility and keyboard pass**
Full keyboard navigation of every flow, visible focus rings on the `--paper` background, correct roles and labels on custom components (spine, segment rows, confidence bars), `prefers-reduced-motion` honoured, axe clean on all 14 pages.

**Step 12.2 — Error, loading and empty state audit**
Every route and every query gets all three states, verified manually with the MSW scenario toolbar. No unhandled promise rejections; a global error boundary per route group with a request-id-bearing report action.

**Step 12.3 — Performance**
- Route-level code splitting; TipTap, WaveSurfer and the audit table are lazy-loaded.
- Budgets: initial JS under 250 KB gzipped; live transcript sustains 60fps at 2 000 segments; transcript screen interactive within 1.5s on the fixture.
- 4-hour soak test of the live screen watching heap growth.

**Step 12.4 — Playwright E2E (§24.3)**
1. Login → create case → add participants → create hearing.
2. Start hearing → receive live transcript from `mock-ws` → forced disconnect → recovery → stop.
3. Finalize → speaker mapping → edit segments → review critical fields → approve canonical.
4. Extract events → verify → generate protocol → edit → submit.
5. Generate a repetitive document → blocked by a missing field → fix → generate → approve → export.
6. Role checks: judge cannot edit transcript; clerk cannot approve.

**Step 12.5 — Demo mode (§25)**
- One-command dataset reset.
- Audio-file fallback path verified (the primary demo risk).
- A demo checklist covering the ten points in §25, timed to 5–7 minutes.
- Explicit rule enforced in the build: no pre-baked result is ever presented as live output.

**Step 12.6 — Frontend Definition of Done sign-off (§16.6)**
TypeScript strict ✓ · component tests ✓ · E2E critical flows ✓ · network error states ✓ · loading/empty/error ✓ · keyboard navigation ✓ · microphone permission UX ✓ · device-change re-detection ✓ · confirmation on audited actions ✓ · responsive desktop layout ✓.

**Exit:** the §31 frontend-relevant Definition of Done items are demonstrable with an audio file the team has never seen.

---

## 4. Schedule

| Week | Phases | Milestone |
|---|---|---|
| 1 | 0, 1 | Toolchain green, design system in Storybook |
| 2 | 2, 3 | Typed API against mocks, login and RBAC |
| 3 | 4 | Cases and participants complete (UC-01) |
| 4 | 5, 6 (start) | Audio pipeline proven, WS client connected |
| 5 | 6 | Live hearing screen, AC-01 and AC-02 |
| 6 | 7 | Transcript editor, canonical approval (UC-05) |
| 7 | 8, 9 (start) | Events reviewed, protocol generation gated |
| 8 | 9, 10 (start) | Protocol editor with traceability (UC-06) |
| 9 | 10, 11 | Documents, approval, export, admin (UC-07) |
| 10 | 12 | Hardening, E2E, demo rehearsal |

Phases 5 and 6 carry the most risk. If they slip, cut Phase 11 (admin views) first, then Phase 9's version diff — never the audio resilience work in 5.7 and 6.7, which is what the tender demo actually tests.

---

## 5. Frontend risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Backend WS contract drifts from §9.4 | High | Zod-parse every message; contract tests against the fixture; `mock-ws` is the reference implementation |
| AudioWorklet behaves differently across Chrome versions | High | Pin tested Chrome versions; keep the `/dev/audio` spike page permanently |
| Live transcript re-render storms | Medium | Interim in a Map, virtualization, store selectors with shallow compare |
| Long hearings leak memory | High | Ring buffer with hard cap, IndexedDB spill, 4-hour soak test |
| Uzbek `ʻ` renders as a box | Medium | Verified in Step 1.2 before any UI is built |
| Clerk loses edits to a refresh | Medium | Debounced autosave + sessionStorage on the case wizard |
| Backend not ready by Week 4 | High | MSW + `mock-ws` make every phase independently demoable |
| Demo microphone fails on the day | High | Audio-upload fallback built in Step 5.6, rehearsed in 12.5 |

---

## 6. What this plan deliberately excludes

Mobile layouts, Safari/Firefox support, real-time speaker identification (§9.6 makes it optional), multi-channel audio UI, the judge research assistant (§27 Phase 3), template editing, E-IMZO, and Russian localisation. All are Phase 2+ per the specification.
