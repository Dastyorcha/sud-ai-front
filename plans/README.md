# Plans

Implementation plans for medium and large tasks, moving across status folders as work progresses. Trivial/small tasks skip this folder. Full workflow: `docs/agentic-workflow.md`.

## Status folders

- **`idea/`** — drafted by the `planner` (Opus), awaiting approval.
- **`doing/`** — approved and in progress; the `implementer` (Sonnet) works against it and checks steps off.
- **`done/`** — merged/complete; kept as the historical record.

Move a plan between statuses with `git mv` (never copy):

```bash
git mv plans/idea/012-tools-data-table.md plans/doing/
git commit -m "docs: start plan 012 tools data table"
```

## Naming

`NNN-<kebab-title>.md` — zero-padded ordinal (unique across all three folders) + kebab-case title. E.g. `007-auth-guard.md`, `012-tools-data-table.md`.

## Template

Copy `_template.md` for every new plan. The plan is the single source of intent — the implementer reads it instead of re-deriving scope.
