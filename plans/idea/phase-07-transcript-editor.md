# Phase 07 — Transcript Review and Editor

**Duration:** Week 6
**Spec refs:** FR-06, FR-07, UC-03, UC-04, UC-05, §10.3, §16.3, AC-03
**Prerequisites:** Phase 06

**Goal:** UC-05 complete — the clerk verifies the final transcript segment by segment, maps speakers to procedural roles, reviews every critical field, and approves the canonical transcript that everything downstream depends on.

This is the densest screen in the product and the one the clerk spends the most time in.

---

## Step 7.1 — Finalize flow (UC-04)

After the hearing stops:

1. `POST /hearings/{id}/finalize`
2. Job progress via `useJob` — NFR-03 allows up to 20 minutes for 60 minutes of audio, so show elapsed time and an expected range, never a bare spinner
3. Route to `/hearings/[hearingId]/transcript`
4. **The screen is usable in read-only mode while the job runs**, showing the live-pass transcript with a clear banner: *"Yakuniy transkripsiya tayyorlanmoqda. Quyidagi matn jonli yozuvdan olingan."*

§2.3 is explicit that live text is not the source for the protocol. The banner enforces that understanding in the UI.

---

## Step 7.2 — Virtualized segment list

`@tanstack/react-virtual`. Target: 5 000 segments at 60fps.

Row anatomy:

```text
┌──┬──────────┬─────────────┬──────────────────────────────────┬────┬──┐
│▸ │ 00:14:22 │ Daʼvogar v. │ Hurmatli sud, biz 12 500 000     │▮▮▯ │☐ │
│  │  (Mono)  │ (chip)      │ soʻm miqdorida…                  │conf│  │
└──┴──────────┴─────────────┴──────────────────────────────────┴────┴──┘
                                        ↑ critical field marks inline
```

**Row heights are measured, not fixed.** Edited text reflows, and a fixed-height virtualizer produces overlapping rows the moment a clerk adds a sentence.

---

## Step 7.3 — Segment editing

### Editing model

Click (or `E`) enters edit state with a **plain `<textarea>`**, not contenteditable.

This is deliberate: contenteditable has unpredictable IME behaviour, and Uzbek Latin input with `oʻ`/`gʻ` plus Russian code-switching (§29 question 13) is exactly where contenteditable produces cursor jumps and lost characters. A textarea is boring and correct.

### Original text preservation (UC-05 step 4)

`raw_text` is never overwritten. A toggle — *"Asl ASR matni"* — shows the original beneath the edited version with a word-level diff. The clerk must always be able to see what the machine actually heard.

### Autosave

- Debounced 800ms
- Explicit state indicator per segment: *Saqlanmoqda… / Saqlandi / Saqlanmadi — qayta urinish*
- Optimistic (permitted by the Phase 02 policy) with rollback on failure

### Split and merge

- **Split** at cursor position → `POST /transcript-segments/{id}/split`. Timestamps are interpolated by character offset; the UI shows the computed split point before confirming.
- **Merge** selected adjacent segments → `POST /transcript-segments/merge`. Only adjacent segments with the same speaker may merge; the action is disabled otherwise with a tooltip explaining why.

Both are optimistic with rollback, and both are audited actions requiring no confirmation dialog (they are trivially reversible via undo).

---

## Step 7.4 — Speaker mapping (UC-03, AC-03)

A dedicated modal, not an inline dropdown per row. Mapping is a **one-time bulk decision** (§9.6 Variant B step 3), and doing it per row would be hundreds of identical clicks.

```text
┌──────────────────────────────────────────────────────────┐
│  Gapiruvchilarni rollarga bogʻlash          3/4 bogʻlandi│
├──────────────────────────────────────────────────────────┤
│  SPEAKER_01   ▶ 0:12  "Sud majlisi ochiq deb…"           │
│               142 segment · 18 daqiqa                     │
│               → [ Sudya                    ▾ ]            │
│                                                           │
│  SPEAKER_02   ▶ 1:18  "Hurmatli sud, biz…"               │
│               89 segment · 11 daqiqa                      │
│               → [ Daʼvogar vakili          ▾ ]            │
│                                                           │
│  SPEAKER_03   ▶ 4:02  "Eʼtiroz bildiraman…"              │
│               67 segment · 8 daqiqa                       │
│               → [ Tanlanmagan              ▾ ]            │
└──────────────────────────────────────────────────────────┘
```

Each label shows: a 5-second audio preview from a representative utterance, segment count, total speaking time, and the first utterance as text. These four signals together make identification fast and confident.

Applying the mapping is a **single mutation** across all segments, with an undo toast (10-second window). Progress is shown as *"4 tadan 3 tasi bogʻlandi"*.

AC-03 requires mapping to apply to all relevant segments — verify this explicitly in the E2E suite.

---

## Step 7.5 — Audio playback

One WaveSurfer instance loading the hearing audio once. Segment playback **seeks a region**; it does not fetch per-segment files.

- `P` or `Space` plays the focused segment
- Playback loops the segment by default — verification usually needs two or three listens
- Playhead position feeds `<RecordSpine>` so the rail stays synchronised
- Playback speed control: 0.75×, 1×, 1.25×, 1.5× — clerks slow down unclear passages

Signed URL expiry (Phase 02 deferred decisions) is handled by re-requesting on 403 without interrupting playback state.

---

## Step 7.6 — Critical field review (§10.3)

The heart of NFR-04's "critical entity exact match 90%+" target.

