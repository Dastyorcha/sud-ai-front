# Phase 03 — Authentication and Role-Based Access

**Duration:** Week 2, days 4–5
**Spec refs:** FR-01, §4 (roles), NFR-01, §16.1 #1, D-10
**Prerequisites:** Phase 02

**Goal:** identity is established once at boot, permissions are expressed as capabilities rather than role checks scattered through components, and no sensitive token survives a page close.

---

## Step 3.1 — Login page (`/login`)

The only server-rendered route in the application (D-03).

- Email + password, React Hook Form + Zod
- Inline field errors from `ApiError.details[]`
- Submit disabled with an inline spinner while pending; no page reload
- Failed login shows one message — *"Login yoki parol notoʻgʻri"* — never distinguishing which was wrong
- `?next=` param preserved and honoured after success

**Demo account hints** rendered only when `NEXT_PUBLIC_USE_MOCKS === true`, listing the four demo roles. FR-01 requires pre-created demo accounts; showing them in production would be a finding in a security review.

Layout: single centred column on `--paper`, wordmark in Plex Sans, no illustration, no marketing copy. This screen is a door, not a landing page.

---

## Step 3.2 — Session management

### Token storage — D-10

```ts
// features/auth/stores/auth-store.ts  (Zustand, no persist middleware)
interface AuthState {
  accessToken: string | null;   // memory only — never localStorage, never sessionStorage
  user: User | null;
  status: 'booting' | 'authenticated' | 'anonymous';
}
```

The refresh token lives in an httpOnly cookie set by the backend. The access token dies with the tab. NFR-01 treats this data as sensitive; a token readable by JavaScript is an XSS liability that a court deployment review will flag.

### Boot sequence

```text
app mount
  → status = 'booting'
  → POST /auth/refresh          (cookie is sent automatically)
      ├─ 200 → store accessToken → GET /auth/me → status = 'authenticated'
      └─ 401 → status = 'anonymous' → redirect to /login
```

A `<SessionGate>` component renders `<LoadingState variant="page" />` while `status === 'booting'`. No authenticated screen renders against an unknown user — that is how you get a flash of the wrong role's navigation.

### Refresh on 401

Already implemented in Phase 02 Step 2.2. This phase wires the auth store into it.

---

## Step 3.3 — Route protection

Two layers, because each catches what the other misses.

**Layer 1 — `middleware.ts`.** Checks refresh-cookie presence and redirects to `/login?next=<path>` when absent. Cheap, runs before render, prevents the authenticated shell from flashing.

**Layer 2 — `<RoleGate allow={[...]}>`.** Client-side, wraps route segments. Middleware cannot know the user's role (the cookie is opaque to it), so admin routes are gated here.

Both are UX, not security. The backend enforces authorisation; the frontend only avoids showing doors that will not open.

---

## Step 3.4 — Capability map (`src/lib/capabilities.ts`)

**Components never check roles. They check capabilities.**

```ts
export type Capability =
  | 'case.create' | 'case.edit' | 'case.archive'
  | 'participant.manage'
  | 'hearing.create' | 'hearing.record'
  | 'transcript.edit' | 'transcript.approve'
  | 'event.verify'
  | 'document.generate' | 'document.edit'
  | 'document.submit' | 'document.approve' | 'document.export'
  | 'admin.templates.read' | 'admin.audit.read' | 'admin.providers.read';

const CAPABILITIES: Record<UserRole, Capability[]> = {
  ADMIN:          [/* all */],
  CLERK:          ['case.create', 'case.edit', 'participant.manage',
                   'hearing.create', 'hearing.record',
                   'transcript.edit', 'transcript.approve', 'event.verify',
                   'document.generate', 'document.edit', 'document.submit',
                   'document.export'],
  JUDGE:          ['document.edit', 'document.approve', 'document.export'],
  LEGAL_EXPERT:   ['admin.templates.read'],
  DEMO_OPERATOR:  [/* clerk minus archive and export */],
};
```

Consumed as:

```tsx
const can = useCapability();
{can('document.approve') && <ApproveButton />}
```

**Why this matters:** §4.3 says the judge role in MVP is narrow but explicitly grows in later phases. With scattered `user.role === 'JUDGE'` checks, growing it means auditing every component. With this map, it means editing one array.

Note the clerk deliberately lacks `document.approve` and the judge deliberately lacks `transcript.edit` — §4.2 and §4.3 separate these duties, and Phase 12's E2E suite tests both negatives.

---

## Step 3.5 — Idle timeout and logout

- 30 minutes of no interaction → dialog with a 60-second countdown → logout
- **Suppressed entirely while a hearing is actively recording.** A clerk who does not touch the keyboard for thirty minutes during testimony is doing their job correctly; logging them out mid-hearing would destroy the record.
- Logout: `POST /auth/logout`, clear the auth store, `queryClient.clear()`, redirect to `/login`

Clearing the query cache on logout is not optional — cached case data from one user must not be visible to the next user on a shared courtroom workstation.

---

## Step 3.6 — Navigation by capability

The left nav renders only what the current user can reach:

| Item | Capability |
|---|---|
| Boshqaruv paneli | always |
| Ishlar | `case.create` or `case.edit` |
| Hujjatlar | `document.edit` or `document.approve` |
| Shablonlar | `admin.templates.read` |
| Audit | `admin.audit.read` |
| Tizim holati | `admin.providers.read` |

---

## Files produced

```text
src/app/(auth)/login/page.tsx
src/features/auth/screens/LoginScreen.tsx
src/features/auth/stores/auth-store.ts
src/features/auth/components/{SessionGate,RoleGate,IdleTimer}.tsx
src/features/auth/hooks/{useSession,useCapability}.ts
src/lib/capabilities.ts
middleware.ts
```

---

## Exit criteria

- [ ] Four demo accounts (admin, clerk, judge, legal expert) log in successfully
- [ ] Each sees only its permitted navigation items
- [ ] Direct URL navigation to a forbidden route is refused, not merely hidden
- [ ] Access token is absent from localStorage, sessionStorage and cookies readable by JS
- [ ] Page refresh preserves the session via refresh cookie
- [ ] Six concurrent 401s produce exactly one refresh call
- [ ] Idle logout fires after 30 minutes, and is suppressed during active recording
- [ ] Logout clears the query cache — verified by inspecting devtools after switching users

---

## Notes for the implementer

The idle-timeout suppression during recording is the kind of detail that looks like a small edge case and is actually the difference between a product a clerk trusts and one they resent. Court hearings have long silent stretches. Losing the session at minute 43 of a 50-minute hearing would be unforgivable, and it is exactly the sort of thing that happens live in a tender demo.
