# Integration 04 — Cases & participants

- **Status:** done
- **Size:** large
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §8 (cases & participants), §17 (judge-list gap)

## Goal

Swap the `court-case` and `participant` mock services for the real
`/api/v1/cases` + participant endpoints, keeping the existing list/detail/wizard
UI and hooks working against live data with paging, filters and archive.

## Scope & non-goals

- **In scope:** case list (filter+page), get, create, PATCH update, archive;
  participant list, add, PATCH, delete (deactivate); real hooks over TanStack
  Query; wizard submit hits `POST /cases`; judge-id gap handling.
- **Out of scope:** hearings/audio (integration-05), case-level 403 UX beyond
  hiding actions.

## Affected files

| Path (FSD layer)                                                          | New? | Intent                                              |
| ------------------------------------------------------------------------- | ---- | --------------------------------------------------- |
| `src/features/cases/case.service.ts`                                      | yes  | real `/cases` calls (replaces `court-case.service`) |
| `src/features/participants/participant.service.ts`                        | yes  | real participant calls                              |
| `src/features/cases/use-cases.ts`                                         | no   | rewrite over `useQuery` + `case.service`            |
| `src/features/cases/use-case.ts`                                          | no   | rewrite over `useQuery`                             |
| `src/features/participants/use-participants.ts`                           | no   | rewrite over `useQuery`/`useApiMutation`            |
| `src/features/case-create/use-create-case.ts`                             | no   | POST `/cases`; map wizard fields to request         |
| `src/features/case-create/*`                                              | no   | judgeId input (see gap), category→caseType map      |
| `src/shared/types/models.ts`                                              | no   | align `CourtCase`/`Participant` to guide responses  |
| `src/shared/lib/mock-api/court-case.service.ts`, `participant.service.ts` | no   | deleted (integration-11)                            |
| `docs/codemap.md`                                                         | no   | sync                                                |

## Design notes

- **Response shapes** (guide §8): `CourtCaseResponse` fields
  `{ id, caseNumber, courtName, courtType, caseType, judgeId, status,
description, isDemo, createdBy, createdAt, updatedAt, archivedAt }`.
  `ParticipantResponse` `{ id, courtCaseId, displayName, organizationName, role,
identifier, language, isActive, createdAt, updatedAt }`. Update
  `models.ts` to match (camelCase already correct).
- **List** `GET /cases?page&pageSize&caseNumber&courtName&status`. Map the UI's
  free-text search to `caseNumber` (and/or `courtName`) contains filters —
  there is no combined search param, so decide per field (recommend: search box →
  `caseNumber`, plus a `courtName` filter). Paged envelope from integration-02;
  `totalPages = ceil(totalCount/pageSize)`. Visibility is server-side by role.
- **Create** `POST /cases` (Administrator/Secretary): required `caseNumber`
  (≤100), `courtName` (≤300), `courtType`/`caseType` (≤100), `judgeId` (active
  Judge UUID), optional `description` (≤4000), `isDemo`. Handle `400 INVALID_JUDGE`,
  `409 CASE_NUMBER_EXISTS`, `403`. `201` returns the case; navigate to detail.
- **Judge-id gap (guide §17):** no user/judge-list endpoint exists. The wizard
  cannot populate a judge dropdown from the API. Interim: a required `judgeId`
  UUID text field (validated as UUID) in the wizard, clearly labelled, with a
  TODO + escalation note that a real judge-list endpoint is backend follow-up.
  Do **not** invent an endpoint.
- **Update** `PATCH /cases/{id}` partial; allowed fields per guide. Handle
  `409 CASE_ARCHIVE_ENDPOINT_REQUIRED` (status→Archived must use archive endpoint)
  and `409 ARCHIVED_CASE_IMMUTABLE`.
- **Archive** `POST /cases/{id}/archive` (no body, idempotent `204`); after
  archive, case + participants become read-only in UI.
- **Participants:** `GET /cases/{id}/participants?page&pageSize&isActive`, sorted
  by `displayName`; `POST` add; `PATCH /participants/{id}`; `DELETE
/participants/{id}` = deactivate (`isActive=false`, `204`). Block mutations when
  the case is archived. No participant GET-by-id (§17) — read from the list cache.
- **Mutations** use `useApiMutation` and invalidate the relevant `queryKeys` list.
  No `expectedVersion` on case/participant endpoints (guide doesn't require it).

## Steps

1. [x] Align `CourtCase`/`Participant` types to guide responses — `refactor: align case and participant types to api`
2. [x] Add `case.service.ts` (list/get/create/update/archive) — `feat: real case service`
3. [x] Rewrite `use-cases`/`use-case` over TanStack Query — `feat: cases hooks over live api`
4. [x] Add `participant.service.ts`; rewrite `use-participants` (CRUD + invalidation) — `feat: real participant service and hook`
5. [x] Wire wizard `use-create-case` → `POST /cases`; add judgeId UUID field + map caseType — `feat: case wizard submits to api`
6. [x] Enforce archived-case read-only in detail/participant UI — `feat: gate mutations on archived case`
7. [x] docs: sync `docs/codemap.md` — `docs: sync case/participant services`

## Risks / ripple / escalation

- Shared surface: `models.ts`, three feature hooks, wizard — touches most of the
  case UI. Escalate if the search-param mapping needs a UX change.
- Escalation: judge-list gap — confirm the interim UUID-field approach is
  acceptable for the demo.
- Rollback: mock services remain until integration-11, so revert = re-point hooks.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual: list paginates + filters against live data; create a case (valid + a
  duplicate `caseNumber` → localized `CASE_NUMBER_EXISTS`); PATCH; archive → UI
  read-only; add/edit/deactivate a participant.
