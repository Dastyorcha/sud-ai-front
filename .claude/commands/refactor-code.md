Incrementally refactor the code changed since the last run to this repo's conventions.

Invoke the `refactor-code` skill at `.claude/skills/refactor-code/SKILL.md` and follow it exactly:

1. Read the watermark in `.claude/refactor-history.md`; scope to `git diff --name-only <id> -- src` (or a full `src/**` sweep on first run).
2. Apply behavior-preserving changes only: FSD placement, kebab-case naming, color→token, `cn()`/`cva`, primitive reuse, dead-code removal. Never touch `src/**/components/ui/**`.
3. Verify with `npx tsc -b` and `npm run lint` (add `npm run build` if files moved).
4. Append one watermark line to `.claude/refactor-history.md`.

Do not commit — leave changes staged for the user. If `$ARGUMENTS` narrows the scope (a path or area), respect it.
