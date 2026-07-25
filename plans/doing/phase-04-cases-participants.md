# Phase 04 — Cases and Participants

**Duration:** Week 3
**Spec refs:** FR-02, UC-01, §14.2, §14.3, §9.7, §16.1 #2–5
**Prerequisites:** Phase 03
**Status:** in progress (`plans/doing/`)

---

## Repo adaptation (Vite + React Router) — overrides the Next.js steps below

This project is Vite + React Router v7, not Next.js. Where the steps below say
otherwise, follow this mapping:

| Plan says (Next.js)                        | Do this instead (this repo)                                                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(app)/cases/page.tsx` route files | Add routes in `src/app/app.tsx` under the `/:lang` `AppShell`; screens live in `src/views/cases/*` (list/detail) mirroring `src/views/users/`.                                                      |
| `src/features/cases/screens/*`             | Screen components in `src/views/cases/`; data hooks in `src/features/cases/` (mirror `src/features/users/use-users.ts`).                                                                            |
| TanStack Query                             | Plain `useState`/`useEffect` consumer hooks over the mock services (`src/shared/lib/mock-api/court-case.service.ts`, `participant.service.ts`) — the established repo pattern.                      |
| MSW                                        | The `mock-api` service layer (already built for cases + participants).                                                                                                                              |
| `nuqs` URL-sync                            | React Router `useSearchParams` (as `src/views/users/users.tsx` does).                                                                                                                               |
| Zustand `sessionStorage` draft store       | A small `sessionStorage`-backed hook/util under `src/features/cases/` (no Zustand dependency unless escalated).                                                                                     |
| Route paths                                | `ROUTE_PATHS.CASES` / `CASE_NEW` / `CASE_DETAIL` + `buildRoute.caseDetail` (already added). Never hardcode paths.                                                                                   |
| shadcn primitives                          | Reuse `src/shared/components/ui/*` (Table, Input, Select, Dialog, Tabs…) and `src/shared/custom/*` (StatusBadge, Money, DateText, Loading/Empty/Error states, record primitives). No raw HTML tags. |
| All copy                                   | Through `t()` — keys under `cases.*` / `enums.*` (uz/en/ru).                                                                                                                                        |

**Progress**

- [x] Route paths + nav item + `cases.*` i18n scaffolding
- [ ] Step 4.2 — Case list (`/cases`) — `useCases` hook + `views/cases/cases.tsx`
- [ ] Step 4.1 — Dashboard work queues
- [ ] Step 4.3 — Case creation wizard (`/cases/new`)
- [ ] Step 4.4 — Case detail (`/cases/:caseId`)
- [ ] Step 4.5 — Participant management
- [ ] Step 4.6 — Vocabulary panel
- [ ] Step 4.7 — Hearing setup (depends on Phase 05)

**Goal:** UC-01 complete — a clerk can create a case with participants bound to procedural roles, and the case vocabulary (§9.7) is visible and editable, because it directly determines STT accuracy later.

---

## Step 4.1 — Dashboard (`/dashboard`)

Deliberately minimal. This is not a metrics product.

- **Faol majlislar** — hearings currently `IN_PROGRESS`, each a one-click resume. First position because a clerk returning to a browser mid-hearing needs this above everything.
- **Tasdiq kutayotgan hujjatlar** — documents in `UNDER_REVIEW` (judges) or `CHANGES_REQUESTED` (clerks), filtered by capability
- **Soʻnggi ishlar** — 5 most recently updated cases
- **Yaratish** — new case action

No charts. No counts-that-mean-nothing. Each block is a work queue.

---

## Step 4.2 — Case list (`/cases`)

Data table columns: case number (Mono), court, case type, status badge, participant count, last hearing date, updated.

- Server-driven pagination (offset assumed; isolated in one adapter per the Phase 02 deferred-decisions table)
- Search with 400ms debounce across case number, court and participant names
- Filters: status, case type, court type, date range
- Sortable columns
- **URL-synced state** via `nuqs` — a filtered view is shareable and survives refresh
- Row click → case detail; keyboard: `↑`/`↓` navigate, `Enter` opens

Empty states differ: no cases at all invites creation; no cases matching filters offers to clear them. These are different situations and the copy says so.

---

## Step 4.3 — Case creation wizard (`/cases/new`)

Three steps. UC-01 has real cognitive load — a single long form invites abandonment mid-way.

### Step 1 — Ish maʼlumotlari

`case_number`, `court_name`, `court_type`, `case_type`, `judge_id` (select from users with the judge role).

Case number gets a format hint and Mono input.

### Step 2 — Ishtirokchilar

Repeatable rows: `display_name`, `organization_name` (optional), `role` (ParticipantRole select), `identifier`.

Zod cross-field validation enforces **at least one claimant and at least one defendant**, and rejects duplicate names within a role. Add-row keyboard shortcut; role select defaults to the next unfilled required role, which removes most of the clicking.

### Step 3 — Tekshirish

Read-only summary of both prior steps with edit links. Then create.

### Draft persistence

Wizard state lives in a Zustand store persisted to `sessionStorage` under `lexkotib:case-draft`. An accidental refresh or a misclicked back button must not destroy ten minutes of typing. Cleared on successful creation and on explicit cancel.

Cross-step validation runs before advancing, so step 3 can never present an invalid summary.

---

## Step 4.4 — Case detail (`/cases/[caseId]`)

Header: case number (Mono, large), court, status badge, judge, created-by, archive action.

Tabs:

| Tab            | Contents                                       |
| -------------- | ---------------------------------------------- |
| Umumiy         | Case requisites, editable inline by capability |
| Ishtirokchilar | Participant management (Step 4.5)              |
| Majlislar      | Hearing list + "Yangi majlis"                  |
| Hujjatlar      | Documents generated for this case              |
| Lugʻat         | Case vocabulary (Step 4.6)                     |

**Archive** requires a confirmation dialog naming the case number — §16.6 requires confirmation on audited actions, and archiving is audited (FR-12).

---

## Step 4.5 — Participant management

Inline add / edit / delete within the tab, no separate page.

- Optimistic updates with rollback on failure (permitted by the Phase 02 policy)
- Role select from `ParticipantRoleSchema`
- **Deleting a participant referenced by transcript segments is blocked** with a specific message — _"Bu ishtirokchi transkriptdagi 34 ta segmentga bogʻlangan. Avval segmentlardagi bogʻlanishni oʻzgartiring."_ — plus a link to the affected segments. A generic 409 toast here would be a dead end for the clerk.
- Voice reference upload (`voice_reference_uri`, §14.3) is stubbed as a disabled control with a "keyingi bosqichda" note. It exists in the schema but not in MVP scope.

---

## Step 4.6 — Case vocabulary panel (§9.7)

This panel looks like a minor feature and is not. The vocabulary is injected into the STT provider and used by the post-processing validator; a missing organisation name here becomes a garbled organisation name in every document later.

Display auto-derived terms grouped by origin:

```text
Ishtirokchilar        — participant names and organisations
Sud tarkibi           — judge, clerk
Hujjat raqamlari      — contract and document numbers from case metadata
Joy nomlari           — locations
Yuridik terminlar     — case-type-specific legal phrases
```

Each term shows its weight. Manual terms can be added at weight `1.0` and removed. Auto-derived terms cannot be deleted, only down-weighted, because they come from case requisites the record depends on.

Show a plain-language note explaining what the vocabulary does — the clerk will not otherwise understand why it deserves attention.

---

## Step 4.7 — Hearing creation and setup (`/hearings/[hearingId]/setup`)

Page 6 of §16.1. Created from the case detail Majlislar tab.

Setup screen contents (this is the pre-flight check UC-02 steps 3–4 require):

1. **Hearing details** — `scheduled_at`, expected participants
2. **Audio device check** — device selector, live level meter, 5-second test recording with playback. Built on Phase 05 components; if Phase 05 is not yet complete, stub this section and return in Phase 05 Step 5.7.
3. **Participant roll call** — checklist of who is present; absent participants are recorded, since attendance appears in the protocol (§12.2 "kelgan/kelmagan shaxslar")
4. **Provider status** — which live STT provider and model will be used (`live_stt_provider`, `live_stt_model` from §14.4)
5. **"Yozishni boshlash"** — disabled until device check passes

A hearing that starts with a broken microphone wastes the entire hearing. The pre-flight check is the cheapest possible insurance.

---

## Files produced

```text
src/app/(app)/dashboard/page.tsx
src/app/(app)/cases/page.tsx
src/app/(app)/cases/new/page.tsx
src/app/(app)/cases/[caseId]/page.tsx
src/app/(app)/hearings/[hearingId]/setup/page.tsx
src/features/cases/screens/{CaseListScreen,CaseCreateScreen,CaseDetailScreen}.tsx
src/features/cases/components/{CaseTable,CaseFilters,CaseWizard,VocabularyPanel}.tsx
src/features/cases/stores/case-draft-store.ts
src/features/participants/components/{ParticipantList,ParticipantRow,ParticipantForm}.tsx
src/features/hearings/screens/HearingSetupScreen.tsx
```

---

## Exit criteria

- [ ] UC-01 completes end to end against mocks
- [ ] Refreshing the browser mid-wizard preserves all entered data
- [ ] Validation blocks a case with no claimant or no defendant
- [ ] Case list filters sync to the URL and survive a refresh
- [ ] Deleting a referenced participant is blocked with a specific, actionable message
- [ ] Vocabulary panel shows all five origin groups with weights
- [ ] Archive requires typed or explicit confirmation
- [ ] Hearing setup blocks recording until the device check passes
- [ ] Loading, empty and error states present on every list and form

---

## Notes for the implementer

Two things in this phase are easy to under-build and expensive to fix later: the sessionStorage draft persistence and the vocabulary panel. The first because losing a clerk's work once destroys trust permanently. The second because vocabulary quality silently determines STT accuracy, and by the time you notice the effect you are in Phase 07 debugging what looks like a model problem.
