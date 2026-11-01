#!/bin/sh
# Rebuild Caret from a local clone and pack it into vendor/, where package.json
# points. See docs/adr/0003-caret-for-labels.md.
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
# apps/math vendors its own Caret build at 0.0.0. npm installs one copy per
# name and version across the monorepo, so this build is restamped
# 0.0.0-physics to keep the two apart.
for pkg in core math svelte; do
  tmp="$(mktemp -d)"
  tar xzf "$VENDOR/caret-js-$pkg-0.0.0.tgz" -C "$tmp"
  node -e '
    const fs = require("fs"), f = process.argv[1], j = JSON.parse(fs.readFileSync(f, "utf8"))
    j.version = "0.0.0-physics"
    for (const deps of [j.dependencies, j.peerDependencies, j.devDependencies])
      for (const name of ["@caret-js/core", "@caret-js/math"])
        if (deps?.[name]) deps[name] = "0.0.0-physics"
    fs.writeFileSync(f, JSON.stringify(j, null, 2))
  ' "$tmp/package/package.json"
  tar czf "$VENDOR/caret-js-$pkg-0.0.0-physics.tgz" -C "$tmp" package
  rm -rf "$tmp" "$VENDOR/caret-js-$pkg-0.0.0.tgz"
done
# Repacking keeps the versions, so reinstall to update package-lock's hashes.
cd "$VENDOR/.." && npm install ./vendor/caret-js-core-0.0.0-physics.tgz ./vendor/caret-js-math-0.0.0-physics.tgz ./vendor/caret-js-svelte-0.0.0-physics.tgz >/dev/null
cd "$CARET"
echo "Packed Caret $(git rev-parse --short HEAD) ($(git branch --show-current)) into vendor/"
