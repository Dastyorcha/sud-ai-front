# Integration 03 — Auth, session & roles

- **Status:** done
- **Size:** large
- **Author model:** Opus 4.8 (planner)
- **Reference:** Guide §2 (auth/session), §7 (auth endpoints), roles table

## Goal

Replace the demo `localStorage` role stub with a real JWT session: login,
single-flight refresh with rotation, logout, `/auth/me`, and role-driven
capability gating wired into the existing `can()`/auth-guard call sites.

## Scope & non-goals

- **In scope:** token store, `auth.service`, login/refresh/logout/me endpoints,
  single-flight refresh on `401`/near-expiry, session context replacing
  `use-court-auth`, role mapping (`Administrator|Secretary|Judge|LegalExpert|
DemoOperator`), auth-guard + login form wiring, logout action.
- **Out of scope:** case-level access checks beyond role (enforced server-side;
  UI hides actions on `403` — integration-04+).

## Affected files

| Path (FSD layer)                                 | New? | Intent                                                         |
| ------------------------------------------------ | ---- | -------------------------------------------------------------- |
| `src/shared/lib/auth/token-store.ts`             | yes  | in-memory + persisted access/refresh tokens + expiry           |
| `src/shared/lib/auth/refresh-manager.ts`         | yes  | single-flight refresh promise, rotation swap                   |
| `src/features/auth/auth.service.ts`              | yes  | login/refresh/logout/me calls                                  |
| `src/features/auth/use-session.ts`               | yes  | current user/role/`can()` from `/auth/me` (React Query)        |
| `src/features/auth/use-court-auth.ts`            | no   | re-point to real session or remove; keep `can()` signature     |
| `src/shared/constants/court-permissions.ts`      | no   | map matrix keys to the guide's 5 API roles                     |
| `src/shared/lib/http/api-client.ts`              | no   | wire token getter + 401 refresh interceptor to refresh-manager |
| `src/widgets/layout/auth-guard/*`                | no   | redirect to `LOGIN` when no valid session                      |
| `src/shared/components/pages/auth/loginForm.tsx` | no   | submit to `auth.service.login`                                 |
| `src/views/admin/admin.tsx`                      | no   | remove/replace demo role switcher (real role from `/auth/me`)  |
| `src/shared/lib/i18n/messages/*.ts`              | no   | auth error/labels (`INVALID_CREDENTIALS`, session expired)     |
| `docs/codemap.md`                                | no   | sync auth layer                                                |

## Design notes

- **Token store** (guide §2): keep `accessToken`, `accessTokenExpiresAt`,
  `refreshToken`, `refreshTokenExpiresAt`. Persist to `localStorage` so refresh
  survives reload (demo scope); expose sync getters for the axios interceptor.
- **Recommended flow (guide §2.1):** login → store tokens → attach Bearer →
  refresh once when near `accessTokenExpiresAt` **or** on `401` → atomic swap of
  both tokens → if refresh returns `401`, clear session + go to `LOGIN` → logout
  posts the current refresh token.
- **Single-flight refresh (guide §2, mandatory):** `refresh-manager` holds one
  in-flight refresh promise; concurrent `401`s await the same promise, then retry
  their original request with the new access token. Never fire parallel refreshes
  (rotation would invalidate tokens). The axios response interceptor: on `401`
  with a valid refresh token and not already-retried → `await
refreshManager.refresh()` → retry once; on refresh failure → clear + redirect.
- **`/auth/me`** drives `use-session`: `{ id, firstName, lastName, email, role }`.
  Role feeds `can(action)`. Handle `401 INVALID_ACCESS_TOKEN` /
  `401 USER_NOT_AVAILABLE` → force re-login.
- **Roles.** Guide roles are `Administrator | Secretary | Judge | LegalExpert |
DemoOperator`. Reconcile `court-permissions.ts` matrix (currently repo-specific
  roles like `CLERK`) to these five; `LegalExpert` has effectively no protected
  workflow permissions (guide §2), `DemoOperator` = demo read flows. Keep the
  `can()` call sites unchanged — only the matrix keys change.
- **Logout** (guide §7.3): POST refresh token; `204` even if not found; always
  clear local tokens.

## Steps

1. [x] Add `token-store.ts` (persisted tokens + expiry, sync getters) — `feat: token store`
2. [x] Add `auth.service.ts` (login/refresh/logout/me) — `feat: auth service endpoints`
3. [x] Add `refresh-manager.ts` (single-flight refresh + rotation swap) — `feat: single-flight token refresh`
4. [x] Wire api-client interceptor: attach Bearer + 401→refresh→retry once — `feat: bearer attach and 401 refresh retry`
5. [x] Add `use-session.ts` over `/auth/me`; re-point `use-court-auth` to it — `feat: real session hook from auth/me`
6. [x] Map `court-permissions.ts` matrix to the five API roles — `refactor: align permission matrix to api roles`
7. [x] Wire `loginForm` → `auth.service.login`; handle `INVALID_CREDENTIALS` — `feat: real login form submit`
8. [x] Wire auth-guard redirect + logout action; replace admin demo role switcher — `feat: session guard and logout`
9. [x] Add auth i18n keys (uz/en/ru) — `feat: auth session copy`
10. [x] docs: sync `docs/codemap.md` — `docs: document auth session layer`

## Risks / ripple / escalation

- Shared surface: `court-permissions.ts`, auth-guard, api-client — high ripple.
  Escalate before changing the `CourtAction` capability contract.
- Refresh rotation is easy to get wrong: verify single-flight under concurrent
  `401`s (two parallel requests must trigger exactly one refresh).
- Escalation: no user/judge-list endpoint (§17) — case-create judge selection is
  handled in integration-04, not here.
- Rollback: keep demo login credentials from the guide's seed for testing.

## Verification

- `npx tsc -b` + `npm run lint` clean.
- Manual: login with a seed account → `/auth/me` renders role → protected route
  loads; let access token expire → next call silently refreshes once; revoke
  refresh → redirected to login.
- Fire two simultaneous requests after expiry → network shows a single
  `/auth/refresh`.
