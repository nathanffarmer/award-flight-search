#!/usr/bin/env bash
# Block `git commit` unless /simplify has been run on the current diff.
#
# Workflow:
#   1. Run /simplify (or invoke the simplify skill)
#   2. Address any findings
#   3. touch .claude/.simplify-ok
#   4. git commit ...
#
# The marker is consumed on every commit attempt that passes, so the next
# commit re-requires /simplify. If any tracked-or-new file is modified after
# the marker is touched, the hook blocks — the diff has moved on.

MARKER=".claude/.simplify-ok"

deny() {
	jq -nc --arg reason "$1" \
		'{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
	exit 0
}

if [ ! -f "$MARKER" ]; then
	deny "Run /simplify on the current diff before committing, address any findings, then 'touch $MARKER' and retry the commit."
fi

marker_ts=$(stat -c %Y "$MARKER" 2>/dev/null || stat -f %m "$MARKER" 2>/dev/null || echo 0)

newer_ts=$(git ls-files --modified --others --exclude-standard 2>/dev/null | while IFS= read -r f; do
	[ -f "$f" ] && (stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null)
done | sort -nr | head -1)

if [ -n "$newer_ts" ] && [ "$newer_ts" -gt "$marker_ts" ]; then
	deny "Files have changed since /simplify last ran. Re-run /simplify, refresh $MARKER, then retry the commit."
fi

rm -f "$MARKER"
exit 0
