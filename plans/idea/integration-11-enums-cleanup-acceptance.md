# Integration 11 — Enums, mock removal & acceptance

- **Status:** idea
- **Size:** medium
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §4 (enums/state), §17 (API gaps), §18 (acceptance checklist)

## Goal

Reconcile enum values to the API's PascalCase canon, delete the mock-api layer
now that every feature is live, document the known API gaps, and run the guide's
§18 frontend acceptance checklist end to end.

## Scope & non-goals

- **In scope:** enum value/label reconciliation, deletion of
  `src/shared/lib/mock-api/` + `use-mock-query`, a `docs/api-integration.md` gap
  register, and the §18 acceptance pass.
- **Out of scope:** any new feature; must run **last** (after 03–10 migrate off
  mocks).

## Affected files

| Path (FSD layer)                       | New? | Intent                                                   |
| -------------------------------------- | ---- | -------------------------------------------------------- |
| `src/shared/types/enums.ts`            | no   | canonical PascalCase values matching guide §4            |
| `src/shared/lib/i18n/messages/*.ts`    | no   | enum label keys keyed by the canonical values (uz/en/ru) |
| `src/shared/lib/mock-api/**`           | no   | **deleted** (all services + fixtures)                    |
| `src/shared/hooks/use-mock-query.ts`   | no   | **deleted** (replaced by TanStack Query)                 |
| `docs/api-integration.md`              | yes  | endpoint map, base URL, gaps register, concurrency notes |
| `docs/codemap.md`, `CLAUDE.md` doc map | no   | remove mock-api rows; add http/query/api-integration     |
| `docs/qa-acceptance.md`                | no   | fold in the §18 checklist results                        |

## Design notes

- **Enum reconciliation (guide §4).** The API returns/accepts PascalCase:
  - Case status: `Draft | Active | Completed | Archived`.
  - Participant role: `Judge | Secretary | Claimant | ClaimantRepresentative |
Defendant | DefendantRepresentative | Witness | Expert | Interpreter | Other`.
  - Hearing status: `Created | DeviceCheck | Recording | Paused | Finalizing |
Processing | ReadyForReview | Approved | Failed`.
  - Segment status: `Raw | Normalized | HumanEdited | Canonical`.
  - Event type (14) + review status `Draft | Verified`.
  - Document type `HearingProtocol`; status `Draft | UnderReview |
ChangesRequested | Approved | Exported`.
  - Job status `Queued | Processing | Succeeded | Failed`; job type
    `FinalTranscription | DocumentGeneration | DocumentPdfExport`.
  - Court roles `Administrator | Secretary | Judge | LegalExpert | DemoOperator`.

  The repo's mocks use `UPPER_SNAKE`. Decide once: **store the API's PascalCase as
  the enum values** and key i18n labels by those values, so no per-call mapping is
  needed. Update every `enums.*` label key + call site accordingly (grep-driven).
  Enum request sends the canonical value; parsing is case-insensitive server-side.

- **Mock removal.** By this plan, 03–10 no longer import `mock-api` or
  `use-mock-query`. Grep to confirm zero imports, then delete the directories.
  Any lingering fixture used only by `/tools` gets an inline literal or is removed.
- **Gap register** (`docs/api-integration.md`, from guide §17): document that
  these do not exist yet and how the frontend copes — no user/judge list (manual
  UUID), no hearing GET/list (routing-state carry), no `device-check/pause/resume`,
  no audio track list/download, no case document list, no PDF download (only
  `pdfStorageKey`), no PATCH regeneration jobId (re-GET/poll), no template
  update/deactivate/download, no participant GET-by-id, no CORS (dev proxy), WS
  needs LongPolling. Mark each as backend follow-up.
- **§18 acceptance checklist.** Verify each item: Bearer on all protected
  requests; single-flight refresh rotation; distinct `401/403`/ProblemDetails/
  ValidationProblemDetails handling; `X-Request-ID` logged; role + case-level
  access; latest `expectedVersion` on every mutation; `FormData` uploads without
  manual Content-Type; job polling to terminal; blob download separate from JSON
  parser; `storageKey` never used as a URL; validate-before-approve; event/doc
  source refs preserved; approved transcript/doc read-only; no real PII in demo.

## Steps

1. [ ] Reconcile `enums.ts` values to PascalCase + re-key i18n labels (uz/en/ru); fix call sites — `refactor: canonical api enum values and labels`
2. [ ] Grep-confirm no `mock-api`/`use-mock-query` imports; delete both — `chore: remove mock api layer`
3. [ ] Write `docs/api-integration.md` (endpoint map + base URL + gap register + concurrency) — `docs: api integration reference and gap register`
4. [ ] Update `docs/codemap.md`, CLAUDE.md doc map, `docs/qa-acceptance.md` — `docs: sync docs after mock removal`
5. [ ] Run §18 acceptance checklist; record results in `docs/qa-acceptance.md` — `test: frontend acceptance checklist pass`

## Risks / ripple / escalation

- Enum re-keying is repo-wide (badges, filters, selects, i18n) — highest grep
  surface; do it in one commit and typecheck hard.
- Deleting mock-api will break the build if any import remains — the grep gate is
  mandatory before deletion.
- Escalation: if `/tools` or any demo view still needs sample data with no live
  source, decide with the user whether to keep a tiny local fixture.

## Verification

- `npx tsc -b` + `npm run lint` + `npm run build` all clean with **zero** imports
  of `mock-api`.
- Every §18 checklist item verified against the live API (dev proxy) and recorded.
- Full demo chain (login → case → hearing → transcript → events → document →
  export → audit) runs end to end on real data.
