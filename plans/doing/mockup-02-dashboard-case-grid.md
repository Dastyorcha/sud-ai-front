# Mockup 02 — Dashboard case grid

- **Status:** idea
- **Size:** medium
- **Author model:** Fable 5 (planner)

## Goal

Rebuild the cases list page as the mockup's dashboard: search bar, "Yangi ish ochish" gold button, type + stage filter selects with a live count, and a responsive grid of case cards (number, stage badge, parties "X vs Y", subject, type tag, claim amount, date).

## Scope & non-goals

- **In scope:** dashboard view, case-card widget, client-side filter/search over the existing case service (phase-04 fixtures), stage-badge component reused app-wide.
- **Out of scope:** the new-case wizard itself (mockup-03), case-detail page (mockup-04), backend search.

## Affected files

| Path (FSD layer)                                        | New? | Intent                                          |
| ------------------------------------------------------- | ---- | ----------------------------------------------- |
| `src/views/dashboard/` (or restyle existing cases view) | ?    | search + filters + grid composition             |
| `src/widgets/case-card/`                                | yes  | card per mockup layout                          |
| `src/shared/components/custom/stage-badge`              | yes  | colored badge per stage (tokens from mockup-01) |
| `src/shared/types/`                                     | no   | ensure case type covers stage/type/amount       |
| `src/shared/constants/route-paths.ts`                   | no   | dashboard + case-detail paths                   |

## Steps

1. [x] `StageBadge` + `CaseTypeTag` shared components using stage tokens — `feat: stage badge and case type tag`
2. [x] `CaseCard` widget (header/body/footer layout, click → case detail route) — `feat: case card widget`
3. [x] Dashboard view: search input, type/stage selects, count label, grid; filter logic on fixture data — `feat: dashboard case grid with filters`
4. [x] i18n for case types/stages/labels; codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- Case type/stage enums live in `src/shared/types` — if mockup stages (qabul, tayyorgarlik, sudkorishi, qaror, apellyatsiya, ijro) differ from existing enums, extend rather than rename; escalate if a rename is needed.
- New dependency: none.

## Verification

- Filters combine (type AND stage AND search) and count updates.
- Grid responsive (1/2/3 columns), light + dark, three locales.
