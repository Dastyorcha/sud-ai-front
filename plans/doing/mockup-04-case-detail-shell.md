# Mockup 04 — Case detail shell

- **Status:** idea
- **Size:** medium
- **Author model:** Fable 5 (planner)

## Goal

Case detail page frame per mockup: back button ("Ishlar ro'yxati"), case number + parties headline, stage badge, four stat cards (documents, duration in days, participants, claim amount), and three sub-tabs — Bayonnoma / Sud hujjatlari / Sudya maslahatchisi — hosting the modules from mockup-05/06/07.

## Scope & non-goals

- **In scope:** detail view layout, stat cards, tab bar (lazy-load each tab's module), breadcrumb update in header (mockup-01), route `/:lang/cases/:id` via `ROUTE_PATHS`.
- **Out of scope:** tab contents (own plans); reuse phase-04 case/participant services for data.

## Affected files

| Path (FSD layer)                      | New? | Intent                                |
| ------------------------------------- | ---- | ------------------------------------- |
| `src/views/case-detail/`              | ?    | shell composition (restyle if exists) |
| `src/widgets/case-stats/`             | yes  | 4 stat cards                          |
| `src/shared/components/custom/`       | ?    | sub-tab bar (or shadcn Tabs restyled) |
| `src/shared/constants/route-paths.ts` | no   | case detail path                      |
| `src/app/app.tsx`                     | no   | lazy route                            |

## Steps

1. [x] Detail header: back button, number, parties line, stage badge; wire breadcrumb — `feat: case detail header`
2. [ ] Stat cards widget fed from case + participants + documents services — `feat: case detail stat cards`
3. [ ] Sub-tabs with lazy `Suspense` modules (placeholder panels until 05/06/07 land) — `feat: case detail sub tabs`
4. [ ] i18n + codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- Duration/doc-count derivations may not exist on the case type — compute in view, don't change shared types unless needed (escalate if contract change required).
- New dependency: none.

## Verification

- Navigate dashboard card → detail → back; stats match fixture data; tabs switch and lazy-load; light + dark.
