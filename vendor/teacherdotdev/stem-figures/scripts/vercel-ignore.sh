#!/usr/bin/env bash
# Vercel's Ignored Build Step for every app: exit 0 skips the build, exit 1
# builds. Vercel runs it from the app's Root Directory (e.g. apps/math).
#
# It compares against the last commit this project deployed on this branch,
# not just HEAD^, so a push of several commits still builds if any of them
# touched the app, packages/, or the root package files.

base="$VERCEL_GIT_PREVIOUS_SHA"

if [ -z "$base" ]; then
  echo "No earlier deployment on this branch; building."
  exit 1
fi

# Vercel clones shallowly, so the last deployed commit may not be here yet.
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=1 origin "$base" 2>/dev/null
fi
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "Can't find last deployed commit $base; building."
  exit 1
fi

if git diff --quiet "$base" HEAD -- . ../../packages ../../package.json ../../package-lock.json; then
  echo "Nothing this app uses changed since $base; skipping."
  exit 0
fi
echo "Changes since $base; building."
exit 1
