#!/usr/bin/env python3
"""Check (default) or rewrite (--write) the integrity digest in relay-plugin.toml.

Relay refuses a worker whose ``source.artifact`` doesn't hash to the manifest's
``integrity.sha256``, so CI runs this in check mode after any worker.py change.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "relay-plugin.toml"
_ARTIFACT_RE = re.compile(r'^artifact\s*=\s*"([^"]+)"', re.MULTILINE)
_SHA_RE = re.compile(r'^sha256\s*=\s*"sha256:([0-9a-f]*)"', re.MULTILINE)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Rewrite the digest in place.")
    args = parser.parse_args()

    text = MANIFEST.read_text(encoding="utf-8")
    artifact = _ARTIFACT_RE.search(text)
    current = _SHA_RE.search(text)
    if artifact is None or current is None:
        print("relay-plugin.toml is missing source.artifact or integrity.sha256", file=sys.stderr)
        return 1
    digest = hashlib.sha256((ROOT / artifact.group(1)).read_bytes()).hexdigest()
    if current.group(1) == digest:
        print(f"ok: {artifact.group(1)} sha256:{digest}")
        return 0
    if args.write:
        MANIFEST.write_text(_SHA_RE.sub(f'sha256 = "sha256:{digest}"', text, count=1), encoding="utf-8")
        print(f"updated: {artifact.group(1)} sha256:{digest}")
        return 0
    print(
        f"digest mismatch for {artifact.group(1)}: manifest has {current.group(1) or '<empty>'}, "
        f"file is {digest}. Run: python scripts/manifest_digest.py --write",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
