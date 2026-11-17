#!/usr/bin/env python3
"""Generate a NeMo Relay pricing catalog from Silvanexum's model price table.

Silvanexum prices every call server-side from one authoritative table (the
backend's ``src/modules/fleet/service.ts`` ``USD_RATES_PER_1K`` map, USD per 1k
tokens). Relay's built-in ``pricing`` component instead wants a catalog JSON of
**per-million** rates. This script turns the former into the latter, so any
Relay user — even without a Silvanexum account — can point the ``pricing``
component at ``catalogs/silvanexum-pricing.json`` and get Nemotron / NIM /
OpenAI / Anthropic / Gemini cost estimates locally.

Usage:
    python scripts/export_relay_pricing.py \
        --backend ../../..//Silvanexum-backend/src/modules/fleet/service.ts \
        --out catalogs/silvanexum-pricing.json

If ``--backend`` is omitted the script looks for the backend checkout next to
the SDK repo. It never imports the backend (TypeScript); it parses the rate
table out of the source text, so it has no runtime dependency on it.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
from pathlib import Path
from typing import Dict, Optional

# USD per 1k -> USD per 1,000,000 tokens.
PER_1K_TO_PER_M = 1000.0

# Map a Silvanexum model-id prefix to the Relay provider id. Longest-prefix
# logic mirrors the backend's lookup; here we only need the provider bucket for
# the catalog's `provider` field. Order: most specific first.
_PROVIDER_BY_PREFIX: tuple[tuple[str, str], ...] = (
    ("nvidia/", "nvidia"),
    ("meta/", "nvidia"),
    ("mistralai/", "nvidia"),
    ("deepseek-ai/", "nvidia"),
    ("qwen/", "nvidia"),
    ("claude", "anthropic"),
    ("gpt-", "openai"),
    ("gpt4", "openai"),
    ("o1", "openai"),
    ("o3", "openai"),
    ("o4", "openai"),
    ("gemini", "google"),
    ("gemma", "google"),
    ("palm", "google"),
    ("bison", "google"),
)

# Matches one entry of the USD_RATES_PER_1K object literal, e.g.
#   "claude-opus-5-5": { input: 0.004, output: 0.02, cached: 0.0002 },
_ENTRY_RE = re.compile(
    r'"(?P<model>[^"]+)"\s*:\s*\{\s*'
    r"input:\s*(?P<input>[0-9.]+)\s*,\s*"
    r"output:\s*(?P<output>[0-9.]+)\s*"
    r"(?:,\s*cached:\s*(?P<cached>[0-9.]+)\s*)?"
    r"\}"
)


def provider_for(model: str) -> str:
    low = model.lower()
    for prefix, provider in _PROVIDER_BY_PREFIX:
        if low.startswith(prefix):
            return provider
    return "other"


def parse_backend_rates(source_text: str) -> Dict[str, Dict[str, float]]:
    """Extract the USD-per-1k rate table from the backend source text."""
    block = _isolate_table(source_text)
    rates: Dict[str, Dict[str, float]] = {}
    for m in _ENTRY_RE.finditer(block):
        entry: Dict[str, float] = {
            "input": float(m.group("input")),
            "output": float(m.group("output")),
        }
        if m.group("cached") is not None:
            entry["cached"] = float(m.group("cached"))
        rates[m.group("model")] = entry
    return rates


def _isolate_table(source_text: str) -> str:
    """Return just the USD_RATES_PER_1K object body (so we don't match other
    numeric object literals elsewhere in the file)."""
    start = source_text.find("USD_RATES_PER_1K")
    if start == -1:
        return source_text
    # Use the ASSIGNMENT brace (`= {`), not the first `{`, which belongs to the
    # `Record<string, { ... }>` type annotation rather than the object literal.
    eq = source_text.find("=", start)
    brace = source_text.find("{", eq) if eq != -1 else source_text.find("{", start)
    if brace == -1:
        return source_text
    depth = 0
    for i in range(brace, len(source_text)):
        ch = source_text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return source_text[brace : i + 1]
    return source_text[brace:]


# Org-level fallbacks in the backend table: fine for server-side prefix
# matching, but too coarse to publish as an exact price for a specific model.
_ORG_FALLBACKS = {"nvidia/", "meta/llama", "mistralai/", "qwen/"}
# How each provider counts prompt-cache reads in its usage block.
_CACHE_ACCOUNTING = {"anthropic": "separate"}
_NVIDIA_ORGS = ("nvidia/", "meta/", "mistralai/", "deepseek-ai/", "qwen/")
_NVIDIA_SNAPSHOT = Path(__file__).resolve().parent.parent / "catalogs" / "nvidia-hosted-models.txt"
_NVIDIA_MODELS_URL = "https://integrate.api.nvidia.com/v1/models"


def _is_concrete(model: str) -> bool:
    """A real model id rather than a version-less family fallback."""
    return any(ch.isdigit() for ch in model)


def _longest_prefix(model_id: str, rates: Dict[str, Dict[str, float]]) -> Optional[str]:
    best = None
    for prefix in rates:
        if model_id.startswith(prefix) and (best is None or len(prefix) > len(best)):
            best = prefix
    return best


def read_nvidia_snapshot(path: Path = _NVIDIA_SNAPSHOT) -> list:
    lines = path.read_text(encoding="utf-8").splitlines()
    return [ln.strip() for ln in lines if ln.strip() and not ln.startswith("#")]


def refresh_nvidia_snapshot(path: Path = _NVIDIA_SNAPSHOT) -> int:
    import urllib.request

    with urllib.request.urlopen(_NVIDIA_MODELS_URL, timeout=30) as resp:  # noqa: S310 - fixed https URL
        ids = sorted(m["id"] for m in json.load(resp)["data"])
    header = (
        "# NVIDIA hosted API model ids (integrate.api.nvidia.com/v1/models).\n"
        "# Snapshot used by scripts/export_relay_pricing.py; refresh with --refresh-nvidia.\n"
    )
    path.write_text(header + "\n".join(ids) + "\n", encoding="utf-8", newline="\n")
    return len(ids)


def _entry(provider: str, model_id: str, r: Dict[str, float], *, pricing_as_of: str) -> dict:
    rates = {
        "input_per_million": round(r["input"] * PER_1K_TO_PER_M, 6),
        "output_per_million": round(r["output"] * PER_1K_TO_PER_M, 6),
    }
    if "cached" in r:
        rates["cache_read_per_million"] = round(r["cached"] * PER_1K_TO_PER_M, 6)
    return {
        "provider": provider,
        "model_id": model_id,
        "aliases": [],
        "currency": "USD",
        "unit": "per_token",
        "pricing_as_of": pricing_as_of,
        "pricing_source": "silvanexum",
        "rates": rates,
        "prompt_cache": {"read_accounting": _CACHE_ACCOUNTING.get(provider, "included_in_prompt_tokens")},
    }


def build_catalog(
    rates: Dict[str, Dict[str, float]], *, pricing_as_of: str, nvidia_ids: Optional[list] = None
) -> dict:
    entries = []
    seen = set()
    # NVIDIA-hosted: expand the snapshot of real ids through the prefix table.
    for model_id in nvidia_ids or []:
        if not model_id.startswith(_NVIDIA_ORGS):
            continue
        prefix = _longest_prefix(model_id, rates)
        if prefix is None or prefix in _ORG_FALLBACKS:
            continue
        entries.append(_entry("nvidia", model_id, rates[prefix], pricing_as_of=pricing_as_of))
        seen.add(model_id)
    # First-party providers: concrete keys only.
    for model, r in rates.items():
        provider = provider_for(model)
        if provider in ("nvidia", "other") or not _is_concrete(model) or model in seen:
            continue
        entries.append(_entry(provider, model, r, pricing_as_of=pricing_as_of))
    entries.sort(key=lambda e: (e["provider"], e["model_id"]))
    return {"version": 1, "entries": entries}


def _default_backend_path() -> Optional[Path]:
    # scripts/ -> relay-plugin-py -> packages -> Silvanexum-sdk -> Workspaces
    here = Path(__file__).resolve()
    workspaces = here.parents[4] if len(here.parents) >= 5 else None
    if workspaces is None:
        return None
    candidate = workspaces / "Silvanexum-backend" / "src" / "modules" / "fleet" / "service.ts"
    return candidate if candidate.exists() else None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", type=Path, default=None, help="Path to the backend fleet/service.ts")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "catalogs" / "silvanexum-pricing.json",
    )
    parser.add_argument(
        "--refresh-nvidia",
        action="store_true",
        help="Re-fetch NVIDIA's public model list into catalogs/nvidia-hosted-models.txt first.",
    )
    parser.add_argument(
        "--pricing-as-of",
        default=_dt.date.today().isoformat(),
        help="Override the pricing_as_of date (default: today).",
    )
    args = parser.parse_args()

    backend = args.backend or _default_backend_path()
    if backend is None or not Path(backend).exists():
        parser.error(
            "Could not find the backend price table. Pass --backend "
            "<path to Silvanexum-backend/src/modules/fleet/service.ts>."
        )
    source_text = Path(backend).read_text(encoding="utf-8")
    rates = parse_backend_rates(source_text)
    if not rates:
        parser.error("No rate entries parsed from the backend table — did the file format change?")

    if args.refresh_nvidia:
        print(f"Refreshed NVIDIA snapshot: {refresh_nvidia_snapshot()} ids")
    catalog = build_catalog(rates, pricing_as_of=args.pricing_as_of, nvidia_ids=read_nvidia_snapshot())
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Wrote {len(catalog['entries'])} entries to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
