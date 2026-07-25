# Phase 10 — Documents, Approval Workflow and Export

**Duration:** Week 8 day 3 — Week 9 day 2
**Spec refs:** FR-10, FR-11, §13, §13.2, §13.3, UC-07, §16.4, AC-05, AC-06
**Prerequisites:** Phase 09

**Goal:** UC-07 complete for at least two repetitive document types, with generation blocked when a source is missing (AC-05) and approval locking the document (AC-06).

---

## Step 10.1 — Template catalogue (`/documents` → new)

`GET /document-templates` rendered as selectable cards showing the §13.2 shape:

```text
┌────────────────────────────────────────────┐
│ Ijro varaqasi loyihasi              ACTIVE │
│ EXECUTION_WRIT_V1 · v1.0.0                 │
│ Tasdiqlagan: yuridik ekspert               │
│ 2026-07-19                                 │
│                              [ Tanlash ]   │
└────────────────────────────────────────────┘
```

Inactive or deprecated templates are visible but **not selectable**, with the reason shown. §12.4 lists "template versiyasi aktiv emas" as a blocking condition; showing the template greyed with an explanation is more useful than hiding it, because the clerk otherwise wonders where it went.

Each document type sits behind a feature flag (§13.1) so the legal expert can freeze the list without a frontend release.

---

## Step 10.2 — Schema-driven generation form (D-13)

The form is **rendered from the template's `input_schema`**, not hand-built per document type.

### Field states

| State | Treatment |
|---|---|
| Auto-filled from source | Value shown, read-only, with an origin chip: *"Ish kartasidan"* / *"Transkript, segment 112"* / *"Hodisa: ILTIMOSNOMA"* |
| Auto-filled, overridden | Editable after explicit "Oʻzgartirish" action; override is recorded and audited |
| No source found | Empty, marked **"manbadan topilmadi"** in `--seal` |
| Manual by design | Ordinary editable input |

### The rule that defines this product

**The form never invents a value.** Not a plausible default, not a "most likely" inference, not an empty string standing in for an unknown. If the source does not contain it, the field is empty and marked.

This is §2.2 and NFR-04's "manbada yoʻq kritik fakt: 0" expressed as a UI behaviour, and it is what AC-05 tests.

### Origin chips

Every auto-filled value shows where it came from, clickable to jump to the source — transcript segment, event, or case-card field. The chain from spoken word to legal document is inspectable at every link.

---

## Step 10.3 — Validation and generation blocking

Rules-engine errors arrive in the §15.4 envelope and map onto fields via `details[].field`:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Hujjat yaratish uchun maʼlumotlar yetarli emas.",
    "details": [
      { "field": "participants.defendant", "message": "Javobgar koʻrsatilmagan." }
    ],
    "request_id": "uuid"
  }
}
```

The backend's Uzbek messages are displayed as returned — the legal expert wrote them, and paraphrasing legal language in the frontend would be wrong.

### Blocking panel

When a required field has no source, generation is blocked with a panel naming exactly which and why:

```text
Hujjat yaratib boʻlmaydi

  · Undiruvchi nomi — manbadan topilmadi
    Ish kartasida daʼvogar tashkiloti koʻrsatilmagan.
    → Ish kartasini toʻldirish

  · Ijro asos boʻlgan hujjat — manbadan topilmadi
    Majlisda protsessual qaror eʼlon qilinmagan.
    → Hodisalarni koʻrish
```

Not a toast. Not "Xatolik yuz berdi". A panel that names the gap and links to where it is closed.

---

## Step 10.4 — Generation and job tracking

```text
POST /cases/{caseId}/documents/generate
  → { document_id, job_id, status: 'QUEUED' }
  → useJob(job_id)
  → on SUCCEEDED → navigate to /documents/{document_id}
```

NFR-03 targets protocol draft generation under 60 seconds. Show elapsed time. Failure states are actionable: retry, edit inputs, or report with the `request_id`.

---

## Step 10.5 — Document editor

Reuses the entire Phase 09 infrastructure — TipTap with source attributes, traceability inspector, missing-field panel, version selector, origin markers — with the template's own section structure instead of the §12.2 protocol blocks.

Building this as a shared editor rather than a second implementation is why Phase 09's components were written generically. Confirm no protocol-specific assumptions leaked into them.

---

## Step 10.6 — Approval workflow (FR-11)

### Status stepper

```text
DRAFT → AI_GENERATED → UNDER_REVIEW → ┬→ APPROVED → EXPORTED → ARCHIVED
                            ↑         └→ CHANGES_REQUESTED ─┐
                            └──────────────────────────────┘
