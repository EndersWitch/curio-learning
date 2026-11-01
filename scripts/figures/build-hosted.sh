#!/bin/bash
# Builds the five STEM Figures diagram makers as static sites and puts them in
# public/tools/figures/<site>/, where curio serves them (behind the tools key).
#
#   bash scripts/figures/build-hosted.sh [site ...]      (default: all five)
#
# The upstream source in vendor/teacherdotdev/stem-figures is left untouched. This copies it
# to a temporary folder, applies host-patch.py (base path, static single-page build, curio
# wording and logo, links kept inside curio), builds, and copies the result over.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SITES=("$@"); [ ${#SITES[@]} -eq 0 ] && SITES=(math physics chemistry biology economics)
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
echo "Working in $WORK"
tar cf - --exclude=node_modules --exclude=.svelte-kit --exclude=build -C "$REPO/vendor/teacherdotdev/stem-figures" . | tar xf - -C "$WORK"
cd "$WORK"
npm install --no-audit --no-fund --silent
WS=(); for s in "${SITES[@]}"; do WS+=(-w "apps/$s"); done
npm i -D @sveltejs/adapter-static@3 "${WS[@]}" --no-audit --no-fund --silent
python3 "$REPO/scripts/figures/host-patch.py" "$WORK" "${SITES[@]}"
for s in "${SITES[@]}"; do
  echo "== building $s"
  (cd "apps/$s" && npx vite build > "$WORK/build-$s.log" 2>&1 || { tail -30 "$WORK/build-$s.log"; exit 1; })
  rm -rf "$REPO/public/tools/figures/$s"; mkdir -p "$REPO/public/tools/figures/$s"
  cp -r "apps/$s/build/." "$REPO/public/tools/figures/$s/"
done
echo "Done. Sites: ${SITES[*]}"
