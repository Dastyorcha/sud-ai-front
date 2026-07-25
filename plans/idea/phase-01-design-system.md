# Phase 01 — Design System and Application Shell

**Duration:** Week 1, days 3–5
**Spec refs:** §16.1, §16.6, `02-design-system.md`, D-04
**Prerequisites:** Phase 00 complete

**Goal:** every visual decision in the product is made once, here, and expressed as a token or a primitive. No screen built after this phase invents styling.

---

## Step 1.1 — Token layer

`src/styles/tokens.css`:

```css
@layer base {
  :root {
    /* colour — see 02-design-system.md */
    --ink: #14161A;
    --paper: #FCFCFA;
    --rule: #DCDDD8;
    --muted: #6E7278;
    --seal: #7A1F2B;
    --attested: #1F5D4C;
    --caution: #8A6212;

    /* type scale */
    --text-2xs: 12px;
    --text-xs: 13px;
    --text-sm: 14px;   /* body */
    --text-md: 16px;
    --text-lg: 20px;
    --text-xl: 28px;
    --text-2xl: 40px;

    /* spacing — 4px base */
    --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
    --space-4: 16px; --space-6: 24px; --space-8: 32px; --space-12: 48px;

    /* structure */
    --radius: 2px;
    --rail-width: 56px;
    --hairline: 1px solid var(--rule);
  }
}
```

Tailwind v4 `@theme` block in `globals.css` maps every token to a utility. After this step, **no raw hex appears anywhere else in the codebase** — enforced by the ESLint rule from Phase 00 Step 0.3.

---

## Step 1.2 — Fonts — do this before anything visual

Self-host IBM Plex Sans, Plex Mono and Plex Serif via `next/font/local`, subset to Latin + Latin Extended.

**No Google Fonts CDN.** The on-prem pilot (§27 Phase 2) runs in an isolated court network; an external font request would render the product unusable there.

### Blocking verification

Render this string in all three faces at 14px and 20px and inspect it:

```text
Oʻzbekiston Respublikasi — daʼvogar, javobgar, gʻoyat
№ 4-2101-2604/13 · 1 234 567,89 soʻm · 00:14:22
```

Confirm `U+02BB` (ʻ) and `U+02BC` (ʼ) render as proper modifier letters, not as boxes or as straight quotes. Confirm digits are tabular in Mono.

If any face fails, switch the whole family to Noto Sans / Noto Serif / Noto Sans Mono and keep the identical three-role structure. **Do not proceed to Step 1.3 with a broken glyph** — every screen in this product displays Uzbek text.

---

## Step 1.3 — shadcn/ui installation and restyle

Install the primitives the plan needs:

```text
button  input  textarea  select  checkbox  label
dialog  alert-dialog  sheet  popover  tooltip  dropdown-menu
tabs  table  badge  separator  scroll-area  skeleton
toast  command  progress  collapsible
```

Then restyle **all of them in one pass** against the tokens:

- Radius `2px` everywhere.
- Buttons: `default` is `--ink` on `--paper` inverted; `destructive` uses `--seal`; `ghost` and `outline` use `--rule` borders. No gradients, no shadows on buttons.
- Inputs: 1px `--rule` border, focus ring `2px --ink` offset `1px`. Error state uses `--caution` border plus message text, never `--seal` (reserved for record-critical states).
- Dialog: `--paper` surface, hairline border, single shadow level.

**Default shadcn styling must not survive this step.** Grep for `rounded-md`, `shadow-sm` and the default `zinc`/`slate` classes afterwards; there should be none.

---

## Step 1.4 — Record primitives (`src/components/record/`)

These encode the domain. They are used by five different features, so they are built once and correctly.

### `<Timestamp ms onSeek? />`
Mono, `HH:MM:SS` or `MM:SS` for hearings under an hour. Clickable variant renders as a button with a subtle underline and emits `onSeek(ms)`.

### `<SpeakerChip label participantId? role? size? />`
Three visual states:
- **Unmapped** — `SPEAKER_02` in Mono, `--muted`, dashed hairline border. Reads as provisional, because it is.
- **Mapped** — procedural role in Sans, solid hairline, `--ink`.
- **Conflicting** — `--seal` border when the mapping is contradicted elsewhere.

### `<ConfidenceBar value />`
3px bar, `--rule` track. Fill is `--ink` at ≥0.75, `--caution` below. `aria-label` gives the numeric value — the colour is never the only signal.

