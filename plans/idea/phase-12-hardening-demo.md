# Phase 12 — Hardening, E2E and Demo

**Duration:** Week 9 day 4 — Week 10
**Spec refs:** §16.6, §23, §24.3, §25, NFR-01, NFR-03, NFR-06, §31
**Prerequisites:** all previous phases

**Goal:** the system survives an audio file the team has never heard, on a machine the team does not control, in front of people who will not wait for a reload.

This phase adds almost no features. It removes the reasons a demo fails.

---

## Step 12.1 — Accessibility and keyboard pass

§16.6 requires keyboard navigation. In this product it is not a compliance checkbox — a clerk verifying 400 segments works from the keyboard or does not finish.

**12.1.1 — Focus visibility**
`--paper` is a light background; default focus rings on it are nearly invisible. Define one focus treatment in `tokens.css` — a 2px `--ink` outline with a 2px `--paper` offset — and apply it globally through `:focus-visible`. Verify against every interactive element, especially the custom ones: segment rows, spine ticks, speaker chips, confidence bars.

**12.1.2 — Semantics for custom components**
- `<RecordSpine>` — `role="slider"`, `aria-valuemin/max/now` in seconds, `aria-label="Majlis vaqti bo'yicha harakat"`, arrow-key seek.
- Segment list — `role="list"` / `listitem`, each row labelled with speaker and timestamp so a screen reader announces "Sudya, 00:01:10, segment tasdiqlanmagan".
- `<ConfidenceBar>` — `role="meter"` with `aria-valuetext` in words, not just a number.
- Editors — TipTap surfaces get `aria-label` naming the section being edited.

**12.1.3 — Focus management**
Dialogs trap focus and restore it to the trigger on close (Radix handles this; verify it is not broken by custom portals). Route changes move focus to the page heading. Toasts are `aria-live="polite"`; blocking errors are `assertive`.

**12.1.4 — Reduced motion**
The two animations defined in the design system (interim→final settle, source-trace flash) are disabled under `prefers-reduced-motion: reduce`. The source-trace flash is replaced by a persistent outline, not removed — the information it carries is functional, not decorative.

**12.1.5 — Audit**
`axe-core` run over all 14 pages via a Playwright fixture. Zero critical and serious violations. Moderate violations are triaged with a written decision, not silently accepted.

---

## Step 12.2 — State audit

Walk every route and every query with the MSW scenario toolbar built in Phase 02. For each, confirm three states exist and are correct:

| Route | Loading | Empty | Error |
|---|---|---|---|
| Dashboard | ☐ | ☐ | ☐ |
| Case list | ☐ | ☐ | ☐ |
| Case detail | ☐ | n/a | ☐ |
| Hearing setup | ☐ | ☐ | ☐ |
| Live hearing | ☐ | ☐ | ☐ |
| Transcript | ☐ | ☐ | ☐ |
| Events | ☐ | ☐ | ☐ |
| Protocol | ☐ | ☐ | ☐ |
| Documents list | ☐ | ☐ | ☐ |
| Document editor | ☐ | n/a | ☐ |
| Admin × 3 | ☐ | ☐ | ☐ |

**Error boundaries:** one per route group, each showing a message, the request id in mono, and a retry. A boundary that only says "Xatolik yuz berdi" is not finished.

**Unhandled rejections:** add a global `unhandledrejection` listener that logs in development and reports in production. Run the full E2E suite with the console failing the test on any unhandled rejection — this catches the fire-and-forget mutations that survive manual testing.

**Copy review:** read every error message aloud. Each must say what happened and what to do next, in the interface's voice. "Ulanish uzildi, qayta ulanmoqda (3-urinish)" is finished; "Network error" is not.

---

## Step 12.3 — Performance

**12.3.1 — Bundle budgets**
Enforce in CI with `size-limit`:

| Bundle | Budget |
|---|---|
| Initial JS (login → dashboard) | 250 KB gzipped |
| Live hearing route | +120 KB |
| Transcript route (with WaveSurfer) | +180 KB |
| Editor routes (with TipTap) | +200 KB |

Lazy-load TipTap, WaveSurfer, the diff engine and the virtualized audit table. None of them belong in the initial chunk. Verify with `@next/bundle-analyzer` and record the baseline in `docs/perf-baseline.md`.

**12.3.2 — Runtime targets**

