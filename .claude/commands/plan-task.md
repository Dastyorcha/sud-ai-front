Plan and orchestrate the task described in `$ARGUMENTS` using the agentic workflow.

Invoke the `plan-task` skill at `.claude/skills/plan-task/SKILL.md` and follow it exactly:

1. **Size** the task (trivial / small / medium / large) — see `docs/agentic-workflow.md`.
2. **Trivial** → delegate to the `quick-fixer` subagent (Haiku), no plan. **Small** → implement directly (Sonnet), unless it touches shared logic (escalate).
3. **Medium/large** → delegate to the `planner` subagent (Opus) to write `plans/idea/NNN-<kebab-title>.md` from `plans/_template.md`. For **large**, present the plan and ASK the user before executing.
4. On approval, `git mv` the plan to `plans/doing/`, then delegate to the `implementer` subagent (Sonnet) to execute it — committing + pushing each step as a logical sub-task.
5. When complete, `git mv` the plan to `plans/done/`.

Escalate to the user when a small-looking change would alter shared logic, change a route/API/data contract, ripple beyond scope, or add a dependency.

If `$ARGUMENTS` is empty, ask what the task is before sizing.
