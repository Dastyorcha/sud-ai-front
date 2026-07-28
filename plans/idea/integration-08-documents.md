# Integration 08 — Document templates & document lifecycle

- **Status:** idea
- **Size:** large
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §12 (templates & documents), §16 (concurrency)

## Goal

Wire the documents workspace to the real API: template upload/list, protocol
generate (job), document GET, content edit + regeneration poll, DOCX download,
the full review lifecycle (submit/approve/request-changes), PDF export (job), and
version history — all with `expectedVersion` and blob handling.

## Scope & non-goals

- **In scope:** all §12 endpoints, job polling for generate/export, blob download,
  content-source preservation, lifecycle gating.
- **Out of scope:** case list of documents (no endpoint — §17), audit
  (integration-09).

## Affected files

| Path (FSD layer)                              | New? | Intent                                                                                |
| --------------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| `src/features/documents/document.service.ts`  | yes  | templates + document endpoints + blob download                                        |
| `src/features/documents/template.service.ts`  | yes  | template upload/list                                                                  |
| `src/features/documents/use-documents.ts`     | yes  | generate/get/edit/lifecycle/export hooks                                              |
| `src/features/documents/use-templates.ts`     | yes  | template list/upload                                                                  |
| `src/widgets/documents-workspace/*`           | no   | wire to live services                                                                 |
| `src/widgets/document-editor/*`               | no   | content edit → PATCH + regeneration poll                                              |
| `src/widgets/template-selector/*`             | no   | list active templates for generate                                                    |
| `src/shared/types/models.ts`                  | no   | align `DocumentTemplate`/`GeneratedDocument`/`DocumentVersion` + `contentJson` schema |
| `src/shared/lib/mock-api/document.service.ts` | no   | deleted (integration-11)                                                              |
| `docs/codemap.md`                             | no   | sync                                                                                  |

## Design notes

- **`contentJson` schema** (guide §12): `{ schemaVersion, documentType, fields[],
sections[] }`; each field `{ key, value, sources[] }`; each section
  `{ sectionKey, paragraphs[] }`; each paragraph `{ paragraphId, text, sources[] }`
  where `sources[] = { type, id, path }`. Model this precisely — the editor must
  **preserve `sources`** on every paragraph (≥1 required) and field.
- **Templates:** `POST /document-templates` (Administrator, `multipart`, ≤10 MB,
  `.docx`, fields `templateCode/title/version/isActive/file`; DOCX must contain
  the 9 placeholders verbatim). `GET /document-templates` → all versions; the
  generate form shows only `isActive=true`. `storageKey` is private — never a URL.
  Handle `400 INVALID_DOCX_TEMPLATE`, `409 TEMPLATE_VERSION_EXISTS`, `403`.
- **Generate** `POST /cases/{id}/documents/generate` body `{ documentType:
"HearingProtocol", hearingId, templateCode, templateVersion|null }` → `202
{ documentId, jobId, status }`. Many preconditions (approved+locked transcript,
  hearing times, active Judge+Secretary participants, all-canonical segments, ≥1
  verified sourced event, active template). Poll job → on `Succeeded`, GET the
  document. Surface each `409` precondition code as a distinct localized message
  (`CANONICAL_TRANSCRIPT_NOT_APPROVED`, `JUDGE_PARTICIPANT_REQUIRED`,
  `SECRETARY_PARTICIPANT_REQUIRED`, `VERIFIED_EVENTS_REQUIRED`,
  `ACTIVE_TEMPLATE_REQUIRED`, `HEARING_TIME_REQUIRED`, …).
- **GET `/documents/{id}`** → full document incl. `contentJson`, `sourceSnapshot`,
  `status`, `docxStorageKey` (null until job done), `version`.
- **PATCH `/documents/{id}`** (only `Draft`/`ChangesRequested`) body
  `{ contentJson, status: null, expectedVersion }`. `contentJson` must have
  `fields` + `sections` arrays; every paragraph ≥1 `sources`. **Does not return a
  regeneration `jobId`** (§17) — after PATCH, re-GET and poll until
  `docxStorageKey != null`. `status` cannot be changed via PATCH. Handle
  `400 DOCUMENT_SOURCE_REQUIRED`, `409 DOCUMENT_NOT_EDITABLE`,
  `409 APPROVED_DOCUMENT_IMMUTABLE`, concurrency.
- **Download** `GET /documents/{id}/download` → binary DOCX; use `fetch`/axios
  `responseType: 'blob'`, build an object URL, trigger anchor download, revoke.
  Handle non-OK separately from JSON (guide §12 sample). `409 DOCX_NOT_READY`.
- **Lifecycle** (guide §12): `submit-review` (`Draft`/`ChangesRequested` →
  `UnderReview`, needs regenerated DOCX + valid snapshot); `request-changes`
  (Judge/Admin, `UnderReview` → `ChangesRequested`, non-empty `reason`); `approve`
  (Judge/Admin, `UnderReview` → `Approved`, immutable). Each body carries
  `expectedVersion`. Gate action buttons by status + role; handle
  `INVALID_DOCUMENT_TRANSITION`, `DOCUMENT_REVIEW_DENIED`,
  `DOCUMENT_APPROVAL_DENIED`, `CHANGE_REASON_REQUIRED`, `DOCX_NOT_READY`.
- **Export** `POST /documents/{id}/export` body `{ expectedVersion }` → `202
{ jobId }`; poll → on `Succeeded`, re-GET → `status=Exported`, `pdfStorageKey`
  set. No PDF download endpoint (§17) — show exported state, not a link. Handle
  `409 DOCUMENT_NOT_APPROVED`, `409 PDF_EXPORT_ALREADY_QUEUED`.
- **Versions** `GET /documents/{id}/versions` → newest-first history; render
  `changeType`, `reason`, status per entry.

## Steps

1. [ ] Model `contentJson`/`sourceSnapshot` + align document/template/version types — `refactor: align document types and content schema to api`
2. [ ] Add `template.service.ts` + `use-templates` (list/upload, active filter) — `feat: document template service`
3. [ ] Add `document.service.ts` generate + GET + job wiring — `feat: document generate and fetch`
4. [ ] Add content PATCH + re-GET/poll for regenerated DOCX; preserve sources — `feat: document content edit with regeneration poll`
5. [ ] Add blob DOCX download — `feat: docx download`
6. [ ] Wire lifecycle (submit/request-changes/approve) with role+status gating — `feat: document review lifecycle`
7. [ ] Wire PDF export job + exported state; version history panel — `feat: document export and version history`
8. [ ] docs: sync `docs/codemap.md` — `docs: sync document services`

## Risks / ripple / escalation

- Largest single surface; content-schema modeling is the crux — get `sources`
  preservation right or approvals fail server-side.
- PATCH returns no jobId — the re-GET/poll fallback (§17) must be robust against a
  never-ready DOCX (timeout + user message).
- Blob download must bypass the JSON error parser on success.
- Rollback: mock service remains until integration-11.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual full chain: upload template → generate (poll → GET) → edit content
  (re-GET DOCX ready) → submit → (as Judge) approve → download DOCX → export
  (poll → `Exported`) → version history lists each change; try approve as a
  non-Judge → localized `DOCUMENT_APPROVAL_DENIED`.
