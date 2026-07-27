# Mockup 00 — Court AI Assistant UI overview

- **Status:** idea
- **Size:** large (split into mockup-01 … mockup-06)
- **Author model:** Fable 5 (planner)
- **Reference:** `~/Downloads/index.html` — static "Court AI Assistant / Sud AI Yordamchisi" mockup

## Goal

Reshape the existing LexKotib frontend so its screens match the reference mockup: a judge-facing app with a case dashboard, a 5-step new-case wizard, and a case-detail workspace with three tabs — hearing transcript (bayonnoma), procedural documents (hujjatlar), and an AI judge copilot (maslahatchi).

## Mockup → plan mapping

| Mockup surface                                              | Plan                              |
| ----------------------------------------------------------- | --------------------------------- |
| App header (logo, breadcrumb, user), footer, gold theme     | `mockup-01-app-chrome-theme.md`   |
| Dashboard: search, type/stage filters, case-card grid       | `mockup-02-dashboard-case-grid.md`|
| "Yangi ish ochish" 5-step wizard modal                      | `mockup-03-new-case-wizard.md`    |
| Case detail shell: back nav, stat cards, sub-tabs           | `mockup-04-case-detail-shell.md`  |
| Protocol tab: audio player + waveform, speakers, transcript | `mockup-05-protocol-transcript.md`|
| Documents tab: template selector, facts panel, doc editor   | `mockup-06-documents-workspace.md`|
| Copilot tab: defects, law articles, deadlines, suggestions  | `mockup-07-judge-copilot.md`      |

## Ground rules for every plan

- Reuse what phases 00–11 already built (case services, transcript editor, protocol editor, documents, audio capture) — these plans restyle/recompose, they do not rebuild data layers.
- All copy through i18n `t()` (uz/en/ru); the mockup's Uzbek strings become the `uz` messages.
- shadcn primitives only — no raw HTML tags; lucide icons replace Material Icons.
- Colors/fonts become tokens in `src/index.css` (gold accent, speaker colors, stage-badge palette); verify light + dark at `/tools`.
- Routes via `ROUTE_PATHS`; every page lazy-loaded.

## Suggested order

01 (theme) → 02 (dashboard) → 04 (detail shell) → 05 (protocol) → 06 (documents) → 07 (copilot) → 03 (wizard, anytime after 02).
