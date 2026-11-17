"""Pure mapping helpers: NAT usage/model -> Silvanexum meter events.

Kept free of any ``nat`` import so the mapping and provider-inference logic can
be unit-tested without the toolkit installed. The exporter in
:mod:`silvanexum_nat.exporter` feeds plain values pulled off NAT's
``IntermediateStep`` into these functions.
"""
from __future__ import annotations

from typing import Any, Dict, Mapping, Optional

#: Silvanexum ``/meter/events`` provider values (see the SDK ``_meter`` docs).
#: NAT has no Gemini-native provider today, but a workflow can reach one through
#: ``litellm``; we still map to a valid Silvanexum provider where we can.
SILVANEXUM_PROVIDERS = ("openai", "anthropic", "google", "nvidia", "nim", "other")


def _n(v: Any) -> int:
    """Coerce to a non-negative int; ``None``/garbage -> 0 (never raise)."""
    try:
        x = int(v or 0)
    except (TypeError, ValueError):
        return 0
    return max(0, x)


def map_token_usage(token_usage: Any) -> Dict[str, int]:
    """Map NAT's ``TokenUsageBaseModel`` to Silvanexum token fields.

    NAT's ``nat.data_models.token_usage.TokenUsageBaseModel`` carries
    ``prompt_tokens``, ``completion_tokens``, ``cached_tokens``,
    ``reasoning_tokens`` and ``total_tokens``. Accepts the pydantic model or a
    plain mapping (so tests don't need ``nat`` installed).

    Silvanexum convention (matches ``usage_from_response`` in the SDK):
      * ``inputTokens``  = all prompt tokens (cache is part of the prompt).
      * ``outputTokens`` = completion + reasoning (thinking bills as output).
      * ``cacheReadTokens`` = cached prompt tokens.
      * ``cacheWriteTokens`` = 0 — NAT doesn't distinguish cache writes.
    """
    u = _coerce(token_usage)
    return {
        "inputTokens": _n(u.get("prompt_tokens")),
        "outputTokens": _n(u.get("completion_tokens")) + _n(u.get("reasoning_tokens")),
        "cacheReadTokens": _n(u.get("cached_tokens")),
        "cacheWriteTokens": 0,
    }


def _coerce(obj: Any) -> Dict[str, Any]:
    """Accept a pydantic model, an object with attributes, or a plain mapping."""
    if obj is None:
        return {}
    if isinstance(obj, Mapping):
        return dict(obj)
    dump = getattr(obj, "model_dump", None)
    if callable(dump):
        try:
            out = dump()
            if isinstance(out, Mapping):
                return dict(out)
        except Exception:  # noqa: BLE001 - fall through to attribute access
            pass
    return dict(getattr(obj, "__dict__", {}) or {})


# Substring heuristics over the model name, lowercased. Order matters: the first
# family whose marker appears wins. The exporter only ever sees the model name
# (NAT's IntermediateStep does not carry the LLM config `_type`), so inference
# is name-based unless the workflow pins `provider` in the exporter config.
#
# `nvidia` is intentionally restricted to clear NVIDIA catalog names: the
# `nvidia/` and `meta/` org prefixes used by build.nvidia.com's NIM catalog, and
# `nemotron`. We do NOT infer `nvidia` from a bare `llama`/`mixtral`/`mistral`
# name — the same open model is commonly served through OpenAI-compatible hosts,
# Bedrock, or litellm, where it isn't NVIDIA. Those callers must pin `provider`.
_MODEL_MARKERS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("nvidia", ("nvidia/", "meta/", "nemotron")),
    ("openai", ("gpt-", "gpt4", "o1-", "o3-", "o4-", "text-embedding", "davinci")),
    ("anthropic", ("claude",)),
    ("google", ("gemini", "palm", "bison")),
)


def infer_provider(model: Optional[str], *, override: Optional[str] = None) -> str:
    """Infer a Silvanexum provider for an LLM call.

    Precedence:
      1. ``override`` — an explicit provider pinned in the exporter config
         (validated against :data:`SILVANEXUM_PROVIDERS`).
      2. model-name substring markers (clear NVIDIA catalog names only).
      3. ``other`` as the honest fallback.

    A telemetry exporter only sees the model *name*, never the LLM config
    ``_type`` or its ``base_url``. So we can't tell a hosted NIM from a
    self-hosted one, and an open model like Llama served through OpenAI-compatible
    hosts / Bedrock / litellm looks the same as the hosted NVIDIA catalog entry.
    Callers who need certainty — a **self-hosted NIM** in particular — must set
    ``provider`` in the exporter config (``provider: nim``).
    """
    if override:
        ov = override.strip().lower()
        if ov in SILVANEXUM_PROVIDERS:
            return ov
    name = (model or "").strip().lower()
    for provider, markers in _MODEL_MARKERS:
        if any(m in name for m in markers):
            return provider
    return "other"


def build_event(
    *,
    provider: str,
    model: str,
    token_usage: Any,
    latency_ms: int = 0,
    status: str = "success",
    agent: Optional[str] = None,
    customer: Optional[str] = None,
    trace_id: Optional[str] = None,
    occurred_at: Optional[str] = None,
) -> Dict[str, Any]:
    """Assemble one camelCase ``/meter/events`` event, dropping ``None`` fields.

    The shape matches ``sx.meter.record_events`` input exactly, so the exporter
    can batch these straight through.
    """
    event: Dict[str, Any] = {
        "provider": provider,
        "model": model,
        **map_token_usage(token_usage),
        "latencyMs": _n(latency_ms),
        "status": status,
        "agent": agent,
        "customer": customer,
        "traceId": trace_id,
        "occurredAt": occurred_at,
    }
    return {k: v for k, v in event.items() if v is not None}
