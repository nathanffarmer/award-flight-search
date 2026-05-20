#!/usr/bin/env bash
# PreToolUse gate: block `git commit` unless /simplify has reviewed the diff.
#
# Workflow:
#   1. Run /simplify (or invoke the simplify skill)
#   2. Address any findings
#   3. touch .claude/.simplify-ok
#   4. git commit ...
#
# This hook only validates. The marker is consumed by the companion
# PostToolUse hook (consume-simplify-marker.sh) and only when the commit
# actually lands — a failed commit leaves the marker so the retry isn't
# blocked. HEAD is recorded here so the PostToolUse hook can detect that.

MARKER=".claude/.simplify-ok"
HEAD_FILE=".claude/.pre-commit-head"

deny() {
	jq -nc --arg reason "$1" \
		'{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
	exit 0
}

# Epoch mtime of a file — Linux (stat -c) with a BSD/macOS (stat -f) fallback.
mtime() {
	stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null
}

if [ ! -f "$MARKER" ]; then
	deny "Run /simplify on the current diff before committing, address any findings, then 'touch $MARKER' and retry the commit."
fi

marker_ts=$(mtime "$MARKER" || echo 0)

newer_ts=$(git ls-files --modified --others --exclude-standard 2>/dev/null | while IFS= read -r f; do
	[ -f "$f" ] && mtime "$f"
done | sort -nr | head -1)

if [ -n "$newer_ts" ] && [ "$newer_ts" -gt "$marker_ts" ]; then
	deny "Files have changed since /simplify last ran. Re-run /simplify, refresh $MARKER, then retry the commit."
fi

git rev-parse HEAD > "$HEAD_FILE" 2>/dev/null || echo "none" > "$HEAD_FILE"
exit 0
