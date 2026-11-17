"""SDK-only metering — ``sx.meter``. No proxy in your request path.

You keep calling OpenAI / Anthropic / Gemini directly. Silvanexum only sees
the usage numbers you report, prices them, attributes them to an agent and a
customer, and enforces your budgets through :meth:`Meter.check`::

    with sx.meter.track("google", "gemini-2.5-flash", customer="acme", agent="matcher") as t:
        resp = httpx.post(gemini_url, json=payload, headers=headers)
        t.response(resp.json())

``track`` times the call, reads the usage off the provider response, and reports
it when the block exits (as ``error`` if the block raised). Reporting failures
are logged and swallowed by default: metering must never break your product.
"""
from __future__ import annotations

import logging
import time
from collections.abc import Mapping
from typing import Any, Dict, List, Optional

from ._errors import SilvanexumError
from ._http import HttpClient

log = logging.getLogger("silvanexum.meter")

# "nvidia" = NIM on NVIDIA's hosted API catalog; "nim" = a self-hosted NIM (both OpenAI-compatible).
PROVIDERS = ("openai", "anthropic", "google", "nvidia", "nim", "other")


def _as_dict(obj: Any) -> Dict[str, Any]:
    """Accept a plain dict or a provider SDK response object (pydantic/attrs)."""
    if obj is None:
        return {}
    if isinstance(obj, Mapping):
        return dict(obj)
    for attr in ("model_dump", "to_dict", "dict"):
        fn = getattr(obj, attr, None)
        if callable(fn):
            try:
                out = fn()
                if isinstance(out, Mapping):
                    return dict(out)
            except Exception:  # noqa: BLE001 - fall through to the next strategy
                pass
    return dict(getattr(obj, "__dict__", {}) or {})


def _n(v: Any) -> int:
    try:
        x = int(v or 0)
    except (TypeError, ValueError):
        return 0
    return max(0, x)


def usage_from_response(provider: str, response: Any) -> Dict[str, int]:
    """Normalize a provider response's usage block.

    Returns ``inputTokens`` (ALL prompt tokens, cache included), ``outputTokens``,
    ``cacheReadTokens`` and ``cacheWriteTokens``. Works on raw JSON dicts and on
    the official SDKs' response objects.
    """
    r = _as_dict(response)
    if provider in ("openai", "nvidia", "nim"):
        u = _as_dict(r.get("usage"))
        details = _as_dict(u.get("prompt_tokens_details"))
        return {
            "inputTokens": _n(u.get("prompt_tokens")),
            "outputTokens": _n(u.get("completion_tokens")),
            "cacheReadTokens": _n(details.get("cached_tokens")),
            "cacheWriteTokens": 0,
        }
    if provider == "anthropic":
        u = _as_dict(r.get("usage"))
        read = _n(u.get("cache_read_input_tokens"))
        write = _n(u.get("cache_creation_input_tokens"))
        return {
            "inputTokens": _n(u.get("input_tokens")) + read + write,
            "outputTokens": _n(u.get("output_tokens")),
            "cacheReadTokens": read,
            "cacheWriteTokens": write,
        }
    if provider == "google":
        u = _as_dict(r.get("usageMetadata") or r.get("usage_metadata"))

        def get(camel: str, snake: str) -> Any:
            return u.get(camel, u.get(snake))

        return {
            "inputTokens": _n(get("promptTokenCount", "prompt_token_count")),
            "outputTokens": _n(get("candidatesTokenCount", "candidates_token_count"))
            + _n(get("thoughtsTokenCount", "thoughts_token_count")),
            "cacheReadTokens": _n(get("cachedContentTokenCount", "cached_content_token_count")),
            "cacheWriteTokens": 0,
        }
    raise ValueError(f"usage_from_response: unsupported provider {provider!r} (use one of openai, anthropic, google, nvidia, nim)")


class Tracked:
    """Handle yielded by :meth:`Meter.track`. Feed it the provider response (or usage)."""

    def __init__(self, provider: str, model: str) -> None:
        self.provider = provider
        self.model = model
        self.usage: Optional[Dict[str, int]] = None

    def response(self, response: Any) -> None:
        """Read usage off a provider response (dict or SDK object)."""
        self.usage = usage_from_response(self.provider, response)

    def set_usage(
        self,
        *,
        input_tokens: int,
        output_tokens: int,
        cache_read_tokens: int = 0,
        cache_write_tokens: int = 0,
    ) -> None:
        """Report usage you counted yourself (e.g. accumulated over a stream)."""
        self.usage = {
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "cacheReadTokens": cache_read_tokens,
            "cacheWriteTokens": cache_write_tokens,
        }


