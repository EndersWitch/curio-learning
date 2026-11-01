#!/bin/sh
# Rebuild Caret from a local clone and pack it into vendor/, where package.json
# points. See docs/adr/0002-caret-for-math-input.md.
#   npm run caret                  # uses a caret clone beside the stemfigures repo
#   CARET=~/src/caret npm run caret
set -e
CARET="${CARET:-$(dirname "$0")/../../../../caret}"
VENDOR="$(cd "$(dirname "$0")/../vendor" && pwd)"
cd "$CARET"
pnpm install --frozen-lockfile
pnpm build
for pkg in core math svelte; do
  (cd "packages/$pkg" && pnpm pack --pack-destination "$VENDOR" >/dev/null)
done
# Repacking keeps the version at 0.0.0, so reinstall to update package-lock's hashes.
cd "$VENDOR/.." && npm install ./vendor/caret-js-core-0.0.0.tgz ./vendor/caret-js-math-0.0.0.tgz ./vendor/caret-js-svelte-0.0.0.tgz >/dev/null
cd "$CARET"
echo "Packed Caret $(git rev-parse --short HEAD) ($(git branch --show-current)) into vendor/"
