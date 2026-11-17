"""Pure mapping helpers: NeMo Relay ATOF events -> Silvanexum meter events.

Kept free of any ``nemo_relay_plugin`` import so the mapping, event extraction
and provider-inference logic can be unit-tested without the Relay SDK. The
subscriber in :mod:`silvanexum_relay.plugin` feeds raw ATOF event dicts into
:func:`event_to_meter_event`.

ATOF (Agent Trajectory Observability Format) 0.1 event envelope, as used by the
Relay subscriber callback:

    {
      "kind": "scope",                 # or "mark"
      "scope_category": "end",         # "start" | "end" for scope events
      "category": "llm",               # llm | tool | agent | ...
      "uuid": "...", "parent_uuid": "...",
      "name": "...", "timestamp": "2026-10-29T17:59:08.2607+00:00",  # RFC 3339 text
      "metadata": { "otel.status_code": "OK" | "ERROR", ... },
      "data": { "headers": {...}, "content": {...} },  # on LLM start: the request
      "category_profile": {
          "model_name": "meta/llama-3.1-8b-instruct",
          "annotated_response": { "usage": { ...Usage... }, "model": "..." }
      }
    }

Relay's ``Usage`` (nemo-relay-types) carries ``prompt_tokens``,
``completion_tokens``, ``total_tokens``, ``cache_read_tokens``,
``cache_write_tokens``, ``uncached_input_tokens`` and an optional ``cost``.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Mapping, Optional

#: Silvanexum ``/meter/events`` provider values (see the SDK ``_meter`` docs).
SILVANEXUM_PROVIDERS = ("openai", "anthropic", "google", "nvidia", "nim", "other")


def _n(v: Any) -> int:
    """Coerce to a non-negative int; ``None``/garbage -> 0 (never raise)."""
    try:
        x = int(v or 0)
    except (TypeError, ValueError):
        return 0
    return max(0, x)


def _d(obj: Any) -> Dict[str, Any]:
    """Return a plain dict view of a mapping, else ``{}`` (never raise)."""
    return dict(obj) if isinstance(obj, Mapping) else {}


# --- provider inference ---------------------------------------------------- #
# Same policy as silvanexum-nat: `nvidia` is restricted to clear NVIDIA catalog
# names (the `nvidia/` and `meta/` org prefixes and `nemotron`). A bare
# llama/mixtral/mistral name is NOT inferred as nvidia — the same open model is
# served through OpenAI-compatible hosts, Bedrock, or litellm; pin `provider`
# there. A self-hosted NIM must also be pinned (`provider = "nim"`), because an
# event never carries the LLM config's base URL.
_MODEL_MARKERS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("nvidia", ("nvidia/", "meta/", "nemotron")),
    ("openai", ("gpt-", "gpt4", "o1-", "o3-", "o4-", "text-embedding", "davinci")),
    ("anthropic", ("claude",)),
    ("google", ("gemini", "palm", "bison")),
)


def infer_provider(
    model: Optional[str],
    *,
    override: Optional[str] = None,
    event_provider: Optional[str] = None,
) -> str:
    """Infer a Silvanexum provider for an LLM call.

    Precedence:
      1. ``override`` — an explicit provider pinned in the plugin config.
      2. ``event_provider`` — a provider Relay itself put on the event, when it
         maps onto a Silvanexum provider.
      3. model-name markers (clear NVIDIA catalog names only).
      4. ``other``.
    """
    if override:
        ov = override.strip().lower()
        if ov in SILVANEXUM_PROVIDERS:
            return ov
    if event_provider:
        ep = event_provider.strip().lower()
        if ep in SILVANEXUM_PROVIDERS:
            return ep
    name = (model or "").strip().lower()
    for provider, markers in _MODEL_MARKERS:
        if any(m in name for m in markers):
            return provider
    return "other"


# --- usage mapping --------------------------------------------------------- #
def map_usage(usage: Any) -> Dict[str, int]:
    """Map a Relay ``Usage`` block to Silvanexum token fields.

    Silvanexum convention:
      * ``inputTokens``  = all prompt tokens (cache included). Relay's
        ``prompt_tokens`` already includes cache reads; when only the split
        (``uncached_input_tokens`` + cache) is present, we reconstruct the total.
      * ``outputTokens`` = ``completion_tokens`` (Relay folds reasoning tokens in).
      * ``cacheReadTokens`` / ``cacheWriteTokens`` from the cache counters.
    """
    u = _d(usage)
    cache_read = _n(u.get("cache_read_tokens"))
    cache_write = _n(u.get("cache_write_tokens"))
    prompt = u.get("prompt_tokens")
    if prompt is None and u.get("uncached_input_tokens") is not None:
        # Only the authoritative split is present — rebuild the inclusive total.
        input_tokens = _n(u.get("uncached_input_tokens")) + cache_read + cache_write
    else:
        input_tokens = _n(prompt)
    return {
        "inputTokens": input_tokens,
        "outputTokens": _n(u.get("completion_tokens")),
        "cacheReadTokens": cache_read,
        "cacheWriteTokens": cache_write,
    }


def is_llm_end(event: Any) -> bool:
    """True for an ATOF LLM-end scope event (the one carrying usage)."""
    e = _d(event)
    return e.get("kind") == "scope" and e.get("category") == "llm" and e.get("scope_category") == "end"


def is_llm_start(event: Any) -> bool:
    """True for an ATOF LLM-start scope event (used to stamp latency)."""
    e = _d(event)
    return e.get("kind") == "scope" and e.get("category") == "llm" and e.get("scope_category") == "start"


def _annotated_response(profile: Mapping[str, Any]) -> Dict[str, Any]:
    return _d(profile.get("annotated_response"))


def extract_model(event: Mapping[str, Any]) -> str:
    """Pull the model name off an LLM event (category_profile.model_name)."""
    profile = _d(event.get("category_profile"))
    model = profile.get("model_name") or _annotated_response(profile).get("model")
    if isinstance(model, str) and model:
        return model
    return "unknown"


def extract_usage(event: Mapping[str, Any]) -> Dict[str, Any]:
    """Pull the Relay ``Usage`` dict off an LLM end event, if present.

    Looks under ``category_profile.annotated_response.usage`` first (the codec
    annotation), then a top-level ``usage`` on the response or event data.
    """
    profile = _d(event.get("category_profile"))
    resp = _annotated_response(profile)
    for candidate in (resp.get("usage"), _d(event.get("data")).get("usage"), profile.get("usage")):
        if isinstance(candidate, Mapping):
            return dict(candidate)
    return {}


#: Per-request attribution headers, the same names the Silvanexum gateway reads.
CUSTOMER_HEADER = "x-silvanexum-customer"
AGENT_HEADER = "x-silvanexum-agent"


def request_headers(payload: Any) -> Dict[str, str]:
    """Lower-cased string headers from a Relay LLM request (``{"headers", "content"}``),
    which is both the guardrail's argument and an LLM-start event's ``data``."""
    headers = _d(_d(payload).get("headers"))
    return {str(k).lower(): v for k, v in headers.items() if isinstance(v, str)}


def header_attribution(headers: Mapping[str, str]) -> Dict[str, Optional[str]]:
    """``customer``/``agent`` from the ``x-silvanexum-*`` request headers, if sent."""
    return {
        "customer": headers.get(CUSTOMER_HEADER) or None,
        "agent": headers.get(AGENT_HEADER) or None,
    }


def extract_attribution(
    event: Mapping[str, Any],
    *,
    customer: Optional[str],
    agent: Optional[str],
    headers: Optional[Mapping[str, str]] = None,
) -> Dict[str, Optional[str]]:
    """Resolve customer/agent/trace_id.

    Precedence: the request's ``x-silvanexum-customer`` / ``x-silvanexum-agent``
    headers (per call), then the plugin config (a deployment default), then the
    event ``metadata`` (``silvanexum_customer`` / ``customer`` and the agent).
    The budget guardrail resolves the same way, so a call is checked against the
    budget it is billed to. The trace id is the parent scope (one per request).
    """
    meta = _d(event.get("metadata"))
    from_headers = header_attribution(headers or {})
    resolved_customer = (
        from_headers["customer"]
        or customer
        or _first_str(meta, ("silvanexum_customer", "customer", "customer_id"))
    )
    resolved_agent = (
        from_headers["agent"] or agent or _first_str(meta, ("silvanexum_agent", "agent", "agent_name"))
    )
    trace_id = event.get("parent_uuid") or event.get("uuid")
    return {
        "customer": resolved_customer,
        "agent": resolved_agent,
        "trace_id": trace_id if isinstance(trace_id, str) else None,
    }


def _first_str(meta: Mapping[str, Any], keys: tuple[str, ...]) -> Optional[str]:
    for k in keys:
        v = meta.get(k)
        if isinstance(v, str) and v:
            return v
    return None


def parse_ts(value: Any) -> Optional[float]:
    """An ATOF timestamp as epoch seconds. Relay emits RFC 3339 text (with
    nanosecond fractions); numbers are accepted too. ``None`` if unparseable."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
        except ValueError:
            return None
    return None


