# 02 — Design System Direction

## The brief, stated plainly

This is an instrument for producing the **official record** of a court hearing. Its user is a court clerk who will sit in front of it for four continuous hours while a hearing runs, then spend another hour verifying what it captured. The single job of the interface is to make the difference between *what was said* and *what the record claims was said* impossible to miss.

That framing rejects the SaaS-dashboard vocabulary — cards, gradients, hero stats, friendly empty-state illustrations. The visual world here is registers, stamps, procedural sequence, marginalia, and the exact moment a spoken sentence becomes a legal fact.

---

## Palette

Six tokens, plus one reserved warning value. **Colour is never decorative in this product.** Every hue encodes a record state, which is what makes a 400-segment transcript scannable after hour four.

| Token | Hex | Meaning |
|---|---|---|
| `--ink` | `#14161A` | Primary text, spine rail, borders at full weight |
| `--paper` | `#FCFCFA` | Application background, document canvas |
| `--rule` | `#DCDDD8` | Hairlines, table borders, pane dividers |
| `--muted` | `#6E7278` | Timestamps, metadata, interim text, disabled |
| `--seal` | `#7A1F2B` | **Record-critical only:** recording indicator, unreviewed critical field, blocked generation, destructive confirmation |
| `--attested` | `#1F5D4C` | Verified segment, approved document, connected STT |
| `--caution` | `#8A6212` | Reserved: confidence below 0.75, latency warning, unsaved state |

No other colour enters the product. If a new state needs a colour, it needs a decision first — the constraint is the point.

`--seal` is a deep oxblood, not a UI red. It reads as a wax seal and a rubber stamp, not as a browser error. Used sparingly it carries real weight; used for ordinary validation it would become noise, so ordinary form validation uses `--caution` plus text.

---

## Typography

**IBM Plex**, three roles:

| Face | Role |
|---|---|
| **Plex Sans** | All UI chrome, navigation, forms, buttons, labels |
| **Plex Mono** | Timestamps, case numbers, sequence numbers, speaker labels, amounts, document numbers, UUID fragments |
| **Plex Serif** | The protocol and document canvas only |

**Why Mono matters here:** anything the clerk verifies character-by-character is monospaced. Digit substitution — `1` for `7`, `0` for `O`, a transposed date — is the specific failure mode §10.3 and NFR-04 care most about ("Critical entity exact match 90%+"). Proportional digits hide that class of error; tabular monospace exposes it.

**Why Serif on the document canvas:** what the clerk edits should resemble the DOCX that exports. A sans-serif editor producing a serif Word document is a small lie that costs review accuracy.

**Why Plex over Inter:** beyond having more character than the current default, Plex covers `U+02BB` (ʻ), required for *oʻ* and *gʻ* in Uzbek Latin. **This must be verified in Phase 01 Step 1.2 before any UI is built.** If coverage fails in any of the three faces, fall back to Noto Sans / Noto Serif / Noto Sans Mono and keep the identical three-role structure.

### Scale

`12 / 13 / 14 / 16 / 20 / 28 / 40`

Body is 14px. This is a dense professional tool; 16px body would waste the vertical space the transcript needs. Line-height 1.5 for UI, 1.7 for the document canvas.

Weights: 400 body, 500 UI labels, 600 headings. No 700 — with this palette and density, semibold is already emphatic.

---

## Layout

- Radius: **2px only.** Not zero (which reads as a deliberate brutalist statement the brief doesn't call for), not 8px (which reads as consumer SaaS). Two pixels reads as a printed form.
- Spacing: 4px base scale.
- Borders: 1px `--rule` hairlines everywhere. Shadows exist at two levels only — popover and dialog. Panels are separated by rules, not elevation.
- Density: comfortable is the *maximum*; the transcript row is compact.

---

## Signature element — the record spine

A fixed 56px vertical rail on the left edge of every hearing-scoped screen (live, transcript, events, protocol, document).

It renders the hearing's full duration as a vertical timeline:

- tick marks for verified procedural events, positioned by timestamp, coloured by category
- a playhead showing current audio position
- a shaded band marking the transcript range currently visible in the viewport
- density shading for speaking activity

It is the **same component instance** across all five screens. Clicking a tick simultaneously scrubs the audio, scrolls the transcript to the source segment, and highlights the linked protocol paragraph.

**Why this and not something else:** §2.2 (source-grounded generation) and §12.3 (traceability) are the intellectual core of the product — every fact in a generated document must be traceable to a moment in the audio. Most implementations express that as a footnote or a hover tooltip, which makes it feel like metadata. The spine turns it into a physical object the clerk manipulates: the hearing has a shape, events are positions in it, and documents point back into it. It is the one thing this interface will be remembered by.

Everything else stays quiet so this can be loud.

---

## Motion

Exactly two animations exist in the product.

1. **Interim → final settle.** 120ms opacity and weight transition when an interim segment is replaced by its final version. This makes the live transcript feel like it is resolving rather than flickering.
2. **Source-trace flash.** 200ms `--seal` outline pulse on source segments when a document paragraph is selected. Used only in the traceability inspector.

Everything else is instant. Both respect `prefers-reduced-motion`.

Scattered micro-interactions are what make an interface read as generated. Two orchestrated moments, each doing real explanatory work, read as designed.

---

## Copy rules

All UI strings in Uzbek (Latin), sentence case, plain verbs, no filler.

- Name things by what the clerk controls, never by system internals: *"Majlisni tugatish"*, not *"Session terminate"*.
- An action keeps its name through the entire flow. The button that says *"Tasdiqlash"* produces a toast that says *"Tasdiqlandi"*.
- Errors state what happened and what to do. They do not apologise and are never vague. Not *"Xatolik yuz berdi"* but *"Javobgar ko'rsatilmagan. Ishtirokchilar bo'limiga qo'shing."*
- Empty screens are invitations to act, not decorations.
- Every label does exactly one job. A label labels; a hint demonstrates; nothing does double duty.

---

## Quality floor — assumed, never announced

Visible keyboard focus on `--paper`, full keyboard navigation, correct ARIA roles on custom components, `prefers-reduced-motion` honoured, axe clean on all 14 pages. Verified in Phase 12, but built in from Phase 01.
