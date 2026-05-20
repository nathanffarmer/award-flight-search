#!/usr/bin/env bash
# PostToolUse companion to require-simplify-before-commit.sh.
#
# Consumes the /simplify marker only when the commit actually landed (HEAD
# moved). A commit that failed — nothing staged, rejected by a git hook,
# bad message — leaves HEAD unchanged, so the marker survives and the retry
# isn't blocked.

MARKER=".claude/.simplify-ok"
HEAD_FILE=".claude/.pre-commit-head"

[ -f "$HEAD_FILE" ] || exit 0

before=$(cat "$HEAD_FILE")
after=$(git rev-parse HEAD 2>/dev/null || echo "none")
rm -f "$HEAD_FILE"

if [ "$before" != "$after" ]; then
	rm -f "$MARKER"
fi
exit 0