def event_latency_ms(event: Mapping[str, Any], *, start_ts: Optional[float]) -> int:
    """Latency from the paired start timestamp to this end event (seconds->ms).

    Both sides come from Relay's own clock; if either is missing, report 0
    rather than mixing clocks."""
    end_ts = parse_ts(event.get("timestamp"))
    if start_ts is not None and end_ts is not None and end_ts >= start_ts:
        return int((end_ts - start_ts) * 1000)
    return 0


def event_status(event: Mapping[str, Any]) -> str:
    """``error`` when Relay marked the LLM scope failed (``otel.status_code``),
    else ``success``. Missing usage alone is NOT an error: providers often omit
    it on streams (e.g. OpenAI without ``stream_options.include_usage``)."""
    code = _d(event.get("metadata")).get("otel.status_code")
    return "error" if isinstance(code, str) and code.upper() == "ERROR" else "success"


def build_event(
    *,
    provider: str,
    model: str,
    usage: Any,
    latency_ms: int = 0,
    status: str = "success",
    agent: Optional[str] = None,
    customer: Optional[str] = None,
    trace_id: Optional[str] = None,
    occurred_at: Optional[str] = None,
) -> Dict[str, Any]:
    """Assemble one camelCase ``/meter/events`` event, dropping ``None`` fields."""
    event: Dict[str, Any] = {
        "provider": provider,
        "model": model,
        **map_usage(usage),
        "latencyMs": _n(latency_ms),
        "status": status,
        "agent": agent,
        "customer": customer,
        "traceId": trace_id,
        "occurredAt": occurred_at,
    }
    return {k: v for k, v in event.items() if v is not None}


def extract_model_from_request(request: Any) -> str:
    """Best-effort model id from an ``LlmRequest`` passed to the guardrail.

    Relay passes ``{"headers": {...}, "content": <provider body>}``; the model is
    ``content.model`` for OpenAI/NIM/Anthropic bodies. Older or other shapes are
    tried as fallbacks.
    """
    r = _d(request)
    content = _d(r.get("content"))
    for key in ("model", "model_name", "model_id"):
        v = content.get(key)
        if isinstance(v, str) and v:
            return v
    for key in ("model", "model_name", "model_id"):
        v = r.get(key)
        if isinstance(v, str) and v:
            return v
    # Some shapes nest the request under "request"/"body".
    for nest in ("request", "body", "params"):
        inner = _d(r.get(nest))
        for key in ("model", "model_name"):
            v = inner.get(key)
            if isinstance(v, str) and v:
                return v
    return "unknown"
