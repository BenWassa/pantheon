#!/bin/bash
set -euo pipefail

# SessionStart hook for Pantheon.
# Installs npm dependencies so linters, tests, the content validator, and the build
# all work out of the box in Claude Code on the web. Idempotent and non-interactive.

# Only run in the remote (web) environment; local setups manage their own installs.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install only when dependencies are missing, so cached containers start fast.
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install --no-audit --no-fund
else
  echo "node_modules present; skipping install."
fi
