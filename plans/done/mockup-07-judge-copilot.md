# Mockup 07 — Judge copilot tab

- **Status:** idea
- **Size:** medium
- **Author model:** Fable 5 (planner)

## Goal

The "Sudya maslahatchisi" tab per mockup: a 2×2 card grid — 1) procedural defects checker (warning/danger/info items with risk badges), 2) relevant law articles (FPK/FK/IPK tag, article number, title, relevance bar, source footer), 3) procedural deadlines (urgent/warning/normal items, countdown + mini progress), 4) AI conclusions & recommendations (tag, title, text, "Hujjatga qo'shish" action inserting into the mockup-06 editor).

## Scope & non-goals

- **In scope:** four copilot card widgets, fixture data per case in the mock service layer, "add to document" wiring into the document editor state.
- **Out of scope:** real AI analysis or Lex.uz integration — all data is per-case fixtures shaped like a future API response.

## Affected files

| Path (FSD layer)                       | New? | Intent                                                           |
| -------------------------------------- | ---- | ---------------------------------------------------------------- |
| `src/widgets/copilot-grid/`            | yes  | tab module composing 4 cards (lazy)                              |
| `src/widgets/copilot-grid/components/` | yes  | defects, articles, deadlines, suggestions cards                  |
| `src/shared/types/`                    | yes? | `CopilotDefect`, `LawArticleRef`, `Deadline`, `Suggestion` types |
| mock services/fixtures                 | yes  | copilot service returning per-case fixtures                      |
| `src/features/document-fill/`          | no   | expose "append suggestion to section" action                     |

## Steps

1. [x] Types + copilot fixture service — `feat: copilot types and mock service`
2. [x] Defects card (severity styles, risk badges) + articles card (relevance bars) — `feat: defects and law articles cards`
3. [x] Deadlines card (countdown, mini progress) + suggestions card with add-to-document — `feat: deadlines and ai suggestions cards`
4. [x] i18n + codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- "Hujjatga qo'shish" couples copilot to document-editor state (`src/features/`) — keep it a small exported action; escalate if editor state must be restructured.
- New dependency: none.

## Verification

- All four cards render per-case fixture data; severity/relevance visuals match tokens; add-to-document appends text into section III and shows a toast; responsive to single column on narrow widths; light + dark.