### Marks

Ten categories from §10.3, each rendered with `<CriticalFieldMark>`: F.I.Sh., organisation, case number, date, time, amount, percent, document number, law article, address.

### Mismatch detection

Where a detected value conflicts with case-card data, show both side by side in `--seal`:

```text
Transkriptda:  "Oltin Vodiy MChJ"
Ish kartasida: "Oltin Vodiy XK"
               [ Transkriptni tuzatish ]  [ Ish kartasini tuzatish ]  [ Ikkalasi ham toʻgʻri ]
```

The third option exists because both can legitimately be correct — a speaker may have used a colloquial name. Forcing a false choice would corrupt the record.

### Review queue

A persistent counter — *"Tekshirilmagan kritik maydonlar: 14"* — with `Alt+↓` / `Alt+↑` navigation jumping between them. This turns an unbounded proofreading task into a finite, countable one.

---

## Step 7.7 — Filters and search

Filter chips, combinable:

```text
[ Tasdiqlanmagan 47 ]  [ Past ishonch 18 ]  [ Kritik maydonlar 31 ]
[ Tahrirlangan 12 ]  [ Gapiruvchi: Sudya ]
```

Counts are live. Full-text search with match highlighting; `Enter` / `Shift+Enter` navigate matches. Search operates on `canonical_text` and, optionally, `raw_text` via a toggle.

---

## Step 7.8 — Keyboard model

| Key | Action |
|---|---|
| `J` / `K` | Next / previous segment |
| `E` | Edit focused segment |
| `V` | Toggle verified |
| `S` | Split at cursor |
| `M` | Merge with next |
| `P` / `Space` | Play focused segment |
| `Alt+↓` / `Alt+↑` | Next / previous critical field |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `/` | Focus search |
| `?` | Shortcut sheet |

Registered through the Phase 01 keyboard registry, scoped to this screen.

Undo/redo is a **feature-local stack of 50 entries** covering text edits, speaker changes, splits, merges and verify toggles. It does not cover canonical approval.

A clerk reviewing 400 segments with a mouse will take three times as long as one using `J`/`V`. The shortcut sheet is discoverable via `?` and shown once on first visit.

---

## Step 7.9 — Canonical approval

The gate everything downstream depends on.

**Blocked until every critical field is reviewed.** The blocking dialog lists precisely what remains with jump links:

```text
Canonical transkriptni tasdiqlab boʻlmaydi:

  · 14 ta kritik maydon tekshirilmagan        → Oʻtish
  · 1 ta gapiruvchi rolga bogʻlanmagan        → Oʻtish
  · 3 ta segment past ishonch bilan belgilangan → Oʻtish
```

Approval is **non-optimistic** (§16.5) and requires a confirmation dialog stating that the transcript becomes the source of record. After approval the transcript is read-only; further changes require an explicit reopen action that is itself audited.

---

## Step 7.10 — Concurrent editing (§16.3)

On `409` from a segment mutation:

```text
┌────────────────────────────────────────────────────────┐
│ Bu segment boshqa foydalanuvchi tomonidan oʻzgartirildi│
│                                                         │
│ Sizniki:  "…12 500 000 soʻm…"                          │
│ Serverda: "…12 500 000 soʻm miqdorida…"                │
│                                                         │
│ [ Serverdagini olish ]  [ Meniki qolsin ]              │
└────────────────────────────────────────────────────────┘
```

Non-destructive, side-by-side, no silent overwrite. §16.3 explicitly lists "concurrent editing conflict warning" as a required component.

---

## Files produced

```text
src/app/(app)/hearings/[hearingId]/transcript/page.tsx
src/features/transcript/screens/TranscriptReviewScreen.tsx
src/features/transcript/components/{SegmentList,SegmentRow,SegmentEditor,
                                    SpeakerMappingModal,CriticalFieldPanel,
                                    CriticalFieldConflict,TranscriptFilters,
                                    TranscriptSearch,AudioPlayer,
                                    ApprovalDialog,ConflictDialog,ShortcutSheet}.tsx
src/features/transcript/hooks/{useTranscript,useSegmentMutation,useSpeakerMapping,
                               useCriticalFields,useTranscriptUndo,useTranscriptKeyboard}.ts
src/features/transcript/utils/{diff,split-timestamp,critical-field-match}.ts
```

---

## Exit criteria

- [ ] UC-05 completes end to end
- [ ] 5 000-segment fixture scrolls and edits without jank
- [ ] Row heights adapt correctly to reflowed text after editing
- [ ] **AC-03:** speaker mapping applies to all segments in one operation, with working undo
- [ ] Original ASR text always retrievable after edit
- [ ] Critical field mismatch offers all three resolutions
- [ ] Review queue navigation reaches every unreviewed critical field
- [ ] Canonical approval blocked with a specific, actionable list of what remains
- [ ] After approval the transcript is read-only
- [ ] 409 conflict shows side-by-side resolution, never silent overwrite
- [ ] All keyboard shortcuts work and the sheet is reachable via `?`
- [ ] Segment audio playback is sample-accurate against timestamps

---

## Notes for the implementer

Measure the virtualizer with the real 5 000-segment fixture on day one of this phase, not day five. Measured-height virtualization with editable rows is genuinely difficult, and discovering it at the end of the week leaves no room to change approach.

The other trap is treating speaker mapping as a per-row dropdown because it is easier to build. It is easier to build and roughly ten times slower to use, and AC-03 is tested in the demo.
