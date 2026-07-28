# Integration 02 — TanStack Query layer, job polling & concurrency

- **Status:** doing
- **Size:** medium
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §5 (paging), §9/§12 (jobs), §16 (optimistic concurrency)

## Goal

Add TanStack Query as the app's data layer: a `QueryClient` provider, shared
query-key + paging conventions, a reusable **job-polling** hook that stops at
terminal state, and a mutation convention that carries `expectedVersion` and
handles `409 CONCURRENCY_CONFLICT` uniformly.

## Scope & non-goals

- **In scope:** `@tanstack/react-query` install + provider, `QueryClient` config,
  `queryKeys` factory, `Paginated<T>` envelope type, `useJobPolling` hook,
  `useApiMutation` wrapper (error→toast, concurrency refetch), retirement of
  `use-mock-query` (replaced by real Query hooks feature-by-feature).
- **Out of scope:** endpoint-specific hooks (each lives in its feature plan).

## Affected files

| Path (FSD layer)                           | New? | Intent                                                             |
| ------------------------------------------ | ---- | ------------------------------------------------------------------ |
| `src/app/providers/query-provider.tsx`     | yes  | `QueryClientProvider` + configured client                          |
| `src/app/app.tsx`                          | no   | mount `QueryProvider` above router                                 |
| `src/shared/lib/query/query-keys.ts`       | yes  | typed query-key factory (cases, hearing, docs, …)                  |
| `src/shared/lib/query/use-job-polling.ts`  | yes  | poll `GET /jobs/{id}` to `Succeeded`/`Failed`                      |
| `src/shared/lib/query/use-api-mutation.ts` | yes  | mutation wrapper: error toast + concurrency handling               |
| `src/shared/types/query-types.ts`          | no   | align `Paginated<T>` with guide `{items,page,pageSize,totalCount}` |
| `src/shared/hooks/use-mock-query.ts`       | no   | deleted once no feature imports it (integration-11)                |
| `docs/codemap.md`, `docs/architecture.md`  | no   | document the query layer                                           |

## Design notes

- **QueryClient defaults:** `staleTime` ~30s, `retry` only on network/5xx (never
  retry 4xx), `refetchOnWindowFocus: false`. Global `onError` is **not** used for
  mutations — `useApiMutation` handles it so field-errors can be surfaced inline.
- **Paging envelope.** Guide returns `{ items, page, pageSize, totalCount }` for
  cases/participants and `{ items, page, pageSize, total }` for audit (§13). Model
  both: `Paginated<T>` (totalCount) and reuse for audit with a `total` adapter in
  integration-09. `totalPages = Math.ceil(totalCount / pageSize)`.
- **`useJobPolling(jobId)`** (guide §9 `GET /jobs/{id}`, §12): TanStack Query with
  `refetchInterval: (q) => isTerminal(q.state.data?.status) ? false : 1500`.
  Returns `{ job, isTerminal, isSucceeded, isFailed }`. `Job.status ∈ Queued |
Processing | Succeeded | Failed`; `jobType ∈ FinalTranscription |
DocumentGeneration | DocumentPdfExport`. On `Failed`, expose `errorCode` +
  `errorMessageSafe`. Callers (transcribe, generate, export) key downstream
  refetches off `isSucceeded`.
- **`useApiMutation`** wraps `useMutation`: on `ApiError` with
  `code === "CONCURRENCY_CONFLICT"` → invalidate the resource's query (caller
  passes `invalidateKeys`) and toast the "edited by someone else, refetched"
  message; do **not** auto-retry (guide §16.4). Other `ApiError` → toast
  `errorMessageKey`. Returns `fieldErrors` for form binding.
- **Concurrency convention** (guide §16): a resource hook stores `version` from
  its GET; a mutation sends `expectedVersion`; on success TanStack Query cache is
  updated with the response's new `version`. This plan provides the helper; each
  feature plan states which mutations carry `expectedVersion`.

## Steps

1. [x] Install `@tanstack/react-query`; add `query-provider.tsx` and mount it in `app.tsx` — `feat: add tanstack query provider`
2. [x] Add `query-keys.ts` factory — `feat: typed query key factory`
3. [x] Align `Paginated<T>` in `query-types.ts` with the guide envelope — `refactor: match paged response envelope to api`
4. [x] Add `use-job-polling.ts` (1.5s interval, terminal stop, error fields) — `feat: background job polling hook`
5. [x] Add `use-api-mutation.ts` (error toast + concurrency refetch, field errors) — `feat: api mutation wrapper with concurrency handling`
6. [x] docs: sync `docs/codemap.md` + `docs/architecture.md` — `docs: document tanstack query data layer`

## Risks / ripple / escalation

- Shared surface: provider mounts above the whole app; every later hook builds on
  these helpers.
- New dependency: `@tanstack/react-query` (needs user approval).
- Escalation: `use-mock-query` stays until the last feature migrates off it;
  deleting it early breaks builds — remove in integration-11.
- Rollback: additive; existing mock hooks keep working until each is migrated.

## Verification

- `npx tsc -b` clean, `npm run lint` clean.
- App boots with the provider mounted; React Query Devtools (dev-only) shows the
  client.
- `useJobPolling` stops firing once a job hits `Succeeded`/`Failed` (verified with
  a temporary fixture id against the dev proxy).
