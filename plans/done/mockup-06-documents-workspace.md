# Mockup 06 — Documents tab: templates + editor workspace

- **Status:** idea
- **Size:** large
- **Author model:** Fable 5 (planner)

## Goal

The "Sud hujjatlari" tab per mockup: a template selector of 5 grouped card rows (da'vo review, tayyorgarlik, sud ko'rishi/qarorlar, to'xtatish/tugatish, apellyatsiya — each card = title + FPK/IPK article), then a two-panel workspace: left "Ish ma'lumotlari" facts panel (case facts + evidence checklist), right document editor with title, collapsible sections I–IV (Kirish, Tasviriy, Asoslantiruvchi with "AI yordamida" badge, Xulosa) and actions (AI to'ldirish, Eksport, Chop etish).

## Scope & non-goals

- **In scope:** template catalog as data (id, group, title, article, icon), selector UI, facts panel fed from case data, sectioned editor recomposing phase-09/10 editors, mock "AI fill" that inserts template text with case facts interpolated.
- **Out of scope:** real AI generation, real export/print backends (Eksport = download .txt/.html stub, Chop etish = `window.print` on editor pane).

## Affected files

| Path (FSD layer)                             | New? | Intent                                                         |
| -------------------------------------------- | ---- | -------------------------------------------------------------- |
| `src/shared/constants/document-templates.ts` | yes  | 17 templates in 5 groups w/ articles                           |
| `src/widgets/template-selector/`             | yes  | grouped card grid, active state (lazy)                         |
| `src/widgets/case-facts-panel/`              | yes  | facts + evidence checklist                                     |
| `src/widgets/document-editor/`               | ?    | collapsible sections I–IV (reuse phase-09/10 editor internals) |
| `src/features/document-fill/`                | yes  | template → prefilled section text from case                    |

## Steps

1. [x] Template catalog constant + selector widget — `feat: procedural document template selector`
2. [x] Facts panel from case/participant services + evidence checklist — `feat: case facts panel`
3. [x] Sectioned editor: collapsible I–IV, section badges, AI badge on III — `feat: sectioned document editor`
4. [x] Mock AI fill + export/print stubs — `feat: ai fill and export stubs`
5. [x] i18n + codemap sync — `docs: sync codemap`

## Risks / ripple / escalation

- Overlaps phase-09 (protocol editor) and phase-10 (documents/approval) — reuse their components; escalate before duplicating an editor implementation.
- Legal template texts are placeholders — mark for domain review.
- New dependency: none (no docx lib yet; **ask** user if real .docx export is wanted).

## Verification

- Selecting a template swaps editor title/sections; AI fill interpolates real case facts; sections collapse/expand and edit; print stub renders editor only.