class _Track:
    def __init__(self, meter: Meter, provider: str, model: str, *, agent, customer, trace_id, check, raise_on_error):
        self._meter = meter
        self._tracked = Tracked(provider, model)
        self._attr = {"agent": agent, "customer": customer, "traceId": trace_id}
        self._check = check
        self._raise = raise_on_error
        self._t0 = 0.0

    def __enter__(self) -> Tracked:
        if self._check:
            verdict = self._meter.check(agent=self._attr["agent"], customer=self._attr["customer"], model=self._tracked.model)
            if not verdict.get("allowed", True):
                raise BudgetExceededError(verdict.get("message") or "Budget exhausted.", body=verdict, status=402, code="budget_exceeded")
        self._t0 = time.monotonic()
        return self._tracked

    def __exit__(self, exc_type, exc, tb) -> bool:
        latency_ms = int((time.monotonic() - self._t0) * 1000)
        usage = self._tracked.usage or {"inputTokens": 0, "outputTokens": 0, "cacheReadTokens": 0, "cacheWriteTokens": 0}
        event = {
            "provider": self._tracked.provider,
            "model": self._tracked.model,
            **usage,
            "latencyMs": latency_ms,
            "status": "error" if exc_type else "success",
            **{k: v for k, v in self._attr.items() if v is not None},
        }
        try:
            self._meter.record_events([event])
        except SilvanexumError as e:
            if self._raise:
                raise
            log.warning("silvanexum: failed to report usage (%s); the call itself was unaffected", e)
        return False  # never swallow the caller's exception


class BudgetExceededError(SilvanexumError):
    """A block-mode budget would be breached by this call (raised by ``track(check=True)``)."""


class Meter:
    """SDK-only metering — ``sx.meter``. See the module docstring."""

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def check(
        self,
        *,
        agent: Optional[str] = None,
        customer: Optional[str] = None,
        model: Optional[str] = None,
        projected_credits: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Budget pre-flight. Returns ``{"allowed": True}`` or ``{"allowed": False, "message": ...}``.

        Never raises for a blocked budget: you decide whether to skip the call.
        """
        body = {"agent": agent, "customer": customer, "model": model, "projectedCredits": projected_credits}
        try:
            return self._http.request("POST", "/meter/check", json={k: v for k, v in body.items() if v is not None})
        except SilvanexumError as e:
            if e.status == 402:
                return dict(e.body or {"allowed": False, "message": e.message})
            raise

    def record(
        self,
        *,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cache_read_tokens: int = 0,
        cache_write_tokens: int = 0,
        latency_ms: int = 0,
        status: str = "success",
        agent: Optional[str] = None,
        customer: Optional[str] = None,
        trace_id: Optional[str] = None,
        occurred_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Report one provider call. Priced server-side. Returns ``{"recorded", "costCredits"}``."""
        event = {
            "provider": provider,
            "model": model,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "cacheReadTokens": cache_read_tokens,
            "cacheWriteTokens": cache_write_tokens,
            "latencyMs": latency_ms,
            "status": status,
            "agent": agent,
            "customer": customer,
            "traceId": trace_id,
            "occurredAt": occurred_at,
        }
        return self.record_events([{k: v for k, v in event.items() if v is not None}])

    def record_response(
        self,
        provider: str,
        model: str,
        response: Any,
        *,
        latency_ms: int = 0,
        agent: Optional[str] = None,
        customer: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Report a call straight from its provider response (dict or SDK object)."""
        u = usage_from_response(provider, response)
        return self.record(
            provider=provider,
            model=model,
            input_tokens=u["inputTokens"],
            output_tokens=u["outputTokens"],
            cache_read_tokens=u["cacheReadTokens"],
            cache_write_tokens=u["cacheWriteTokens"],
            latency_ms=latency_ms,
            agent=agent,
            customer=customer,
            trace_id=trace_id,
        )

    def record_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Report up to 500 pre-shaped events (camelCase keys, as the API takes them)."""
        return self._http.request("POST", "/meter/events", json={"events": events})

    def track(
        self,
        provider: str,
        model: str,
        *,
        agent: Optional[str] = None,
        customer: Optional[str] = None,
        trace_id: Optional[str] = None,
        check: bool = False,
        raise_on_error: bool = False,
    ) -> _Track:
        """Context manager that times a call and reports its usage on exit.

        ``check=True`` runs :meth:`check` first and raises :class:`BudgetExceededError`
        when a block-mode budget is exhausted, so the call never happens.
        ``raise_on_error=True`` surfaces reporting failures instead of logging them.
        """
        if provider not in PROVIDERS:
            raise ValueError(f"provider must be one of {PROVIDERS}")
        return _Track(self, provider, model, agent=agent, customer=customer, trace_id=trace_id, check=check, raise_on_error=raise_on_error)