### `<RecordStateBadge status kind />`
Covers every enum in the specification: `DocumentStatus` (7 values, FR-11), segment status, hearing status, job status. One component, one mapping table, so a status can never render differently on two screens.

### `<CriticalFieldMark type children />`
Dotted underline plus a 10px type glyph for the ten §10.3 categories: F.I.Sh., organization, case number, date, time, amount, percent, document number, law article, address. Unreviewed marks are `--seal`; reviewed are `--attested`.

### `<RecordSpine />` — the signature element

```ts
interface RecordSpineProps {
  durationMs: number;
  events: Array<{ id: string; atMs: number; type: ProceduralEventType; verified: boolean }>;
  playheadMs?: number;
  visibleRange?: { startMs: number; endMs: number };
  activityDensity?: number[];         // optional speaking-activity histogram
  onSeek: (ms: number) => void;
}
```

Rendered as SVG at `--rail-width`. Ticks are 12px horizontal marks; unverified events render hollow, verified render filled. The visible-range band is a 6% `--ink` overlay. Keyboard accessible: arrow keys move between ticks, `Enter` seeks.

Build it fully in Storybook in this phase even though no screen consumes it until Phase 06.

---

## Step 1.5 — Application shell

`src/app/(app)/layout.tsx`:

```text
┌────────────────────────────────────────────────────────────────┐
│ HEADER  logo · case context · elapsed · connection · user menu │
├──────┬───────────────┬─────────────────────────┬───────────────┤
│      │               │                         │               │
│spine │   left nav    │        content          │   inspector   │
│ slot │               │                         │     slot      │
│      │               │                         │               │
└──────┴───────────────┴─────────────────────────┴───────────────┘
```

- Spine slot is empty outside hearing routes; `hearings/[hearingId]/layout.tsx` fills it.
- Inspector slot is a named layout region used by the transcript, protocol and document screens.
- Left nav collapses to icons under 1440px viewport width.

### Global state components — build all three now

```tsx
<LoadingState variant="page" | "panel" | "inline" />
<EmptyState title description action />
<ErrorState error onRetry />   // surfaces requestId from ApiError
```

§16.6 requires loading, empty and error states on every screen. Building them as shared components here means later phases cannot skip them by accident — the pattern is already the path of least resistance.

### Keyboard registry

`src/lib/keyboard.ts`: a registry where features declare shortcuts with a scope. Registering a duplicate within an active scope throws in development. This prevents the Phase 07 transcript shortcuts from silently colliding with the Phase 09 editor shortcuts.

---

## Step 1.6 — Storybook

Install Storybook 9 with the Vite builder. Every component in `components/record/` and `components/ui/` gets a story covering all its states.

Priority stories — these carry the most states and are hardest to reach through the app:
- `SegmentRow` in interim / final / low-confidence / critical-unreviewed / verified / editing / conflicted
- `RecordSpine` at 5 minutes, 45 minutes and 4 hours of events
- `RecordStateBadge` — all 20+ enum values on one page

Add a `storybook:build` job to CI.

---

## Files produced

```text
src/styles/tokens.css
src/styles/globals.css
src/components/ui/*                  (≈20 restyled primitives)
src/components/record/{Timestamp,SpeakerChip,ConfidenceBar,RecordStateBadge,CriticalFieldMark,RecordSpine}.tsx
src/components/layout/{AppShell,Header,LeftNav,InspectorPanel}.tsx
src/components/layout/{LoadingState,EmptyState,ErrorState}.tsx
src/lib/keyboard.ts
.storybook/*
```

---

## Exit criteria

- [ ] Uzbek glyph test passes in all three font faces
- [ ] Zero raw hex outside `src/styles/`
- [ ] Zero default shadcn styling remains (grep verified)
- [ ] Every record primitive has a Storybook story covering all states
- [ ] `RecordSpine` renders 200 events at 4 hours without visible lag
- [ ] Shell renders with mock navigation and all three global states demonstrable
- [ ] Storybook builds in CI
- [ ] Keyboard registry throws on a duplicate shortcut in dev

---

## Notes for the implementer

The temptation in this phase is to build only the primitives that Phase 04 needs and defer the rest. Don't. `SegmentRow` and `RecordSpine` are the two hardest components in the product, and building them in Storybook — where every state is one click away — is dramatically cheaper than debugging them inside a live WebSocket screen in Phase 06.
