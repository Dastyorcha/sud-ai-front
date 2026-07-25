---
name: refactor-code
description: Manually triggered via `/refactor-code`. Incrementally refactors source to match this repo's own rules (docs/architecture.md + the ui-designer skill) — FSD placement, kebab-case file/folder/component naming, color→token usage, cn()/cva, primitive reuse (raw <button>→Button), dead-code and duplication removal, structural moves — with NO behavior change. Scopes to only what changed since the last run via a commit watermark in `.claude/refactor-history.md`. Also triggers on "refactor" / "clean up the code". Never commits.
---

# Refactor Code

Behavior-preserving, **incremental** refactor. Aligns only the code that changed since the last run to the repo's documented conventions, then logs the run. Don't rewrite behavior; don't touch what didn't change (except import sites a rename forces).

## Conventions = the docs (read them, don't restate)

- `docs/architecture.md` — FSD layering (`app/views/widgets/features/shared`), the naming table (kebab-case files/folders, PascalCase components, `useX` hooks, UPPER_SNAKE_CASE constants), tokens/theming.
- `.claude/skills/ui-designer/SKILL.md` — semantic tokens only (no hex/`rgb`/`oklch`, no `dark:` literals in app code), `cn()`, `cva`, primitive reuse, responsive + light/dark, a11y.

## 1. Scope — incremental via the watermark

1. Read the **last line that starts with a date** (`DD.MM.YYYY …`) in `.claude/refactor-history.md`; its commit id is the token between the two `==>` markers.
2. **No such line (first run):** full one-time sweep of `src/**`.
3. **Has an id:** `git diff --name-only <id> -- src` → the in-scope source files (commits since `<id>` + uncommitted edits). Edit only these — but **never `src/**/components/ui/**`** (vendored shadcn primitives; see Guardrails), even when they show up in the diff.
4. Empty scope → report "nothing new since `<id>`" and stop.

## 2. Refactor (in-scope files)

- **FSD placement:** move files into the correct layer — page composition → `views/`; state-holding block → `widgets/`; hook/logic shared by 2+ widgets → `features/`; reusable/domain-agnostic → `shared/` (`components/ui`, `custom`, `hooks`, `lib`, `constants`, `types`). Never invert dependencies.
- **Names:** files/folders/components/vars → the architecture naming table. Rename/move with `git mv`; update every `@/…` import repo-wide (import sites may be out of scope — correctness wins).
- **Color:** hardcoded colors / `dark:` literals → semantic tokens from `src/index.css`.
- **Classes / variants:** conditional classes → `cn()`; variant sets → `cva` (match `components/ui/button.tsx`).
- **Primitive & component reuse (strict):** replace every hand-rolled HTML tag that has a primitive with that component, preserving look via `className`/variant. **Grep `<button`, `<input`, `<label`, `<form` across `src` excluding the ui primitives** — raw `<button>` → `Button` (`<Button asChild>` for links); bare `<input>`/`<label>`/`<form>` → `Input`/`Label`/`Form`; a bordered/padded block → `Card`; an empty state → `NoData`; an overlay/dialog `<div>` → `ReusableModal`/`Dialog`. Raw tags stay only inside `shared/components/ui/*`.
- **Structure:** extract repeated data/config arrays (nav links, option lists) → `src/shared/constants` as `UPPER_SNAKE_CASE`; split oversized files.
- **One component per file:** a secondary component sharing a file moves to its own kebab-case file — co-located in the widget folder if only that widget uses it, else `shared/custom/`.
- **Hygiene:** drop dead code, unused imports, duplication, redundant/obvious comments (keep comments explaining complex logic); simplify.

## 3. Verify (must pass before logging)

```bash
npx tsc -b
npm run lint
```

Add `npm run build` when you moved/renamed files. Fix anything you broke — output must be behavior-identical.

## 4. Log — never commit

Append ONE line to `.claude/refactor-history.md` (newest last):

```
DD.MM.YYYY HH:MM ==> <shortHeadId> ==> refactored <short description>
```

`<shortHeadId>` = `git rev-parse --short HEAD` (HEAD _before_ your edits — the next run's watermark). Timestamp: `date "+%d.%m.%Y %H:%M"`.

Then **stop — no `git add` / `commit` / `push`.** The session hooks stage and the Stop hook opens the PR; the user's commit advances the watermark.

## Guardrails

- Behavior-preserving only. A change that alters behavior or a public API → stop and flag.
- **Never refactor `src/**/components/ui/**`** — vendored shadcn primitives stay as generated, even if they land in scope or fail `tsc`/`lint`. Flag issues there; don't fix them in a refactor pass.
- A rename/move that changes a documented surface → update the doc + `docs/codemap.md` the same run.
- ASK before installing a dependency or deleting a public API.
- Prefer many small, well-named modules over one large file.
