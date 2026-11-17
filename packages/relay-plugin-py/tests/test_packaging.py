"""Packaging checks: the manifest digest, ``python -m silvanexum_relay init`` and
the shipped pricing catalog's shape. CI also runs NVIDIA's own validators
(``nemo-relay plugins validate`` / ``model-pricing validate``) on these files."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

from silvanexum_relay.__main__ import init

PKG = Path(__file__).resolve().parent.parent


def _manifest_value(text: str, key: str) -> str:
    m = re.search(rf'^{key}\s*=\s*"([^"]+)"', text, re.MULTILINE)
    assert m, f"{key} missing"
    return m.group(1)


def test_repo_manifest_digest_matches_worker():
    text = (PKG / "relay-plugin.toml").read_text(encoding="utf-8")
    artifact = _manifest_value(text, "artifact")
    digest = hashlib.sha256((PKG / artifact).read_bytes()).hexdigest()
    assert _manifest_value(text, "sha256") == f"sha256:{digest}"
    assert _manifest_value(text, "entrypoint") == "silvanexum_relay.worker:main"
    assert 'kind = "worker"' in text and "manifest_version = 1" in text


def test_manifest_digest_script_passes():
    out = subprocess.run(
        [sys.executable, str(PKG / "scripts" / "manifest_digest.py")], capture_output=True, text=True
    )
    assert out.returncode == 0, out.stderr


def test_init_writes_an_installable_wrapper(tmp_path):
    manifest = init(tmp_path / "plug", requirement="silvanexum-relay==9.9.9")
    text = manifest.read_text(encoding="utf-8")
    worker = tmp_path / "plug" / "silvanexum_relay_worker" / "worker.py"
    assert _manifest_value(text, "sha256") == "sha256:" + hashlib.sha256(worker.read_bytes()).hexdigest()
    assert _manifest_value(text, "entrypoint") == "silvanexum_relay_worker.worker:main"
    assert b"\r\n" not in worker.read_bytes()  # same digest on every OS
    assert '"silvanexum-relay==9.9.9"' in (tmp_path / "plug" / "pyproject.toml").read_text()
    with pytest.raises(FileExistsError):
        init(tmp_path / "plug")
    init(tmp_path / "plug", force=True)  # overwrite is explicit


def test_catalog_is_relay_shaped_with_concrete_ids():
    catalog = json.loads((PKG / "catalogs" / "silvanexum-pricing.json").read_text(encoding="utf-8"))
    assert catalog["version"] == 1 and catalog["entries"]
    ids = {e["model_id"] for e in catalog["entries"]}
    # Version-less family fallbacks and org prefixes are not published.
    assert not ids & {"claude", "claude-opus", "gemini", "gemini-flash", "gemma", "nvidia/", "meta/llama"}
    assert "nvidia/nemotron-3-super-120b-a12b" in ids and "gpt-4o-mini" in ids
    for e in catalog["entries"]:
        assert e["unit"] == "per_token" and e["currency"] == "USD" and e["pricing_source"] == "silvanexum"
        assert {"input_per_million", "output_per_million"} <= set(e["rates"])
        expected = "separate" if e["provider"] == "anthropic" else "included_in_prompt_tokens"
        assert e["prompt_cache"]["read_accounting"] == expected
