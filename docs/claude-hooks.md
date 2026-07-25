# Claude Hooks

Every shell hook under `.claude/hooks/`, wired in `.claude/settings.json`. Hooks enforce the git workflow, protect the tree, and automate PRs. **No hook ever runs `git commit` for you except where noted; none use `--amend`.**

When you add, remove, or change a hook script, update this doc in the same change — `enforce-doc-sync.sh` blocks Stop otherwise.

## Event wiring (`.claude/settings.json`)

| Event         | Matcher                  | Hooks (in order)                                                                       |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `PreToolUse`  | `Write\|Edit\|MultiEdit` | `prepare-branch` → `block-protected-branch` → `block-protected-paths` → `scan-secrets` |
| `PreToolUse`  | `Bash`                   | `prepare-branch`                                                                       |
| `PostToolUse` | `Write\|Edit\|MultiEdit` | `track-session-files` → `format-prettier` → `update-docs`                              |
| `Stop`        | —                        | `enforce-doc-sync` → `open-pr`                                                         |

## Hooks

### `prepare-branch.sh` (PreToolUse)

Enforces the **start-from-latest-main-on-a-new-branch** rule (see `CLAUDE.md` → Workflow & Git). Once per session, before the first commitable change: fetches origin, **denies** edits on `main`/`master`/`develop` (prints a branch-picker workflow that tells you to sync main and create a fresh branch), or pulls `origin/main` into the current feature branch. Merge conflicts → deny asking the user to resolve. Injects the **incremental-commit reminder**: split work into logical sub-tasks and commit + push each as you finish. For `Bash`, only fires on file-mutating commands (`mv`, `rm`, redirects, `sed -i`, …), not on `git`/`npm`.

### `block-protected-branch.sh` (PreToolUse)

Hard stop: denies any `Write`/`Edit`/`MultiEdit` while on `main`/`master`/`develop`. Backstop to `prepare-branch`.

### `block-protected-paths.sh` (PreToolUse)

Denies writes to protected paths: `.env*`, `secrets/`, `dist/`, `node_modules/`, `.git/`, `build/`, `coverage/`.

### `scan-secrets.sh` (PreToolUse)

If `gitleaks` is installed, scans the proposed file content and denies the write when a secret is detected. No-op if `gitleaks` is absent.

### `track-session-files.sh` (PostToolUse)

Appends every file written this session to `.claude/.session-markers/files-$SID.txt`. Feeds `session-add.sh` so commits stage only this session's files.

### `format-prettier.sh` (PostToolUse)

Runs `prettier --write` on the just-written file (js/ts/tsx/json/md/yaml/css/html). No-op if prettier/npx unavailable.

### `update-docs.sh` (PostToolUse)

Non-blocking. If the edited file's name/stem is referenced by any `docs/*.md`, injects a reminder listing those docs so you keep them in sync.

### `enforce-doc-sync.sh` (Stop)

Blocks Stop (max 2 attempts/session) if source files changed without their required doc:

- `.claude/hooks/*.sh` → `docs/claude-hooks.md`
- `.claude/skills/*/SKILL.md` → `docs/claude-skills.md`
- `.claude/commands/*.md` → `docs/claude-skills.md`
- `.claude/agents/*.md` → `docs/agentic-workflow.md`

### `open-pr.sh` (Stop)

Safety net for the incremental workflow. On protected branches: skips. Dirty tree: **blocks** Stop (max 2×) asking you to commit. Clean tree with commits ahead of `origin/main`: pushes the branch and opens a PR (or updates the existing one). You are expected to commit + push incrementally yourself; this hook only catches what you missed.

### `session-add.sh` (helper, not wired)

`bash .claude/hooks/session-add.sh` stages only this session's tracked files, then you `git commit -m "type: message"`. Use instead of `git add -A`.

## Git workflow summary

1. Never edit on `main` — branch first (`feat/`, `fix/`, `chore/`).
2. Work in **small increments**: commit + push one logical sub-task at a time.
3. Commit messages: `type: message` (`feat|fix|docs|refactor|test|style|chore|task`) — enforced by husky `commit-msg`.
4. `tsc -b` + `eslint` run in husky `pre-commit`; keep them green.
5. Keep docs in sync in the same commit as the source change.
6. Never `--amend`, never `--no-verify` (unless the user asks).