```

Rendered as a horizontal stepper showing current position, with each completed transition carrying its actor and timestamp on hover.

### Actions by capability (Phase 03)

| Action | Capability | Who |
|---|---|---|
| Tasdiqqa yuborish | `document.submit` | Clerk |
| Tasdiqlash | `document.approve` | Judge |
| Oʻzgartirish soʻrash | `document.approve` | Judge |
| Eksport | `document.export` | Clerk, Judge |

A clerk never sees an approve button. A judge never sees a submit button. §4.2 and §4.3 separate these duties and the UI must not blur them.

### Request changes

Requires a reason, minimum 10 characters. The reason becomes the clerk's notification and the audit record (FR-12). An empty rejection reason produces a clerk who does not know what to fix.

### Approve

- **Non-optimistic** (§16.5). The button shows a pending state until the server confirms.
- Confirmation dialog naming the document, the template code and version, and stating that approval is final
- After approval: editor read-only, document locked, `approved_at` and approver displayed

§2.1 makes human approval the moment AI output becomes an official document. Optimistically rendering that state before the server confirms would be showing a legal act that has not occurred.

---

## Step 10.7 — Export

```text
POST /documents/{id}/export  { format: 'DOCX' | 'PDF' }
  → job → signed URL → download
```

- **PDF preview** in an embedded viewer before download, so the clerk sees the rendered result rather than trusting it
- Download via **signed URL from the backend**, never a client-constructed blob — NFR-01 requires file access through signed URLs or a backend proxy
- Export transitions the document to `EXPORTED` and is audited
- Export history listed on the document: format, who, when

Only `APPROVED` documents may be exported. The control is disabled with an explanation in every other state.

---

## Step 10.8 — Documents list (`/documents`)

Page 10 of §16.1. Table across all cases: document type, case number, template + version, status badge, created by, updated.

Filters: status, document type, case, date range. Default view is filtered by capability — judges land on `UNDER_REVIEW`, clerks on `CHANGES_REQUESTED`. The first screen a user sees should be their queue, not an undifferentiated list.

---

## Files produced

```text
src/app/(app)/documents/page.tsx
src/app/(app)/documents/[documentId]/page.tsx
src/app/(app)/cases/[caseId]/documents/page.tsx
src/features/documents/screens/{DocumentListScreen,DocumentEditorScreen,
                                DocumentGenerateScreen}.tsx
src/features/documents/components/{TemplateCatalogue,SchemaDrivenForm,SchemaField,
                                   OriginChip,GenerationBlockPanel,ApprovalStepper,
                                   ApproveDialog,RequestChangesDialog,
                                   ExportDialog,PdfPreview,ExportHistory}.tsx
src/features/documents/hooks/{useDocument,useTemplates,useDocumentGeneration,
                              useApprovalActions,useExport}.ts
src/features/documents/utils/schema-to-form.ts
```

---

## Exit criteria

- [ ] **UC-07** completes end to end for two document types
- [ ] Template catalogue shows status, version and approver; inactive templates are non-selectable with a reason
- [ ] Schema-driven form renders correctly from at least two different `input_schema` shapes
- [ ] Every auto-filled field shows a clickable origin chip
- [ ] **AC-05:** a missing source blocks generation with a specific, actionable panel — no invented value appears anywhere
- [ ] Backend validation errors map onto the correct fields with the backend's own messages
- [ ] Approval stepper reflects all seven FR-11 statuses
- [ ] Clerk cannot approve; judge cannot submit — verified by role
- [ ] Request-changes requires a reason and delivers it to the clerk
- [ ] **AC-06:** approval locks the document read-only
- [ ] PDF preview renders before download
- [ ] Export only available in `APPROVED` state, via signed URL
- [ ] Documents list defaults to the user's own queue

---

## Notes for the implementer

The schema-driven form is the highest-risk item here, and the risk is scope: an arbitrary JSON Schema renderer is a project of its own. Constrain it. Support exactly the field types the legal expert's templates actually use — string, number, date, enum, boolean, and a participant reference — and throw a loud, visible development error on anything else. A renderer that handles six types correctly and refuses the seventh is far more useful than one that handles thirty types approximately.
