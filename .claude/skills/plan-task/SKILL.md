---
name: plan-task
description: Manually triggered via `/plan-task <task>`. The agentic-workflow entry point. Sizes a task, and for medium/large work produces an Opus implementation plan in `plans/idea/`, then hands off to the Sonnet implementer; trivial edits go to the Haiku quick-fixer. Escalates to the user when a small-looking change would alter shared logic or ripple across the codebase. Read `docs/agentic-workflow.md` before applying.
---

# Plan Task

Routes a task to the right model and process by size, and manages the `plans/` lifecycle. The goal is **maximum quality per token** — never plan a typo, never one-shot a subsystem. Full spec: `docs/agentic-workflow.md`.

## 1. Size the task first

| Size        | Looks like                                                    | Process                                                                           |
| ----------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Trivial** | one obvious edit, no decisions, no ripple                     | delegate to `quick-fixer` (Haiku). No plan.                                       |
| **Small**   | contained change to existing behavior, 1–2 files              | implement directly (Sonnet). No plan — unless it touches shared logic (escalate). |
| **Medium**  | new feature/widget/view, multi-file, needs design decisions   | **plan (Opus) → implement (Sonnet)**.                                             |
| **Large**   | cross-cutting, new subsystem, migration, alters project logic | **plan (Opus) → ASK the user → implement (Sonnet)**.                              |

If unsure between two sizes, pick the larger process — a wasted plan is cheaper than a wrong subsystem.

## 2. Plan (medium/large) — Opus, into `plans/idea/`

Delegate to the `planner` subagent (model: opus). It writes `plans/idea/NNN-<kebab-title>.md` from `plans/_template.md`:

- **Goal** — one sentence.
- **Scope & non-goals** — what's in, what's explicitly out.
- **Affected files** — exact paths + intent per file (the FSD layer each belongs to).
- **Steps** — ordered, each a committable sub-task (`type: message` ready).
- **Risks / ripple** — shared surface touched, escalation points, rollback.
- **Verification** — how to prove it works (`tsc -b`, `lint`, `/tools` check, manual flow).

`NNN` = next zero-padded ordinal across all three status folders. The plan is the single source of intent — the implementer reads it instead of re-deriving scope.

## 3. Approve → `plans/doing/`

For **large** tasks, present the plan and **ask the user** before executing. For **medium** tasks, proceed unless the plan surfaced an escalation point. On go: `git mv plans/idea/NNN-*.md plans/doing/` (commit as `docs: start plan NNN`).

## 4. Implement — Sonnet (`implementer`)

The `implementer` subagent executes the plan against `plans/doing/NNN-*.md`: works step by step, **commits + pushes each step as a logical sub-task** (`type: message`), checks steps off in the plan file, keeps docs in sync, and runs verification. Trivial offshoots go to `quick-fixer`.

## 5. Done → `plans/done/`

When the work is merged/complete: `git mv plans/doing/NNN-*.md plans/done/`. The plan becomes the historical record.

## Escalation — decide vs. ask

**Decide autonomously:** trivial/small changes contained in the touched files; choices within `ui-designer`.

**ASK the user** when a small-looking change would: alter shared logic in `src/features/`/`src/shared/`; change a route, `route-paths.ts`, an API/data contract; ripple beyond the stated scope; add a dependency; or change structure/logic in a not-obviously-reversible way. On a contained change, act and explain; on shared surface, ask.

## Token discipline

- Match the model to the size — Haiku for trivial, Sonnet for implementation, Opus only for planning medium/large work.
- Follow the `CLAUDE.md` lookup ladder; use `explorer` for wide searches.
- Write intent into the plan once; don't re-explain it every turn.
- Skip planning entirely for trivial/small tasks — the plan overhead would cost more than the fix.