| Measure | Target | Method |
|---|---|---|
| Live transcript at 2 000 segments | sustained 60fps | Chrome performance profile, 3 min recording |
| Transcript route interactive | under 1.5s on the fixture | Playwright trace |
| Segment edit keystroke → paint | under 50ms | React Profiler |
| Speaker mapping applied to 400 segments | under 300ms | manual timing |

**12.3.3 — Soak test**
Run the live hearing screen against `mock-ws` for **four hours**. Sample heap every five minutes. Acceptance: final heap within 20% of the one-hour mark, with no monotonic growth trend.

This single test is the highest-value item in the phase. A memory leak surfaces at minute 90 of a hearing, which is exactly when a leak is least recoverable and most visible.

**12.3.4 — Fixes, in priority order**
Store selectors with shallow compare before memoization. Memoization before virtualization tuning. Never optimise by removing the Zod parsing on WebSocket messages — that boundary is what keeps a backend contract change from becoming a silent data corruption.

---

## Step 12.4 — Playwright E2E suite (§24.3)

Six specs, run against MSW + `mock-ws` in CI, Chromium only (NFR-06). Every spec uses the single shared fixture built in Phase 02.

**`e2e/01-case-creation.spec.ts`**
Login as clerk → create case → add four participants → verify vocabulary auto-populated → create hearing → land on setup. Asserts UC-01.

**`e2e/02-live-hearing.spec.ts`**
Start hearing → assert interim segments appear and are visually distinct → assert final segments replace interims without duplication → assert latency indicator is within the NFR-03 green band → stop → assert finalize job starts. Asserts AC-01.

**`e2e/03-resilience.spec.ts`**
Start hearing → `mock-ws --drop-after=60` forces a disconnect → assert the offline banner and buffered-seconds counter appear → reconnection → assert replay summary and that segment sequence has no gap → assert the discontinuity marker renders. Asserts AC-02.

**`e2e/04-transcript-review.spec.ts`**
Open finalized transcript → map four speakers → edit a segment and assert the original ASR text is still retrievable → split then merge → navigate the critical-field queue to zero → attempt canonical approval with one field unreviewed and assert it is blocked with a specific list → complete → approve. Asserts AC-03 and UC-05.

**`e2e/05-protocol-and-document.spec.ts`**
Extract events → assert an event with no source segments renders as an error → verify events → generate protocol → assert every AI paragraph exposes source segments in the inspector → edit → submit for review → switch to judge → approve → export DOCX. Asserts AC-04 and AC-06.

**`e2e/06-generation-blocking.spec.ts`**
Attempt to generate an execution writ with a missing required field → assert generation is blocked, the specific field is named, and **no value was invented anywhere in the form** → fill the field manually → generate → assert the manual origin is recorded on that field. Asserts AC-05.

**Role assertions** run inside specs 04 and 05 rather than as a separate spec: judge cannot edit transcript segments; clerk cannot approve a document.

**CI configuration:** retries 1, trace and video on first retry, 20-minute timeout for the suite. A flaky test is quarantined with an issue, never re-run until green.

---

## Step 12.5 — Demo readiness (§25)

The demo is 5–7 minutes and shows ten things. Everything below exists to make those seven minutes survive contact with a stranger's laptop.

**12.5.1 — Dataset reset**
`pnpm demo:reset` restores the fixture case to its initial state in one command, under five seconds, with no manual database step. Run it between rehearsals until it is boring.

**12.5.2 — Fallback paths, each rehearsed at least twice**

| Failure | Fallback | Built in |
|---|---|---|
| Microphone unavailable or denied | Audio file upload | Phase 05 Step 5.6 |
| STT provider unreachable | Backend switches provider; UI shows the new provider name in the header | Phase 06 |
| Network drops mid-hearing | Buffer, reconnect, replay | Phase 06 Step 6.7 |
| Venue network absent entirely | Full local stack: MSW + `mock-ws` + local backend | Phase 02, 06 |

**The rule from §25 is absolute:** a pre-recorded result is never presented as live output. If the live path fails, the operator says so and switches to the upload path, which is a real path through the real system. Add a visible `DEMO` badge in the header whenever `NEXT_PUBLIC_USE_MOCKS=true` so a mocked run can never be mistaken for a live one, by the audience or by the team.

**12.5.3 — Demo script** (`docs/demo-script.md`)

