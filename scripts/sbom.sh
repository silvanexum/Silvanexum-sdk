#!/usr/bin/env bash
# Generate CycloneDX SBOMs for the distributable surface:
#   sbom/sbom-js.cdx.json    -> the pnpm/JS workspace (SDK + MCP + trace-view)
#   sbom/sbom-python.cdx.json -> the silvanexum Python package
#
# Uses npx/pipx-style one-shot invocations so no SBOM tooling is a committed
# dependency. Runs from the repo root. Tools are pinned by major version.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/sbom"
mkdir -p "$OUT"

echo "→ JS SBOM (CycloneDX)"
# @cyclonedx/cyclonedx-npm walks the installed node_modules graph.
# NOTE: --omit is variadic, so `--omit dev <path>` swallows the package.json path
# as an omit type. The `=` form takes exactly one value and frees the positional.
npx --yes @cyclonedx/cyclonedx-npm@^1 \
  --omit=dev \
  --output-format JSON \
  --output-file "$OUT/sbom-js.cdx.json" \
  "$ROOT/package.json"

echo "→ Python SBOM (CycloneDX)"
# Install the package + its declared deps into an isolated venv, then snapshot
# that environment as a CycloneDX SBOM (the standard, reproducible approach).
PYVENV="$(mktemp -d)/sbomvenv"
python -m venv "$PYVENV"
"$PYVENV/bin/python" -m pip install --quiet --upgrade pip
"$PYVENV/bin/python" -m pip install --quiet "cyclonedx-bom>=4,<5" "$ROOT/packages/sdk-py"
"$PYVENV/bin/python" -m cyclonedx_py environment "$PYVENV" \
  --output-format JSON \
  --outfile "$OUT/sbom-python.cdx.json" \
  || echo "::warning::Python SBOM generation skipped (cyclonedx-bom unavailable)."

echo "✓ SBOMs written to $OUT"
ls -la "$OUT"
