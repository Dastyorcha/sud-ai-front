---
name: doc-writer
description: Manually triggered via `/doc-writer <topic>`. Documents a single topic completely across ALL related `docs/*.md` files. Uses the Doc map in `CLAUDE.md` to pick affected docs — never reads every doc. Creates a new doc when none fits and updates the Doc map in the same change. Admin panel — no SEO/i18n docs.
---

# Doc Writer

Manually invoked. Documents a topic completely — every related doc, no half-coverage.

## Inputs

A free-form topic (e.g. "the `use-table-query` hook", "the `data-table` widget", "the `--sidebar` token", "how the open-pr hook works"). Treat it as a small spec.

## Workflow

1. **Read the Doc map** — the `## Doc map` table in `CLAUDE.md`. This is the only discovery step; **don't** read all of `docs/`.
2. **Pick affected docs.** Examples: a new token / widget / view / naming rule → `architecture.md`; a new hook → `claude-hooks.md`; a new skill/command → `claude-skills.md`; a subagent or orchestration change → `agentic-workflow.md`; a new/renamed export or file move → `codemap.md`. Usually 1–2 docs. Stop when sure no other is affected.
3. **Need a new doc?** If nothing fits:
   - Create `docs/<kebab-name>.md` (H1, one-line summary, sections).
   - Add a row to the Doc map in `CLAUDE.md`.
   - Wire it into `enforce-doc-sync.sh` if source changes should sync into it.
   - Cross-link from any doc that mentions it in passing.
4. **Read only the docs you'll edit**, then update in place — preserve tone, heading depth, table style. New sections only when nothing fits.
5. **Update the Doc map** if you added a doc, added sync triggers, or a doc's scope shifted.
6. **Cross-references:** the owning doc holds the full version; others link. Never duplicate prose.

## Style

- Calm, factual, sentence-case headings; code blocks for shapes/tokens/commands; tables for enumerations.
- Exact paths + exported names (`src/shared/lib/utils.ts:cn`, `components/ui/button.tsx:buttonVariants`).
- **Tokens:** name, paired `*-foreground` (if any), declaration in `src/index.css` (`:root` + `.dark` + `@theme`), the utility it produces, where it appears in `/tools`.
- **Components:** FSD placement (`shared/components/ui/` vs `shared/custom/` vs `widgets/` vs `views/`), kebab-case filename, props shape.
- **Routes:** path string, `ROUTE_PATHS` constant, view file, widgets used, whether it's guarded.

## What NOT to do

- Don't read all of `docs/` to explore — the Doc map is the index.
- Don't create a doc when a section fits; don't write a multi-doc topic into one; don't duplicate prose (link instead).
- Don't invent subsystems that don't exist. **No SEO / i18n docs** — this is an English-only admin panel; if either is ever introduced it's a scope change, ask first.
- Don't `git add` / `commit` / `push` — session hooks handle staging and the Stop hook opens the PR.

## When unsure

Ambiguous topic → ask one targeted question first. A doc heading past ~400 lines → propose splitting before writing.
