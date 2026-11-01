#!/bin/sh
# Rebuild Caret from a local clone and pack it into vendor/, where package.json
# points. See docs/adr/0003-caret-for-math-input.md.
#   bun run caret                  # uses a caret clone beside this repo
#   CARET=~/src/caret bun run caret
set -e
CARET="${CARET:-$(dirname "$0")/../../caret}"
VENDOR="$(cd "$(dirname "$0")/../vendor" && pwd)"
cd "$CARET"
pnpm install --frozen-lockfile
pnpm build
for pkg in core math svelte; do
  (cd "packages/$pkg" && pnpm pack --pack-destination "$VENDOR" >/dev/null)
done
# Repacking keeps the version at 0.0.0, so reinstall to pick up the new tarballs.
cd "$VENDOR/.." && rm -rf node_modules/@caret-js && bun install >/dev/null
cd "$CARET"
echo "Packed Caret $(git rev-parse --short HEAD) ($(git branch --show-current)) into vendor/"
