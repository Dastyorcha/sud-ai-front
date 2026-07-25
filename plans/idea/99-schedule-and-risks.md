# Schedule, Cut Order, Risks and Exclusions

Reference document. Read once at planning, revisit at the end of each week.

---

## 1. Week-by-week schedule

| Week | Phases | Milestone — demonstrable in a browser |
|---|---|---|
| 1 | 00, 01 | Toolchain green in CI. Design system published in Storybook. App shell renders. |
| 2 | 02, 03 | Every §15.1 endpoint typed and callable against MSW. Four demo accounts log in with role-correct navigation. |
| 3 | 04 | **UC-01 complete.** Case created with participants, vocabulary auto-derived, hearing scheduled. |
| 4 | 05, 06 (start) | 30 minutes of PCM capture with no dropped chunks. WebSocket connected to `mock-ws`. |
| 5 | 06 | **AC-01 and AC-02.** Live transcript for 30 minutes; forced disconnect fully recovered. |
| 6 | 07 | **UC-05 and AC-03.** Speaker mapping, segment editing, critical field review, canonical approval. |
| 7 | 08, 09 (start) | Events extracted, reviewed and traced to source. Protocol generation gate enforced. |
| 8 | 09, 10 (start) | **UC-06 and AC-04.** Protocol draft generated, traced, edited, submitted. |
| 9 | 10, 11 | **UC-07, AC-05, AC-06.** Two document types end to end with approval and export. Admin views. |
| 10 | 12 | Hardening, six E2E specs green, demo rehearsed with unseen audio. |

**Weekly rhythm:** Monday plan against the phase file, Friday demo the exit criteria to the team. A phase whose exit criteria are not demonstrated on Friday does not carry over silently — it forces a written decision about the cut order below.

---

## 2. Cut order

When the schedule compresses, cut in this order. Cut whole items, never halves.

| Order | Cut | Cost of cutting | Why it goes first |
|---|---|---|---|
| 1 | **Phase 11 admin views** (all three) | An auditor uses the database instead of the UI | Nothing in the §25 demo touches these screens |
| 2 | **Phase 09 Step 9.7 version diff** | Version list without side-by-side comparison | The demo shows one version; comparison is a Week 11 feature |
| 3 | **Phase 07 Step 7.7 advanced filters** | Search remains, filter chips go | Search covers the demo path |
| 4 | **Phase 10 Step 10.5 second document type** | One repetitive document instead of two | §31 asks for two; this is a real DoD loss — cut only under genuine pressure |
| 5 | **Phase 04 Step 4.5 vocabulary panel** | Vocabulary still derived by backend, not visible | Loses a good demo beat but nothing functional |

**Never cut:**

- Phase 05 Step 5.6 — audio file upload. It is the primary demo fallback.
- Phase 06 Step 6.7 — resilience UX. It is AC-02 and the most likely live failure.
- Phase 10 Step 10.3 — generation blocking. It is AC-05 and the product's central claim.
- Phase 12 Step 12.3.3 — four-hour soak test.
- Phase 12 Step 12.5 — demo rehearsal.

If a cut reaches item 4, escalate to the product owner rather than deciding inside the frontend team. Dropping a document type changes what the tender submission claims.

---

