# 012 — LexKotib AI end-to-end integration

- **Status:** doing
- **Size:** large
- **Author model:** Codex

## Goal

Unify the product as **LexKotib AI**, replace the broken production AI/STT
contract with one verified contract, and give experts a complete synthetic demo
flow from a court case and hearing audio to a traceable transcript and
template-based document.

## Scope & non-goals

- **In scope:** product naming, real AI document intake, microphone capture and
  final STT upload, hearing recovery/list endpoints, removal of duplicate mock
  hearing controls, verified demo template catalogue, source-grounded document
  generation, integration documentation and release checks.
- **Out of scope:** autonomous judicial decisions, automatic court submission,
  production E-SUD integration, and presenting live preview text as the final
  canonical transcript.

## Affected surfaces

| Surface                                           | Intent                                                  |
| ------------------------------------------------- | ------------------------------------------------------- |
| `src/shared/constants/app.ts` and shell metadata  | canonical LexKotib AI brand                             |
| `src/features/hearings/*`                         | recover hearings from API and record real browser audio |
| `src/views/cases/case-detail.tsx`                 | place the STT/hearing workflow in one clear location    |
| `src/features/case-create/*`                      | replace filename-only mock AI analysis                  |
| `src/widgets/documents-workspace/*`               | verified expert demo templates and traceability         |
| LexKotib backend hearing/document/AI integrations | fill missing API contracts                              |
| LexKotib AI Cloud Run service                     | canonical API, STT, extraction and template rendering   |

## Steps

1. [x] Record current production/API mismatches and preserve compatibility.
2. [x] Rename user-facing and provider identities to LexKotib AI.
3. [x] Add a source-grounded document-upload extraction endpoint.
4. [x] Add hearing list/detail and case-document list backend endpoints.
5. [x] Capture microphone audio in the real hearing lifecycle and upload it for final STT.
6. [x] Replace the duplicate mock protocol workspace with the real hearing workspace.
7. [x] Publish four verified synthetic document demonstrations based on supplied templates.
8. [ ] Run frontend lint/build, backend build/tests, AI tests and an end-to-end smoke flow.
9. [x] Update API, deployment and operator documentation.

## Risks / ripple / escalation

- Existing GCP project and bucket IDs contain the old resource slug and cannot
  be renamed in place. They remain infrastructure identifiers; the product,
  service title and provider identity become LexKotib AI.
- The old `SudKotibAi__*` configuration keys remain supported during one
  transition release so the running VM can be upgraded without data loss.
- Real court files are not seeded. Expert/demo content is synthetic and clearly
  labeled; supplied files are used only as layout references.
- Production push/deploy is a separate approval point after local verification.

## Verification

- `npm run lint` and `npm run build` clean.
- Backend Release build and unit/architecture tests clean.
- AI pytest suite clean and OpenAPI contains the backend-consumed endpoints.
- Manual flow: open demo case → hearing → record/upload → transcribe → review →
  inspect verified events → generate/download a template-formatted DOCX.
