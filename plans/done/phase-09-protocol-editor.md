# Phase 09 — Protocol (Bayonnoma) Editor

**Duration:** Week 7 day 3 — Week 8 day 2
**Spec refs:** FR-09, §12, §12.2, §12.3, §12.4, UC-06, §16.4, AC-04
**Prerequisites:** Phase 08

**Goal:** UC-06 complete — a protocol draft is generated from approved events, every paragraph traces to its source, and the clerk edits and submits it for the judge's approval.

---

## Step 9.1 — Generation gate (§12.4)

Before the generate action is enabled, the UI evaluates and **displays all seven blocking conditions** from §12.4 as a checklist:

```text
Bayonnoma yaratish uchun shartlar

  ✓ Canonical transkript tasdiqlangan
  ✓ Ishtirokchilar aniqlangan
  ✓ Majlis boshlanish va tugash vaqti mavjud
  ✗ Zarur hodisalar aniq emas          → 1 ta hodisa tekshirilmagan · Oʻtish
  ✓ Shablon versiyasi aktiv
  ✗ Kritik maydonlarda ziddiyat bor    → 2 ta ziddiyat · Oʻtish
  ✓ Protsessual qaror manbada mavjud
```

Each failed item links to where it is fixed. **Generation is never attempted when a precondition fails** — no request is sent, no error toast appears. The user sees why before they act, not after.

This checklist is also the clearest demonstration in the product that the system refuses to invent, which is the §25 demo's most important point.

---

## Step 9.2 — TipTap configured as a legal document editor

### Custom node attributes (D-06)

Every block node carries:

```ts
{
  sourceSegmentIds: string[];      // §12.3 traceability
  sourceEventIds: string[];
  origin: 'template' | 'ai' | 'human';
  templateSectionCode: string;     // maps to §12.2 blocks
  lastEditedBy?: string;
  lastEditedAt?: string;
}
```

These survive serialization to `content_json` (§14.10) and round-trip on load. This is the entire reason TipTap was chosen over Lexical.

### Canvas

- Plex Serif, A4-proportioned column, page-like padding
- What is edited resembles what exports. A sans-serif editor producing a serif DOCX is a small lie that costs review accuracy.

### Restricted toolbar

Headings (H2, H3 only), bold, italic, ordered list, unordered list, table.

**No colours, no font controls, no alignment, no arbitrary styling.** The approved template owns the document's design (§13.4). A clerk who can restyle the protocol can produce a document that fails legal review for formatting reasons — the constraint protects them.

---

## Step 9.3 — Section navigator

Left rail listing the §12.2 blocks in order:

```text
  ✓ Sud va ish rekvizitlari
  ✓ Majlis sanasi, vaqti va joyi
  ✓ Sud tarkibi
  ✓ Kotib
  ✓ Ishtirokchilar
  ⚠ Kelgan/kelmagan shaxslar        tekshirish kerak
  ✓ Majlisning ochilishi
  ✓ Huquqlar tushuntirilishi
  ✓ Taraflarning tushuntirishlari
  ✓ Iltimosnomalar va eʼtirozlar
  ✗ Dalillarni koʻrish               maʼlumot yoʻq
  ✓ Protsessual harakatlar
  — Tanaffus yoki qoldirish          tegishli emas
  ✓ Majlis yakuni
  ✓ Tasdiqlovchi rekvizitlar
```

Four states per section: complete, needs review, missing data, not applicable. Clicking scrolls to the section. The count of non-complete sections gates submission (Step 9.6).

---

## Step 9.4 — Traceability inspector (§12.3)

Right panel, driven by cursor position in the editor. For the paragraph under the cursor:

```text
┌────────────────────────────────┐
│ Manba                          │
├────────────────────────────────┤
│ AI tomonidan yaratilgan        │
│                                │
│ Segment 112       ▶ 00:14:22   │
│ Daʼvogar vakili   ishonch 0.94 │
│ "Hurmatli sud, javobgardan…"   │
│                                │
│ Segment 113       ▶ 00:14:31   │
│ Daʼvogar vakili   ishonch 0.89 │
│ "…hujjatni talab qilib…"       │
│                                │
│ Hodisa: ILTIMOSNOMA BILDIRILDI │
│ ✓ Tasdiqlangan                 │
└────────────────────────────────┘
```

