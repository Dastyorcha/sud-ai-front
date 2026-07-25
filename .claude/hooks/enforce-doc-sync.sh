#!/usr/bin/env bash
set -euo pipefail

# Stop hook: enforce mandatory doc-sync rules before push/PR.
# Runs BEFORE open-pr.sh so a stale-doc commit can't slip into the PR.
#
# Mapping (source pattern -> required doc):
#   - .claude/hooks/*.sh          -> docs/claude-hooks.md
#   - .claude/skills/*/SKILL.md   -> docs/claude-skills.md
#   - .claude/agents/*.md         -> docs/agentic-workflow.md
#   - .claude/commands/*.md       -> docs/claude-skills.md
#
# If any rule is violated, emit decision: "block" with the missing list.
# Capped at MAX_ATTEMPTS=2 per session so a stuck session can't loop forever.

INPUT=$(cat)
SID=$(echo "$INPUT" | jq -r '.session_id // "default"')

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

MARKER_DIR="$PROJECT_DIR/.claude/.session-markers"
LIST="$MARKER_DIR/files-$SID.txt"
[[ ! -f "$LIST" ]] && exit 0  # nothing tracked, nothing to enforce

TRACKED=$(sort -u "$LIST")
[[ -z "$TRACKED" ]] && exit 0

# "<source-regex>|<required-doc>" pairs
declare -a CHECKS=(
  "^\.claude/hooks/.*\.sh$|docs/claude-hooks.md"
  "^\.claude/skills/.*/SKILL\.md$|docs/claude-skills.md"
  "^\.claude/commands/.*\.md$|docs/claude-skills.md"
  "^\.claude/agents/.*\.md$|docs/agentic-workflow.md"
)

MISSING=""
for check in "${CHECKS[@]}"; do
  PATTERN="${check%%|*}"
  DOC="${check##*|}"

  if echo "$TRACKED" | grep -qE "$PATTERN"; then
    if echo "$TRACKED" | grep -qFx "$DOC"; then
      continue
    fi
    if [[ -n "$(git diff HEAD -- "$DOC" 2>/dev/null)" ]] || [[ -n "$(git diff origin/main -- "$DOC" 2>/dev/null)" ]]; then
      continue
    fi
    MATCHED=$(echo "$TRACKED" | grep -E "$PATTERN" | head -3 | sed 's/^/    /')
    MISSING+="- update **${DOC}** — you modified files matching \`${PATTERN}\`:
${MATCHED}
"
  fi
done

ATTEMPT_FILE="$MARKER_DIR/doc-sync-attempts-$SID"

if [[ -z "$MISSING" ]]; then
  rm -f "$ATTEMPT_FILE"
  exit 0
fi

ATTEMPTS=$(cat "$ATTEMPT_FILE" 2>/dev/null || echo 0)
MAX_ATTEMPTS=2

if [[ "$ATTEMPTS" -lt "$MAX_ATTEMPTS" ]]; then
  echo "$((ATTEMPTS + 1))" > "$ATTEMPT_FILE"
  REASON=$(printf 'Doc-sync rule (enforced before push/PR): you modified source files that require corresponding doc updates, but those docs are not part of this session'\''s changes.\n\nMissing:\n\n%s\nUpdate the doc(s) above in the same task. Then commit and stop again — this hook will re-check, and if clean the Stop chain proceeds to push and open the PR.' "$MISSING")
  jq -n --arg r "$REASON" '{decision: "block", reason: $r}'
  exit 0
else
  echo "[enforce-doc-sync] doc-sync gaps remain after $MAX_ATTEMPTS attempts on this session — giving up." >&2
  rm -f "$ATTEMPT_FILE"
  exit 0
fi
