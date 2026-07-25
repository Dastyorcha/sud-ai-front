# Claude Skills & Commands

Every skill under `.claude/skills/` and slash command under `.claude/commands/`. Update this doc when you add or change either — `enforce-doc-sync.sh` blocks Stop otherwise.

## Skills

### `ui-designer` (auto-trigger)

Strict ruleset for any visual change — tokens, shadcn primitives, widgets, views, the `/tools` playground, copy. Triggers on paths under `src/shared/components/ui/`, `src/widgets/`, `src/views/`, `src/index.css`, and on styling / theme / responsive / a11y / forms / copy tasks. Enforces: tokens only from `src/index.css`, `cn()` + `cva`, **strict component reuse (never a raw `<button>` or other hand-rolled HTML tag that has a primitive)**, **route + heavy-UI code splitting (`React.lazy`)**, mobile-first responsive, light+dark, accessibility, admin-panel data-state patterns. **No SEO.** Every string routes through the custom i18n `t()` (`docs/i18n.md`) — no hardcoded copy. Read `docs/architecture.md` first.

### `refactor-code` (manual — `/refactor-code`)

Behavior-preserving, **incremental** refactor. Aligns only files changed since the last run (commit watermark in `.claude/refactor-history.md`) to this repo's conventions: kebab-case + FSD placement, tokens, `cn()`/`cva`, primitive reuse, dead-code removal. Verifies with `tsc -b` + `eslint`. Never commits; logs a watermark line. Never touches `src/shared/components/ui/**`.

### `doc-writer` (manual — `/doc-writer <topic>`)

Documents one topic completely across all related `docs/*.md`. Reads the **Doc map** in `CLAUDE.md` to pick affected docs — never crawls `docs/`. Creates a new doc + updates the Doc map when nothing fits.

### `plan-task` (manual — `/plan-task <task>`)

The agentic-workflow entry point. Routes a task by size, produces an implementation plan (Opus planner) into `plans/idea/`, hands off to the Sonnet implementer, and uses the Haiku quick-fixer for trivial edits. Escalates to the user when a "small" change would alter shared logic or ripple across the codebase. Full model-orchestration spec: `docs/agentic-workflow.md`.

## Commands

| Command          | Runs                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `/doc-writer`    | Invokes the `doc-writer` skill on `$ARGUMENTS`.                   |
| `/refactor-code` | Invokes the `refactor-code` skill (incremental, since watermark). |
| `/plan-task`     | Invokes the `plan-task` skill to plan + orchestrate `$ARGUMENTS`. |

## Style-change sync rule

A change to reusable design surface (`src/index.css`, `src/shared/components/ui/**`, shared `cva`/variant logic, `src/shared/custom/**`) must, in the same change, update: the `/tools` playground, `CLAUDE.md` (if project guidance shifts), `docs/architecture.md`, and the `ui-designer` skill (if a rule changes). State explicitly when nothing is affected.
