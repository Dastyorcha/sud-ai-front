# LexKotib AI — Frontend Implementation Plan

**Scope:** frontend only (`apps/web`)
**Source of truth:** `LexKotib_AI_MVP_Texnik_Spetsifikatsiya.md` v1.0 (2026-07-19)
**Plan version:** 1.1 (split into per-phase files)
**Target:** working MVP for the tender demo, 10 weeks
**Language policy:** code, identifiers and comments in English; all UI strings in Uzbek (Latin).

Every open question in the specification has been decided in `01-decisions.md`. References like `§16.2`, `FR-05`, `NFR-03`, `AC-01` point back to the specification document.

---

## How to use this plan

Read `01` → `03` once, in order. They are the contract everything else depends on.

Then work the phase files strictly in sequence. Each phase file is self-contained: prerequisites, numbered steps, files produced, exit criteria, and a done-checklist. **A phase is not closed until its exit criteria are demonstrable in a browser**, not merely coded.

---

## File index

### Foundation documents — read first

| File | Contents |
|---|---|
| `01-decisions.md` | 15 locked technical decisions with rationale |
| `02-design-system.md` | Palette, typography, signature element, motion, copy rules |
| `03-repo-structure.md` | Folder layout, module boundaries, naming conventions |

### Phase files — implement in order

| File | Phase | Duration |
|---|---|---|
| `phase-00-foundation.md` | Toolchain, CI, environment | W1 d1–2 |
| `phase-01-design-system.md` | Tokens, primitives, app shell, Storybook | W1 d3–5 |
| `phase-02-api-layer.md` | Zod contracts, HTTP client, TanStack Query, MSW | W2 d1–3 |
| `phase-03-auth-rbac.md` | Login, session, route guards, capabilities | W2 d4–5 |
| `phase-04-cases-participants.md` | UC-01: cases, participants, vocabulary | W3 |
| `phase-05-audio-capture.md` | AudioWorklet PCM pipeline, devices, buffering | W4 d1–3 |
| `phase-06-live-hearing.md` | WebSocket, live transcript, resilience, mock-ws | W4 d4 – W5 |
| `phase-07-transcript-editor.md` | UC-05: editor, speaker mapping, critical fields | W6 |
| `phase-08-procedural-events.md` | Event extraction review, source traceability | W7 d1–2 |
| `phase-09-protocol-editor.md` | UC-06: bayonnoma generation and editing | W7 d3 – W8 d2 |
| `phase-10-documents-approval.md` | UC-07: templates, generation, approval, export | W8 d3 – W9 d2 |
| `phase-11-admin.md` | Template catalogue, audit log, provider status | W9 d3 |
| `phase-12-hardening-demo.md` | A11y, performance, E2E, demo rehearsal | W9 d4 – W10 |

### Reference

| File | Contents |
|---|---|
| `99-schedule-and-risks.md` | Week-by-week schedule, cut order, risk register, exclusions |

---

## Traceability — specification to phase

| Spec requirement | Phase |
|---|---|
| FR-01 Authentication | 03 |
| FR-02 Case management | 04 |
| FR-03 Hearing management | 06 |
| FR-04 Audio capture | 05 |
| FR-05 Live transcript | 06 |
| FR-06 Final transcript | 07 |
| FR-07 Transcript editor | 07 |
| FR-08 Event extraction | 08 |
| FR-09 Protocol generator | 09 |
| FR-10 Document generator | 10 |
| FR-11 Approval workflow | 10 |
| FR-12 Audit log | 11 |
| §16.1 Pages 1–14 | 03, 04, 06, 07, 09, 10, 11 |
| §16.2 Live hearing UI | 06 |
| §16.3 Transcript editor | 07 |
| §16.4 Document editor | 09, 10 |
| §16.5 Frontend state | 02, 06 |
| §16.6 Frontend DoD | 12 |
| AC-01, AC-02 | 06 |
| AC-03 | 07 |
| AC-04 | 09 |
| AC-05, AC-06 | 10 |
| §25 Demo | 12 |

---

## The three rules that override convenience

1. **Nothing is invented.** No field is ever auto-filled with a plausible value. If the source has no value, the UI shows "manbadan topilmadi" and blocks generation. (§2.2, AC-05)
2. **Nothing is approved optimistically.** Transcript edits may be optimistic. Approval, submission, export and hearing start/stop may not. (§16.5)
3. **Nothing pre-baked is shown as live.** The demo must survive an audio file the team has never seen. (§25)
