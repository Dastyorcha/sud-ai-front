# Integration 09 — Audit logs

- **Status:** idea
- **Size:** small
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §13 (audit logs)

## Goal

Wire the admin audit view to `GET /api/v1/audit-logs` (Administrator-only) with
filters, paging, and safe `before`/`after` JSON-string parsing.

## Scope & non-goals

- **In scope:** audit list query (filters + paging), safe diff parse, admin-only
  gating.
- **Out of scope:** any write; provider-status panel (already local UI).

## Affected files

| Path (FSD layer)                             | New? | Intent                                     |
| -------------------------------------------- | ---- | ------------------------------------------ |
| `src/features/audit/audit.service.ts`        | yes  | `GET /audit-logs` with query params        |
| `src/features/audit/use-audit-logs.ts`       | yes  | list hook over TanStack Query              |
| `src/views/admin/admin.tsx`                  | no   | wire audit table to live data + filters    |
| `src/shared/types/models.ts`                 | no   | align `AuditLog` to guide response         |
| `src/shared/lib/mock-api/data/audit-logs.ts` | no   | deleted with the mock dir (integration-11) |
| `docs/codemap.md`                            | no   | sync                                       |

## Design notes

- **Endpoint** `GET /audit-logs?page&pageSize&action&entityType&entityId&actorId`
  (Administrator only). `page` clamps to ≥1; `pageSize` clamps to 1..200 (default
  50). Newest-first.
- **Response envelope uses `total`** (not `totalCount`): `{ items[], page,
pageSize, total }` — adapt the paging helper accordingly.
- **`AuditLog` item:** `{ id, actorId|null, action, entityType, entityId,
before, after, requestId, createdAt }`. **`before`/`after` are nullable JSON
  strings**, not objects — parse with a guarded `JSON.parse` (try/catch) only when
  showing a structured diff; fall back to raw text on parse error (guide §13).
- **Gating:** view is Administrator-only; if a non-admin reaches it, hide/redirect
  (role from `use-session`, integration-03). A `403` from the API is handled by
  the error mapper as a fallback.

## Steps

1. [ ] Align `AuditLog` type to guide response — `refactor: align audit log type to api`
2. [ ] Add `audit.service.ts` (filters + paging, `total` envelope) — `feat: audit log service`
3. [ ] Add `use-audit-logs.ts` — `feat: audit logs hook`
4. [ ] Wire admin audit table + filters + safe before/after parse — `feat: live audit log table`
5. [ ] docs: sync `docs/codemap.md` — `docs: sync audit service`

## Risks / ripple / escalation

- Low ripple. `before/after` string-vs-object is the one trap — never assume
  object.
- Rollback: mock data deleted only in integration-11.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual (as Administrator): table loads newest-first, filters by action/entity,
  paginates; a malformed `before` doesn't crash the row.
