# Phase 08 — Procedural Events Review

**Duration:** Week 7, days 1–2
**Spec refs:** FR-08, §11, §11.3, UC-06 steps 1–3, §14.7, §14.8
**Prerequisites:** Phase 07 (canonical transcript approved)

**Goal:** every extracted procedural event is reviewable, traceable to its source segments, and correctable — before it becomes a paragraph in a legal document.

---

## Step 8.1 — Extraction trigger

`POST /hearings/{id}/events/extract` with `useJob` progress.

**Disabled until the canonical transcript is approved.** The disabled state explains why and links to the transcript screen — §2.3 and §12.4 both require the approved canonical transcript as the input, and letting a clerk extract from unapproved text would produce events sourced to segments that may still change.

Re-extraction is permitted but warns that manually added or edited events will be preserved while AI-generated ones are replaced.

---

## Step 8.2 — Event timeline

Chronological list of `procedural_events` (§14.7). Grouped by hearing phase where the event types make that natural (opening / examination / motions / closing).

Card anatomy:

```text
┌──────────────────────────────────────────────────────────────┐
│ ILTIMOSNOMA BILDIRILDI          00:14:24 – 00:14:38     0.94 │
│ Daʼvogar vakili                                    ⚠ tekshir │
├──────────────────────────────────────────────────────────────┤
│ Daʼvogar vakili hujjatni talab qilib olish haqida            │
│ iltimosnoma bildirdi.                                        │
│                                                     ▸ Manba  │
└──────────────────────────────────────────────────────────────┘
```

- Event type badge using the FR-08 vocabulary (all 17 types)
- Participant or speaker role
- Time range, Mono
- `normalized_summary` as the body
- Confidence value
- Review status

Events with `requires_human_review: true` are **pinned to the top** and counted in a progress bar. §11.3 requires uncertainty to surface as `OTHER` or `requires_human_review` — the UI must make that surfacing consequential, not decorative.

---

## Step 8.3 — Source panel

Expanding "Manba" reveals:

- `verbatim_text` — the exact transcript text the event was derived from
- Each source segment as a clickable row: timestamp, speaker, text, confidence
- Clicking a source segment jumps the transcript view and seeks the audio
- Inline play button per source segment

### The hard rule

**An event with an empty `source_segment_ids` renders as an error, not as data:**

```text
┌──────────────────────────────────────────────────────────────┐
│ ⚠ MANBASIZ HODISA                                            │
│ Bu hodisa uchun manba segmentlari koʻrsatilmagan.            │
│ Hodisa bayonnomaga kiritilmaydi.                             │
│                                     [ Oʻchirish ] [ Manba qoʻshish ] │
└──────────────────────────────────────────────────────────────┘
```

§11.3 states plainly: "event faqat source segment mavjud boʻlsa yaratiladi; source segment IDlar majburiy". If the backend violates this, the frontend must make the violation visible rather than render it as ordinary content. This is the UI-side enforcement of §2.2 and it directly serves AC-05.

---

## Step 8.4 — Human review actions

| Action | Detail |
|---|---|
| Verify | Sets `review_status`, records the verifier |
| Edit type | Change among the 17 FR-08 types |
| Edit participant | Reassign to a different participant |
| Edit summary | Free text, but constrained — see below |
| Delete | For false positives; confirmation required |
| Add manually | Select transcript segments → choose type → create |

### Summary editing constraint

§11.3 requires `normalized_summary` to stay within the verbatim text. The editor shows the verbatim text alongside the summary field and flags a summary containing entities absent from the source:

*"Xulosada manbada boʻlmagan maʼlumot bor: '25 000 000 soʻm'"*

This is a soft warning, not a block — the clerk may have legitimate context — but it must appear, because a summary that quietly introduces an amount is precisely the failure mode NFR-04 targets with "manbada yoʻq kritik fakt: 0".

### Manual event creation

Select one or more transcript segments in a picker → choose event type → the summary is pre-filled from the selected text. Manually created events carry `origin: 'human'` and are excluded from re-extraction replacement.

---

## Step 8.5 — Record spine integration

Verified events become ticks on `<RecordSpine>`, coloured by category:

| Category | Types |
|---|---|
| Structural | `HEARING_OPENED`, `HEARING_CLOSED`, `BREAK_ANNOUNCED`, `HEARING_POSTPONED` |
| Procedural | `IDENTITY_VERIFIED`, `RIGHTS_EXPLAINED`, `RULING_ANNOUNCED` |
| Adversarial | `MOTION_SUBMITTED`, `OBJECTION_RAISED`, `MOTION_DISCUSSION` |
| Evidentiary | `EVIDENCE_SUBMITTED`, `EVIDENCE_EXAMINED` |
| Testimonial | `CLAIM_EXPLAINED`, `RESPONSE_GIVEN`, `QUESTION_ASKED`, `ANSWER_GIVEN` |
| Other | `OTHER` |

Unverified events render hollow; verified render filled. This is the moment the signature element from `02-design-system.md` starts doing real work: the hearing acquires a visible shape, and gaps in that shape are visible too.

---

## Step 8.6 — Completeness indicator

A panel showing which protocol-required events are present or missing:

```text
Bayonnoma uchun zarur hodisalar

  ✓ Majlisning ochilishi          HEARING_OPENED
  ✓ Shaxs tasdiqlash              IDENTITY_VERIFIED
  ✓ Huquqlar tushuntirilishi      RIGHTS_EXPLAINED
  ✗ Majlisning yakunlanishi       HEARING_CLOSED   — topilmadi
```

§12.4 blocks protocol generation on ambiguity in required events. Surfacing that *here*, where it can be fixed, is far better than surfacing it in Phase 09 as a generation failure.

---

## Files produced

```text
src/app/(app)/hearings/[hearingId]/events/page.tsx
src/features/events/screens/EventReviewScreen.tsx
src/features/events/components/{EventTimeline,EventCard,EventSourcePanel,
                                EventEditor,ManualEventCreator,
                                UnsourcedEventError,CompletenessPanel}.tsx
src/features/events/hooks/{useEvents,useEventExtraction,useEventMutation}.ts
src/features/events/utils/{event-categories,summary-entity-check}.ts
```

---

## Exit criteria

- [ ] Extraction disabled until canonical transcript approved, with the reason shown
- [ ] Every extracted event traces to at least one source segment
- [ ] An event with no sources renders as an error and is excluded from downstream use
- [ ] Clicking a source segment jumps the transcript and seeks the audio correctly
- [ ] `requires_human_review` events pinned and counted
- [ ] Summary editing warns on entities absent from the verbatim text
- [ ] Manual event creation from selected segments works
- [ ] Verified events appear as correctly categorised ticks on the record spine
- [ ] Completeness panel identifies missing protocol-required events

---

## Notes for the implementer

The unsourced-event error case will feel like defensive over-engineering, because during development the mock backend always supplies sources. Build it anyway. It is the single clearest expression of §2.2 in the entire frontend, it costs an hour, and if a real LLM ever emits an unsourced event during the demo, this component is what stands between that and a fabricated fact appearing in a court document.
