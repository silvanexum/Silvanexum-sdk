#!/usr/bin/env bash
# Publish every public npm package whose current version isn't on the registry yet.
# Used by .github/workflows/release.yml (npm Trusted Publishing over OIDC).
#
# Why not `changeset publish`: it goes through `pnpm publish`, and pnpm 9 forwards
# `--git-checks` to the npm CLI, which current npm rejects (EUNKNOWNCONFIG). So:
# `pnpm pack` (resolves workspace:^ ranges) → `npm publish <tarball>` (OIDC auth).
#
# Prints "New tag: <name>@<version>" per publish, and tags the commit with it.
set -euo pipefail

PACKAGES=(packages/sdk-ts packages/mcp)   # @silvanexum/sdk first: mcp depends on it
OUT=$(mktemp -d)

for dir in "${PACKAGES[@]}"; do
  name=$(node -p "require('./$dir/package.json').name")
  version=$(node -p "require('./$dir/package.json').version")
  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "skip $name@$version (already on npm)"
    continue
  fi
  echo "publishing $name@$version"
  rm -f "$OUT"/*.tgz
  (cd "$dir" && pnpm pack --pack-destination "$OUT" >/dev/null)
  if ! npm publish "$OUT"/*.tgz --access public; then
    # npm keeps processing an upload for a few minutes after accepting it, so a
    # follow-up run can collide with it (E409). If the version landed, that's fine.
    sleep 30
    if npm view "$name@$version" version >/dev/null 2>&1; then
      echo "skip $name@$version (published by an earlier run)"
      continue
    fi
    exit 1
  fi
  git tag "$name@$version"
  echo "New tag: $name@$version"
done
