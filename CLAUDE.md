# CLAUDE.md

Project guide for Claude Code. **Always loaded.** Keep it short — every detailed rule lives in a doc or skill below. Never duplicate a rule across files; if this file and a `SKILL.md` disagree, the `docs/` are the tiebreaker.

## What this project is

**React Admin Template** — a Vite + React 19 + React Router v7 single-page admin app, meant to be cloned and adapted for a new project. No public/marketing surface, **no SEO**. Optimise for data density, reusable CRUD surfaces, and fast interactions. Development is AI-driven and token-conscious.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build`
- `npm run typecheck` — `tsc -b`
- `npm run lint` — ESLint
- `npm run format` / `format:check` — Prettier
- No test runner configured yet.

## Tech stack

- **Vite** (rolldown-vite) + **React 19** + **TypeScript** strict (`@/*` → `./src/*`).
- **React Router v7** — routing at `src/app/app.tsx`, lazy-loaded pages, mounted under a `/:lang` locale prefix.
- **Tailwind CSS v4** (CSS-first, tokens in `src/index.css`) + **shadcn/ui** (new-york) at `src/shared/components/ui/`.
- **next-themes** for light/dark via `.dark` on root. **lucide-react** icons. **sonner** toasts. **react-hook-form** + **zod** forms. **motion** for animation.
- **Custom lightweight i18n** (`src/shared/lib/i18n/`, no library) — uz/en/ru, path-prefixed routing, typed `t()`. See `docs/i18n.md`.
- No SSR, no SEO.

## Workflow & Git (MUST follow on every task)

Session-aware hooks track files, enforce branch protection, and auto-open a PR on Stop. See `docs/claude-hooks.md`.

1. **Always start from the latest `main`, then open a NEW branch.** Before starting any task, sync and branch from up-to-date main:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat|fix|chore/<kebab-desc>
   ```
   Do the work on that new branch — never edit on `main`/`master`/`develop`, and don't pile a new task onto an old feature branch. `prepare-branch.sh` enforces this: it denies edits on protected branches and syncs your branch with `origin/main` once per session.
2. **Work in small increments.** Split the task into logical sub-tasks and **commit + push each one as you finish it** — do not batch everything into one commit at the end.
3. **Commit messages: `type: message`** — `type ∈ feat|fix|docs|refactor|test|style|chore|task`. Enforced by husky `commit-msg`. Stage only this session's files:
   ```bash
   bash .claude/hooks/session-add.sh
   git commit -m "feat: concise description"
   ```
4. **Keep docs in sync in the same commit.** Touch a hook → `docs/claude-hooks.md`; a skill/command → `docs/claude-skills.md`; an agent → `docs/agentic-workflow.md`; an exported symbol or file move → `docs/codemap.md`. `enforce-doc-sync.sh` blocks Stop on gaps.
5. **Stop normally.** `open-pr.sh` pushes and opens/updates the PR as a safety net — but prefer pushing incrementally yourself. Never run `--amend`; never `--no-verify` unless the user asks.

## Agentic workflow (AI-driven development)

Full spec: `docs/agentic-workflow.md`. In short:

- **Size the task first.** Trivial → Haiku (`quick-fixer`, no plan). Small → Sonnet directly. **Medium/large → plan with Opus, then implement with Sonnet.**
- Medium/large plans are written to `plans/idea/`, moved to `plans/doing/` on approval, `plans/done/` when merged.
- **Escalate to the user** when a small-looking change would alter shared logic (`src/features/`, `src/shared/`), change a route/API/data contract, ripple beyond the stated scope, or add a dependency. Otherwise decide and explain.
- Delegate via subagents in `.claude/agents/` (`planner`/`implementer`/`quick-fixer`/`explorer`). Use `/plan-task <task>` to kick off orchestration.
- **Token discipline:** match the model to the task size; never burn Opus on a typo or Sonnet-max on a one-liner.

## Token-efficient lookup (read in this order — stop as soon as you have the answer)

1. **This `CLAUDE.md`** — most questions stop here.
2. **The Doc map below** → the single `docs/*.md` it points to. Read only that file.
3. **`docs/codemap.md`** — one line per file; jump straight to the right file.
4. **Only then** grep / Read source. For any search wider than ~3 greps, use the `explorer` subagent — it returns a summary, not file dumps.

**Hard rules:** never read `node_modules/`, `dist/`, build output, or lockfiles. Plan first if a task touches >3 files. Update `docs/codemap.md` in the same change when exports/files move.

## Doc map

The single index of `docs/*.md`. `/doc-writer` reads this to pick affected docs. Do not crawl `docs/` to explore.

| Doc                        | Covers                                                                     | Sync triggers                                                   |
| -------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `docs/architecture.md`     | FSD layering, routing, naming, tokens, `/tools` playground, admin patterns | `src/{app,views,widgets,features,shared}/`, `src/index.css`     |
| `docs/agentic-workflow.md` | Task sizing, model routing, subagents, `plans/` lifecycle, escalation      | `.claude/agents/`, orchestration changes                        |
| `docs/claude-hooks.md`     | Every shell hook in `.claude/hooks/`                                       | `.claude/hooks/`                                                |
| `docs/claude-skills.md`    | Every skill + command in `.claude/`                                        | `.claude/skills/`, `.claude/commands/`                          |
| `docs/codemap.md`          | One line per source file                                                   | Any add/remove/rename of an export, or file move                |
| `docs/i18n.md`             | Locale model, message shape, `t()` API + typing, routing, formatting       | `src/shared/lib/i18n/`                                          |
| `docs/api-integration.md`  | LexKotib API endpoint map, base URL/proxy, §17 gap register, concurrency   | `src/shared/lib/http/`, `src/shared/lib/query/`, `*.service.ts` |
| `docs/qa-acceptance.md`    | TZ §27 + guide §18 acceptance checklist — feature coverage, a11y, gaps     | End of a plan; acceptance/QA review                             |

## Architecture summary (full: `docs/architecture.md`)

FSD under `src/`, dependencies point downward only: `app/` (routing + providers) → `views/` (page compositions) → `widgets/` (state-holding blocks) → `features/` (shared hooks/logic) → `shared/` (`components/ui`, `custom`, `hooks`, `lib`, `constants`, `types`, `styles`). Never invert.

**Naming:** files/folders **kebab-case**; components/types **PascalCase**; functions/vars **camelCase**; hooks `useX`; constants **UPPER_SNAKE_CASE**. **Tokens** come from `src/index.css` only. Routes come from `ROUTE_PATHS` in `src/shared/constants/route-paths.ts` — never hardcode paths.

> The repo predates FSD/kebab-case (`pages/`, camelCase files). `refactor-code` migrates touched files incrementally — do not mass-rename in unrelated work.

## Adding UI components

Use the shadcn CLI: `npx shadcn@latest add <component>`. **ASK the user** before installing a component that pulls a new package. Read `.claude/skills/ui-designer/SKILL.md` before any UI work. Verify visual changes at `/tools` in light + dark.

**Two hard rules (details in `ui-designer`):**

- **Reuse existing components — never hand-roll raw HTML tags.** No raw `<button>`/`<input>`/`<label>`/`<form>`/overlay `<div>` in app code; use `Button`, `Input`, `Label`, `Form`, `Dialog`/`ReusableModal`, `Card`, `NoData`, etc. Raw tags live only inside `src/**/components/ui/*`. Missing a primitive → add it via shadcn, don't hand-roll.
- **Code-split as you build.** Every route is `React.lazy` + `Suspense`; lazy-load heavy/conditional UI (modals, charts, big tables) to keep it out of the entry bundle.

## Remote workflow (`@claude` on GitHub) — one-time setup by the repo owner

`.github/workflows/claude.yml` responds to `@claude` mentions in issues/PRs/comments; `claude-code-review.yml` auto-reviews PRs. To enable (Claude cannot do these two steps):

1. Install the **Claude GitHub App** on this repository (github.com/apps/claude).
2. Add repo secret **`CLAUDE_CODE_OAUTH_TOKEN`** — generate via `claude setup-token` (uses your Claude subscription, no per-token API billing).
