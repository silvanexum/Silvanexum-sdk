#!/usr/bin/env bash
# Clean-install + import smoke test for @silvanexum/sdk across JS package
# managers. Installs the locally-built tarball (no registry needed) and verifies
# the package resolves and imports under both ESM and CJS.
#
# Usage: scripts/test-install-js.sh <npm|pnpm|yarn|bun> <tarball-dir>
set -euo pipefail

PM="${1:?usage: test-install-js.sh <npm|pnpm|yarn|bun> <tarball-dir>}"
TARBALL_DIR="${2:?missing tarball dir}"

TARBALL="$(ls "$TARBALL_DIR"/silvanexum-sdk-*.tgz | head -n1)"
if [[ -z "${TARBALL:-}" ]]; then
  echo "No @silvanexum/sdk tarball found in $TARBALL_DIR" >&2
  exit 1
fi
echo "Testing $PM against $TARBALL"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

cat > esm.mjs <<'EOF'
import { Silvanexum } from "@silvanexum/sdk";
if (typeof Silvanexum !== "function") throw new Error("ESM import failed");
console.log("ESM import OK");
EOF

cat > cjs.cjs <<'EOF'
const { Silvanexum } = require("@silvanexum/sdk");
if (typeof Silvanexum !== "function") throw new Error("CJS require failed");
console.log("CJS require OK");
EOF

case "$PM" in
  npm)
    npm init -y >/dev/null
    npm install "$TARBALL"
    ;;
  pnpm)
    pnpm init >/dev/null 2>&1 || true
    pnpm add "$TARBALL"
    ;;
  yarn)
    npm init -y >/dev/null
    corepack enable >/dev/null 2>&1 || true
    yarn add "$TARBALL"
    ;;
  bun)
    bun init -y >/dev/null 2>&1 || npm init -y >/dev/null
    bun add "$TARBALL"
    ;;
  *)
    echo "Unknown package manager: $PM" >&2
    exit 2
    ;;
esac

node esm.mjs
node cjs.cjs
echo "✓ $PM clean-install + ESM/CJS import OK"