## 3. Risk register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|:---:|:---:|---|---|
| Backend WebSocket contract drifts from §9.4 | High | High | Every inbound message Zod-parsed; `mock-ws` is the reference implementation; contract test in CI; drift becomes a loud parse error in development, never a silent `undefined` | FE |
| AudioWorklet behaves differently across Chrome versions | Medium | High | Pin and record tested versions; keep `/dev/audio` spike page permanently; verify on the demo machine specifically | FE |
| Live transcript re-render storms at high segment counts | Medium | High | Interim segments in a `Map` keyed by `segment_key`, never in the array; virtualization from the first commit; shallow-compare store selectors | FE |
| Memory growth over a long hearing | Medium | Very high | Ring buffer with hard cap, IndexedDB spill, four-hour soak test in Phase 12 | FE |
| Uzbek `ʻ` (U+02BB) renders as a box | Low | Medium | Verified in Phase 01 Step 1.2 before any UI is built; documented fallback to Noto | FE |
| Clerk loses work to an accidental refresh | Medium | Medium | Debounced autosave on transcript and editors; `sessionStorage` persistence on the case wizard | FE |
| Backend not ready by Week 4 | High | High | MSW + `mock-ws` make every phase independently demoable; one env flag switches to the real API | FE |
| Backend `input_schema` shapes exceed the renderer's supported field types | Medium | High | Support six declared types; throw a loud development error on anything else; agree the type list with the legal expert in Week 7, not Week 9 | FE + Legal |
| Demo microphone fails on the day | Medium | Very high | Upload fallback built in Phase 05, rehearsed twice in Phase 12; permission pre-granted on the demo machine | FE |
| Venue network unavailable | Medium | High | Full local stack runs offline; `DEMO` badge prevents misrepresentation | FE |
| Event extraction returns events without source segments | Medium | Very high | UI renders them as errors, not data (§11.3); this surfaces a backend violation rather than hiding it | FE + AI |
| Scope creep from stakeholder demos | High | High | Decision register is frozen; changes require an ADR; the judge assistant stays out of MVP (§27) | PO |

---

## 4. Definition of Done — frontend items from §31

The frontend is complete when all of these are demonstrable:

- [ ] Case creation works
- [ ] Participants and procedural roles are entered
- [ ] At least 30 minutes of stable microphone audio is captured
- [ ] Live transcript is visible
- [ ] Speaker mapping is performed
- [ ] Per-segment audio can be replayed
- [ ] Critical fields are surfaced for review
- [ ] Canonical transcript is approved
- [ ] Procedural events are separated with their source segments
- [ ] Protocol is generated from a template
- [ ] At least two repetitive document types are produced
- [ ] Dynamic facts in documents are bound to sources
- [ ] A critical field absent from the source is never generated
- [ ] Approval workflow functions
- [ ] DOCX and PDF export work
- [ ] Audit log is viewable
- [ ] E2E demo repeats with different test audio

Plus §16.6, signed off in Phase 12 Step 12.6.

---

## 5. Deliberately excluded from this MVP

Confirmed against §0 "MVP ichiga kirmaydi" and §27.

| Excluded | Why | Returns in |
|---|---|---|
| Mobile and tablet layouts | NFR-06 places mobile outside MVP | Phase 2 |
| Safari and Firefox support | NFR-06 marks them best-effort | Phase 2 |
| Realtime speaker identification | §9.6 makes it optional; manual mapping is authoritative | Phase 2 |
| Multi-channel audio UI | §9.6 Variant A is the pilot architecture, not MVP | Phase 2 |
| Judge research assistant | §27 Phase 3, explicitly outside MVP scope | Phase 3 |
| Template creation and editing | §19 makes this a legal-expert process | Phase 2 |
| E-SUD and government system integration | §0 exclusion list | Phase 4 |
| E-IMZO signing | §0 — no document is signed without a human | Phase 4 |
| Russian localisation | §27 Phase 4; strings are already dictionary-routed | Phase 4 |
| Voice biometric identification | §0 exclusion list | Not planned |

If any of these is requested during the build, the answer is the specification, not the schedule.

---

## 6. The three rules that override convenience

Repeated from the README because they are the ones under pressure at 11pm in Week 9.

1. **Nothing is invented.** No field is auto-filled with a plausible value. If the source has no value, the UI shows "manbadan topilmadi" and blocks generation. (§2.2, AC-05)
2. **Nothing is approved optimistically.** Transcript edits may be optimistic. Approval, submission, export and hearing start/stop may not. (§16.5)
3. **Nothing pre-baked is shown as live.** The demo must survive an audio file the team has never heard. (§25)

A frontend that breaks rule 1 to make a demo smoother has removed the only thing that distinguishes this product from a transcription tool.
