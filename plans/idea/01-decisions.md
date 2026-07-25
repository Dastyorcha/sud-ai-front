# 01 — Decision Register

These decisions are **locked**. Changing one requires a new ADR in `docs/adr/` with rationale and migration cost.

The specification deliberately left several choices to the team (§8.2 "component library: jamoa tanlovi", §13.1 document list not frozen, FR-01 auth transport optional). Each is decided here.

---

## D-01 — Next.js 16 (App Router) + React 19 + TypeScript strict

§8.2 recommends "Next.js yoki React + TypeScript". App Router is chosen over Pages Router for route groups, which map cleanly onto role-gated areas and hearing-scoped layouts.

React 19 for `useOptimistic` and improved transition handling in the transcript editor.

---

## D-02 — Standalone repo `lexkotib-web`, pnpm, structured as if it already lived at `apps/web`

§20 specifies a monorepo. Building standalone first avoids the workspace tooling cost during the highest-velocity weeks, while the internal structure means the eventual move into `apps/web` is a `git mv` with no refactor.

Shared packages from §20 (`packages/schemas`, `packages/ui`) are represented as `src/lib/contracts/` and `src/components/` — both extractable later without changing import shapes if path aliases are used consistently.

---

## D-03 — Client-rendered application shell

Only `/login` is server-rendered. All authenticated routes are client components with `export const dynamic = 'force-dynamic'` where needed.

**Rationale:** this is a realtime workstation, not a content site. Every meaningful screen depends on a WebSocket, an AudioContext, or an IndexedDB buffer. SSR would add hydration complexity and cache invalidation problems for zero benefit — there is no SEO surface and no cold-load content to stream.

---

## D-04 — Tailwind CSS v4 + shadcn/ui (Radix primitives), tokens as CSS variables

§8.2 leaves the component library to the team.

**Rationale:** Radix supplies the focus management, roving tabindex and ARIA semantics that §16.6 requires for keyboard navigation. Building those by hand would consume a week. shadcn/ui copies source into the repo rather than importing a dependency, so every primitive is restyled to the token system in Phase 1 with no fight against library defaults.

---

## D-05 — TanStack Query v5 (server state) + Zustand (live session) + React Hook Form + Zod (forms)

Exactly as prescribed in §16.5 and §8.2. No deviation.

Live session state is deliberately **not** in TanStack Query: it is push-driven, high-frequency, and has no cache semantics.

---

## D-06 — TipTap v2 for the protocol and document editors, not Lexical

§8.2 offers both.

**Rationale:** §12.3 requires every AI-generated paragraph to display its source segments, timestamps, audio playback, confidence and verified state. TipTap's ProseMirror foundation lets each block node carry custom attributes (`sourceSegmentIds`, `origin`, `templateSectionCode`) natively, and those attributes survive serialization. Lexical would require a custom node registry plus serialization handling to achieve the same, at higher cost.

---

## D-07 — AudioWorklet producing PCM `s16le` / 24 000 Hz / mono. MediaRecorder is not used.

**This is not a preference; it is forced by the contract.** §9.4 declares:

```json
{ "type": "audio.session.start", "codec": "pcm_s16le", "sample_rate": 24000, "channels": 1 }
```

MediaRecorder can only emit container formats (WebM/Opus, MP4/AAC). It cannot produce raw PCM. Any plan built on MediaRecorder would require a backend transcode step that the specification does not describe.

AudioWorklet also runs on the audio rendering thread, so main-thread jank during a 4-hour hearing cannot drop audio frames.

---

## D-08 — WaveSurfer.js for waveform and segment playback

§8.2. Regions plugin used for segment-scoped playback rather than fetching per-segment audio files.

---

## D-09 — MSW v2 for REST + a standalone `mock-ws` Node server for WebSocket

**Rationale:** the frontend cannot wait for the backend. Every phase must be independently demoable. `mock-ws` replays a scripted hearing with realistic interim/final timing and supports fault injection flags — it doubles as the reference implementation of the §9.4 contract and as the E2E fixture driver.

One environment flag (`NEXT_PUBLIC_USE_MOCKS`) switches the entire application to the real backend.

---

## D-10 — Auth: in-memory access token + httpOnly refresh cookie

FR-01 permits "JWT access token + refresh token yoki secure session cookie".

**Rationale:** NFR-01 classifies this data as sensitive. An access token in a JS-reachable store is an XSS liability; an httpOnly refresh cookie is not. The access token lives only in a Zustand store in memory and dies with the tab. Refresh is single-flight to prevent a token stampede when several queries 401 simultaneously.

---

## D-11 — uz-Latin only in MVP, but every string routed through `next-intl` dictionaries from day one

§27 Phase 4 lists "o'zbek/rus parallel transcript". Retrofitting i18n across 14 pages later costs far more than routing strings correctly now. The MVP ships one dictionary file; Russian is a configuration change, not a refactor.

---

## D-12 — Testing: Vitest + Testing Library, Playwright, Storybook 9

§16.6 requires component tests and E2E on critical flows. Storybook is added because the transcript and record primitives have many states (interim/final/low-confidence/critical/verified/conflicted) that are painful to reach through the application but trivial to isolate in a story.

Playwright runs Chromium only — NFR-06 makes Chrome the sole tested target.

---

## D-13 — Document generation UI is schema-driven, not hand-built per document type

§13.1 states the document list is chosen and frozen by the legal expert, and §13.2 gives each template an `input_schema_version`.

**Rationale:** the list is not frozen yet. Hand-building four forms guarantees rework. A renderer that reads the template's `input_schema` and produces the form absorbs new document types without a frontend release.

---

## D-14 — Admin pages (§16.1 items 12–14) are read-only in MVP

Template approval is a legal process performed by the legal expert (§4.4, §13.2 `approved_by` / `approved_at`), not a UI workflow. MVP surfaces the catalogue, audit log and provider status for inspection only.

---

## D-15 — Chrome/Chromium desktop only, minimum viewport 1280×800

NFR-06: "Chrome/Chromium desktop — asosiy; Edge desktop — qo'llab-quvvatlash; mobil browser — MVPdan tashqari". No mobile layout work is performed. Edge is tested once per phase but not blocking.

---

## Decisions explicitly deferred to the backend team

These affect the frontend but are not frontend decisions. Track them; do not guess.

| Question | Needed by | Frontend fallback until answered |
|---|---|---|
| Exact `job` status enum values | Phase 02 | `QUEUED / RUNNING / SUCCEEDED / FAILED` assumed |
| Whether `ack` messages carry `last_ack_sequence` on every ack or only on resume | Phase 06 | Handle both |
| Signed URL TTL for audio and exports | Phase 07, 10 | Re-request on 403 |
| Pagination style (offset vs cursor) | Phase 04 | Offset assumed, isolated in one adapter |
| Whether `PATCH /transcript-segments/{id}` returns the full segment or a delta | Phase 07 | Full segment assumed, response Zod-parsed |
