# Agentic Workflow

How AI-driven development runs in this repo: task sizing → model routing → subagent orchestration → plan lifecycle. The goal is **maximum quality per token** — never burn tokens on a task smaller than the model assigned to it.

Entry point: the `plan-task` skill (`/plan-task <task>`). Subagents live in `.claude/agents/`. When you add or change an agent, update this doc — `enforce-doc-sync.sh` enforces it.

**Every task starts the same way:** sync and branch from the latest main — `git checkout main && git pull origin main`, then `git checkout -b <type>/<kebab-desc>` — and do the work on that new branch. Never edit on `main` or reuse an old feature branch for a new task. The `planner` bakes this in as the plan's first step; the `implementer`/`quick-fixer` do it before their first edit; `prepare-branch.sh` enforces it. See `CLAUDE.md` → Workflow & Git.

## Task sizing

Classify every incoming task **before** doing anything else.

| Size        | Definition                                                                                                     | Route to                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Trivial** | One obvious edit, no design decisions, no ripple: fix a typo, tweak a class, rename a local var, bump a value. | **Haiku 4.5** (`quick-fixer`) — no plan.                                           |
| **Small**   | A contained change to existing behavior in 1–2 files, no new architecture.                                     | **Sonnet 5** directly — no plan, unless it touches shared logic (see escalation).  |
| **Medium**  | New feature/widget/view, multi-file change, or anything needing design decisions.                              | **Plan first** (Opus) → implement (Sonnet).                                        |
| **Large**   | Cross-cutting change, new subsystem, migration, or anything that alters project logic/structure.               | **Plan first** (Opus) → implement (Sonnet), and **ask the user** before executing. |

The model orchestration (Opus plan → Sonnet implement) applies to **medium and large** tasks only. Trivial/small tasks skip planning to save tokens.

## Model routing

| Model         | Reasoning effort | Role                                                                          |
| ------------- | ---------------- | ----------------------------------------------------------------------------- |
| **Opus 4.8**  | medium           | Planning only. Produces the implementation plan; does not write feature code. |
| **Sonnet 5**  | max              | Implementation. Executes the plan, writes and verifies the code.              |
| **Haiku 4.5** | —                | Trivial mechanical edits with no thinking required.                           |

Reasoning effort is not settable per subagent in Claude Code, so it is applied as **guidance** here and set explicitly where the surface supports it (the GitHub Action config, the Workflow/Agent SDK `effort` field). When driving interactively, switch the session model to match the phase, or delegate to the matching subagent.

## Subagents (`.claude/agents/`)

Each subagent is scoped to "this React admin template" in its own prompt — update that framing line alongside any project-identity change (see `src/shared/constants/app.ts`).

| Agent         | Model  | Use for                                                              |
| ------------- | ------ | -------------------------------------------------------------------- |
| `planner`     | opus   | Turn a medium/large task into a written plan in `plans/idea/`.       |
| `implementer` | sonnet | Execute an approved plan; write + verify code; commit incrementally. |
| `quick-fixer` | haiku  | Trivial edits; no planning, no architecture decisions.               |
| `explorer`    | sonnet | Read-only codebase search that returns a summary, not file dumps.    |

**Local orchestration:** the main session (or `plan-task`) delegates — `planner` drafts the plan, the user/main approves, `implementer` executes, `quick-fixer` handles anything trivial spun off along the way. Use `explorer` for any search wider than ~3 greps.

**Two rules every code-writing agent enforces** (full detail in `ui-designer`): **reuse existing components — never hand-roll a raw `<button>`/`<input>`/`<label>`/`<form>`/overlay `<div>`** when a primitive exists (`Button`, `Input`, `Label`, `Form`, `Dialog`/`ReusableModal`, `Card`, `NoData`, …; raw tags only inside `shared/components/ui/*`), and **code-split as you build** — every route is `React.lazy` + `Suspense`, heavy/conditional UI is lazy-loaded out of the entry bundle.

## Plan lifecycle — `plans/{idea,doing,done}/`

Every medium/large task gets a plan file that moves across status folders:

1. **`plans/idea/`** — `planner` writes `NNN-<kebab-title>.md` from `plans/_template.md`. Awaits approval.
2. **`plans/doing/`** — on approval, `git mv` the file here. `implementer` works against it, checking off steps and pushing per sub-task.
3. **`plans/done/`** — when merged/complete, `git mv` here. It becomes the historical record.

Naming: zero-padded ordinal + kebab title (`012-tools-data-table.md`). The plan is the single source of intent — `implementer` reads it instead of re-deriving scope.

## Escalation — decide vs. ask

**Decide autonomously** (act, then explain): trivial/small changes fully contained in the touched files; visual choices within `ui-designer`; naming, layout, copy within the guides.

**Ask the user first** when a change that looks small would:

- alter shared logic in `src/features/` or `src/shared/` that other code depends on,
- change a route, a public API surface, `route-paths.ts`, or a data contract,
- ripple into files outside the stated scope,
- introduce a new dependency, or
- change project structure/logic in a way not obviously reversible.

When in doubt on a **contained** change, act and explain. When in doubt on a change that **touches shared surface**, ask.

## Remote / autonomous (`@claude` on GitHub)

Mentioning `@claude` in an issue, PR, or review comment triggers `.github/workflows/claude.yml`; PRs are auto-reviewed by `claude-code-review.yml`. Remote runs follow this same doc: size the task, plan medium/large work into `plans/idea/`, implement, and open/update a PR. Setup (install the Claude GitHub App + add the `CLAUDE_CODE_OAUTH_TOKEN` secret) is documented in `CLAUDE.md` → Remote workflow.

## Token discipline

- Follow the lookup ladder in `CLAUDE.md` — stop as soon as you have the answer. Never crawl source on a hunch.
- Never read `node_modules/`, `dist/`, build output, or lockfiles.
- Match the model to the task size — do not spend Opus on a typo or Sonnet-max on a one-line tweak.
- Plans and docs are the memory: write intent down once, don't re-explain it every turn.
