#!/usr/bin/env bash
# Clean-install + import smoke test for `silvanexum` across Python package
# managers. Installs the locally-built wheel (no index needed) into an isolated
# environment and verifies `import silvanexum` succeeds — this is the regression
# guard for the reserved-word alias fix (a `from` field would SyntaxError here).
#
# Usage: scripts/test-install-py.sh <pip|uv|poetry> <dist-dir>
set -euo pipefail

PM="${1:?usage: test-install-py.sh <pip|uv|poetry> <dist-dir>}"
DIST_DIR="${2:?missing dist dir}"

PY="$(command -v python || command -v python3)"

WHEEL="$(ls "$DIST_DIR"/silvanexum-*.whl | head -n1)"
if [[ -z "${WHEEL:-}" ]]; then
  echo "No silvanexum wheel found in $DIST_DIR" >&2
  exit 1
fi
echo "Testing $PM against $WHEEL"

SMOKE='import silvanexum; from silvanexum._generated.models import AuditLogQuery; q = AuditLogQuery(**{"from": "2026-01-01"}); assert q.model_dump(by_alias=True, exclude_none=True) == {"from": "2026-01-01"}; print("import + from-alias OK")'

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

case "$PM" in
  pip)
    "$PY" -m venv "$WORK/venv"
    "$WORK/venv/bin/python" -m pip install --quiet --upgrade pip
    "$WORK/venv/bin/python" -m pip install --quiet "$WHEEL"
    "$WORK/venv/bin/python" -c "$SMOKE"
    ;;
  uv)
    "$PY" -m pip install --quiet uv
    cd "$WORK"
    uv venv >/dev/null
    uv pip install "$WHEEL" >/dev/null
    uv run python -c "$SMOKE"
    ;;
  poetry)
    "$PY" -m pip install --quiet poetry
    cd "$WORK"
    poetry init -n --name smoke --python ">=3.9" >/dev/null
    poetry run pip install "$WHEEL" >/dev/null
    poetry run python -c "$SMOKE"
    ;;
  *)
    echo "Unknown package manager: $PM" >&2
    exit 2
    ;;
esac

echo "✓ $PM clean-install + import OK"