| # | Beat | Screen | Target |
|---|---|---|---|
| 1 | Case card with participants and vocabulary | Case detail | 0:00–0:40 |
| 2 | Live Uzbek speech | Live hearing | 0:40–2:10 |
| 3 | Interim → final transcript delta | Live hearing | within beat 2 |
| 4 | Speaker mapping | Transcript | 2:10–2:50 |
| 5 | Critical field highlight and review | Transcript | 2:50–3:40 |
| 6 | Protocol draft generated | Protocol | 3:40–4:40 |
| 7 | Repetitive document generated | Document | 4:40–5:30 |
| 8 | Source trace — paragraph back to audio | Protocol | 5:30–6:10 |
| 9 | Human approval | Document | 6:10–6:40 |
| 10 | DOCX / PDF export | Document | 6:40–7:00 |

Beat 8 is the one that wins the tender. It is the visible proof of §2.2, and it is what no competitor demo will have. Rehearse the click path — spine tick → segment → audio playback → linked paragraph — until it takes six seconds.

**12.5.4 — Machine checklist**
Chrome version pinned and recorded. Microphone permission pre-granted for the demo origin. Display scaling at 100%, resolution at least 1440×900. Notifications and auto-update disabled. Zoom at 110% for audience legibility, with the layout verified at that zoom.

---

## Step 12.6 — Frontend Definition of Done sign-off (§16.6)

Each item requires a named person and a date, not a checkmark.

| Requirement | Evidence |
|---|---|
| TypeScript strict | `tsc --noEmit` clean, zero `@ts-expect-error` without a linked issue |
| Component tests | Vitest suite green, `components/record/*` and all editors covered |
| E2E critical flows | Six Playwright specs green in CI |
| Network error state | State audit table in Step 12.2 complete |
| Loading / empty / error | Same table |
| Keyboard navigation | Step 12.1 pass, every flow completed without a mouse |
| Microphone permission UX | Denied, granted and revoked-mid-hearing paths all rehearsed |
| Audio device change re-detection | Device unplugged mid-recording pauses and prompts |
| Confirmation on audited actions | Archive, stop hearing, approve, request changes, export |
| Responsive desktop layout | Verified at 1280×800, 1440×900, 1920×1080 and 110% zoom |

---

## Step 12.7 — Handover documentation

Written during this phase, not after:

- `docs/adr/` — one ADR per D-01…D-15 decision, plus any taken during the build
- `docs/frontend-architecture.md` — data flow, state ownership, the WebSocket state machine diagram
- `docs/audio-pipeline.md` — the PCM path end to end, the reasons AGC and noise suppression are disabled, browser constraints
- `docs/demo-script.md` — Step 12.5.3
- `docs/perf-baseline.md` — bundle sizes and runtime measurements at handover
- `README.md` — setup in under ten commands, including `mock-ws` and `demo:reset`

The audio pipeline document matters most. It is the part of this frontend that a new developer cannot infer from the code, and the part where a well-meaning change (re-enabling noise suppression, switching to MediaRecorder for convenience) silently destroys transcription quality.

---

## Exit criteria

- [ ] axe clean — zero critical and serious violations across all 14 pages
- [ ] Every flow completable with keyboard only
- [ ] `prefers-reduced-motion` honoured; the source-trace flash degrades to a persistent outline
- [ ] State audit table fully checked
- [ ] No unhandled promise rejections during the full E2E run
- [ ] Bundle budgets met and enforced in CI
- [ ] Live transcript holds 60fps at 2 000 segments
- [ ] Four-hour soak shows no monotonic heap growth
- [ ] All six Playwright specs green, no quarantined tests
- [ ] `pnpm demo:reset` restores state in under five seconds
- [ ] Every fallback path rehearsed at least twice
- [ ] `DEMO` badge visible whenever mocks are active
- [ ] Demo completed in 5–7 minutes with an audio file the team has never heard
- [ ] §16.6 sign-off table complete with names and dates
- [ ] Handover documentation written

---

## Notes for the implementer

Reserve the final two days for rehearsal, not for code. The failure mode of a tender demo is never a missing feature — it is a laptop, a permission prompt, a network, or a path nobody walked end to end while nervous. The team that has run the demo eleven times wins against the team that added a twelfth feature.

One thing to protect above all: the soak test in 12.3.3 and the resilience spec in 12.4. If Week 10 compresses, those two stay. A demo that stops transcribing at minute 40 in front of the commission is unrecoverable in a way that a missing admin screen never is.