Contents per §12.3: source transcript segments, timestamps, inline audio playback, confidence, verified state.

Selecting a paragraph triggers the **source-trace flash** — the 200ms `--seal` outline pulse on the corresponding segments in the mini-transcript. This is the second and last animation in the product, and it is the one that makes the abstract principle of source grounding feel physical.

A paragraph with `origin: 'template'` shows the template section it came from instead of segments. A paragraph with `origin: 'ai'` and no sources shows the same error treatment as Phase 08 Step 8.3.

---

## Step 9.5 — Origin visualisation

- **AI-generated paragraphs** carry a 2px `--rule` left border
- **Human-edited paragraphs** lose the border and gain an editor name + timestamp on hover
- **Template-static paragraphs** have no marker — they came from the approved template and are not in question

The clerk must always be able to tell, at a glance, what the machine wrote versus what a person wrote. §2.1 makes AI output a *draft* by definition; the visual treatment keeps that true after editing begins.

---

## Step 9.6 — Missing-field panel

Enumerates every unfilled required field with jump links:

```text
Toʻldirilmagan maydonlar (3)

  · Dalillarni koʻrish boʻlimi boʻsh          → Oʻtish
  · Javobgar vakilining F.I.Sh. koʻrsatilmagan → Oʻtish
  · Majlis tugash vaqti aniq emas             → Oʻtish
```

The submit-for-review button is **disabled with the count on it** — *"Tasdiqqa yuborish (3 ta maydon toʻldirilmagan)"* — rather than enabled-and-failing. A disabled control that explains itself is better than an enabled one that produces an error.

---

## Step 9.7 — Versions and diff

- Version selector listing all `document_versions` (§14.10) with `version_no`, author, `change_summary`, timestamp
- Side-by-side **word-level diff** between any two versions
- Historical versions are strictly read-only
- The current version is editable only in `DRAFT`, `AI_GENERATED` and `CHANGES_REQUESTED` states

Diff quality matters more than it seems: the judge reviewing a resubmitted protocol needs to see exactly what the clerk changed, not re-read the whole document.

---

## Step 9.8 — Submission

`POST /documents/{id}/submit-review`.

- Non-optimistic (§16.5)
- Confirmation dialog naming the document and the judge who will review it
- After submission the editor becomes read-only with a status banner
- The clerk can recall a submission only while it remains `UNDER_REVIEW` and untouched by the judge

---

## Files produced

```text
src/app/(app)/hearings/[hearingId]/protocol/page.tsx
src/features/protocol/screens/ProtocolEditorScreen.tsx
src/features/protocol/components/{GenerationGate,ProtocolEditor,SectionNavigator,
                                  TraceabilityInspector,MissingFieldPanel,
                                  VersionSelector,VersionDiff,OriginMarker,
                                  SubmitDialog}.tsx
src/features/protocol/tiptap/{extensions,source-attributes,serialization}.ts
src/features/protocol/hooks/{useProtocol,useProtocolGeneration,useTraceability}.ts
```

---

## Exit criteria

- [ ] **UC-06** completes end to end
- [ ] All seven §12.4 preconditions evaluated and displayed before generation
- [ ] Generation is not attempted when any precondition fails
- [ ] Every AI paragraph shows its source segments, timestamps, audio and confidence
- [ ] Source-trace flash correctly highlights the linked segments
- [ ] Section navigator reflects all fifteen §12.2 blocks with accurate states
- [ ] AI-generated versus human-edited paragraphs are visually distinguishable
- [ ] Submit disabled with an accurate missing-field count
- [ ] Version diff renders word-level changes correctly
- [ ] **AC-04:** protocol generated from approved transcript contains only sourced content
- [ ] Editor is read-only after submission

---

## Notes for the implementer

The TipTap custom attributes are the load-bearing element of this phase. Get the serialization round-trip right before building any UI on top: save a document with source attributes, reload it, and confirm every attribute survived. If attributes are lost on reload, the traceability inspector will appear to work during a session and silently break for the judge who opens the document tomorrow — which is the exact scenario the tender demo will exercise.
