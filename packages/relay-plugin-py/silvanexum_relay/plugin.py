"""The Silvanexum NeMo Relay worker plugin.

Registers two things on a Relay ``PluginContext``:

* a **subscriber** that meters every LLM-end event to Silvanexum (priced
  server-side, attributed per agent/customer), batched off the event loop; and
* an optional **LLM conditional-execution guardrail** that calls
  ``sx.meter.check`` and *rejects the call before it runs* when a budget is
  exhausted — the hard block NAT couldn't do.

Design carried over from ``silvanexum-nat`` (see its RESEARCH.md): a missing API
key degrades to a disabled no-op (never a crash); all Silvanexum I/O runs off
the loop with a short timeout and ``max_retries=0``; a background flusher drains
a quiet workflow; and telemetry failures are logged, never raised. The guardrail
additionally honours ``fail_open`` and a short TTL cache so it stays fast.
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

from silvanexum import Silvanexum

from . import _mapping as mapping
from ._cache import TTLCache

logger = logging.getLogger("silvanexum_relay")

_API_KEY_ENV = "SILVANEXUM_API_KEY"
_BASE_URL_ENV = "SILVANEXUM_BASE_URL"

# Plugin kind, as used in plugins.toml `components[].kind` and as the worker's
# reported identity.
PLUGIN_KIND = "silvanexum"

# Cap on LLM starts waiting for their end event (a call that never ends must
# not grow memory forever). Oldest entries are evicted first.
_MAX_PENDING_STARTS = 10_000


class SilvanexumConfig:
    """Validated view of one ``silvanexum`` component's JSON config.

    Kept as a plain object (not pydantic) so the module imports without pulling a
    validation dependency; :meth:`from_json` does the light coercion and
    :func:`validate_config` produces Relay diagnostics.
    """

    def __init__(self, raw: Dict[str, Any]) -> None:
        self.api_key: Optional[str] = _opt_str(raw.get("api_key")) or os.environ.get(_API_KEY_ENV)
        self.base_url: Optional[str] = _opt_str(raw.get("base_url")) or os.environ.get(_BASE_URL_ENV)
        self.agent: Optional[str] = _opt_str(raw.get("agent"))
        self.customer: Optional[str] = _opt_str(raw.get("customer"))
        self.provider: Optional[str] = _opt_str(raw.get("provider"))
        self.enforce_budget: bool = bool(raw.get("enforce_budget", False))
        self.fail_open: bool = bool(raw.get("fail_open", True))
        self.batch_size: int = _pos_int(raw.get("batch_size"), default=50, minimum=1)
        self.flush_interval_s: float = _non_neg_float(raw.get("flush_interval_s"), default=5.0)
        self.timeout_s: float = _pos_float(raw.get("timeout_s"), default=5.0)
        self.budget_cache_ttl_s: float = _non_neg_float(raw.get("budget_cache_ttl_s"), default=2.0)


class SilvanexumMeter:
    """Owns the Silvanexum client, the event buffer and the budget cache.

    One per activated component. Shared across concurrent Relay runs — it holds
    no per-run mutable state beyond the batch buffer, which is append-only and
    flushed wholesale, so concurrent runs don't cross-bill (each event already
    carries its own trace/customer/agent).
    """

    def __init__(self, config: SilvanexumConfig) -> None:
        self._config = config
        self._provider_override = config.provider
        self._client: Optional[Silvanexum] = _build_client(config)
        self.enabled = self._client is not None
        self._buffer: List[dict] = []
        self._lock = asyncio.Lock()
        self._last_flush = time.monotonic()
        self._flush_task: Optional[asyncio.Task] = None
        # (start_ts, request headers) keyed by scope uuid, so an LLM end can
        # compute latency and keep the request's per-call attribution.
        self._pending_starts: Dict[str, Tuple[Optional[float], Dict[str, str]]] = {}
        self._budget_cache = TTLCache(config.budget_cache_ttl_s)

    # -- metering subscriber -------------------------------------------------
    async def on_event(self, event: Any) -> None:
        """Relay subscriber callback. Never raises, never blocks the loop."""
        if not self.enabled:
            return
        self._ensure_flush_task()
        try:
            if not isinstance(event, dict):
                return
            if mapping.is_llm_start(event):
                uuid = event.get("uuid")
                if isinstance(uuid, str):
                    if len(self._pending_starts) >= _MAX_PENDING_STARTS:
                        self._pending_starts.pop(next(iter(self._pending_starts)))
                    self._pending_starts[uuid] = (
                        mapping.parse_ts(event.get("timestamp")),
                        mapping.request_headers(event.get("data")),
                    )
                return
            if not mapping.is_llm_end(event):
                return
            await self._record_end(event)
        except Exception as ex:  # noqa: BLE001 - telemetry must never break the host
            logger.warning("silvanexum_relay: skipped an event (%s)", ex)

    async def _record_end(self, event: Dict[str, Any]) -> None:
        model = mapping.extract_model(event)
        usage = mapping.extract_usage(event)
        uuid = event.get("uuid")
        start = self._pending_starts.pop(uuid, None) if isinstance(uuid, str) else None
        start_ts, headers = start if start is not None else (None, {})
        attr = mapping.extract_attribution(
            event, customer=self._config.customer, agent=self._config.agent, headers=headers
        )
        provider = mapping.infer_provider(
            model, override=self._provider_override, event_provider=_event_provider(event)
        )
        status = mapping.event_status(event)
        if status == "success" and not usage:
            # A successful call whose provider reported no usage (common on
            # streams). Record it so the call isn't lost, and say why it's $0.
            logger.warning(
                "silvanexum_relay: %s returned no token usage; recorded with 0 tokens "
                "(for OpenAI streaming, send stream_options.include_usage=true)",
                model,
            )
        meter_event = mapping.build_event(
            provider=provider,
            model=model,
            usage=usage,
            latency_ms=mapping.event_latency_ms(event, start_ts=start_ts),
            status=status,
            agent=attr["agent"],
            customer=attr["customer"],
            trace_id=attr["trace_id"],
        )
        async with self._lock:
            self._buffer.append(meter_event)
            due = len(self._buffer) >= self._config.batch_size or self._interval_elapsed()
        if due:
            await self._flush()

    # -- budget guardrail ----------------------------------------------------
    async def check_allowed(self, request: Any) -> Optional[str]:
        """Conditional-execution guardrail: return ``None`` to allow, or a
        rejection message string to block the LLM call before it runs."""
        if not self.enabled or self._client is None:
            return None  # disabled plugin never blocks
        model = mapping.extract_model_from_request(request)
        # Same precedence as metering (headers > config), so a call is checked
        # against the budget it will be billed to.
        from_headers = mapping.header_attribution(mapping.request_headers(request))
        agent = from_headers["agent"] or self._config.agent
        customer = from_headers["customer"] or self._config.customer
        key = (agent, customer, model)
        cached = self._budget_cache.get(key)
        if cached is not None:
            return cached if cached else None  # "" = allowed (cached)
        try:
            verdict = await asyncio.wait_for(
                asyncio.to_thread(
                    self._client.meter.check,
                    agent=agent,
                    customer=customer,
                    model=model,
                ),
                timeout=self._config.timeout_s,
            )
        except Exception as ex:  # noqa: BLE001 - timeout, transport, bad body, etc.
            if self._config.fail_open:
                logger.warning("silvanexum_relay: budget check failed, allowing the call (%s)", ex)
                return None
            logger.error("silvanexum_relay: budget check failed and fail_open=false; blocking (%s)", ex)
            return "Silvanexum budget check unavailable and fail_open is disabled."
        allowed = bool(verdict.get("allowed", True))
        message = "" if allowed else (verdict.get("message") or "Budget exhausted.")
        self._budget_cache.set(key, message)
        return None if allowed else message

    # -- Silvanexum I/O (off the loop, no-raise) -----------------------------
    async def _flush(self) -> None:
        if self._client is None:
            return
        async with self._lock:
            if not self._buffer:
                return
            batch, self._buffer = self._buffer, []
            self._last_flush = time.monotonic()
        try:
            await asyncio.to_thread(self._client.meter.record_events, batch)
        except Exception as ex:  # noqa: BLE001 - must not escape into shutdown/flusher
            logger.warning(
                "silvanexum_relay: failed to report %d event(s); the host was unaffected (%s)",
                len(batch),
                ex,
            )

    def _ensure_flush_task(self) -> None:
        if self._config.flush_interval_s <= 0 or self._flush_task is not None:
            return
        try:
            self._flush_task = asyncio.get_running_loop().create_task(self._periodic_flush())
        except RuntimeError:
            self._flush_task = None

    async def _periodic_flush(self) -> None:
        try:
            while True:
                await asyncio.sleep(self._config.flush_interval_s)
                if self._buffer:
                    await self._flush()
        except asyncio.CancelledError:
            raise
        except Exception as ex:  # noqa: BLE001
            logger.debug("silvanexum_relay: periodic flush stopped (%s)", ex)

    async def aclose(self) -> None:
        """Cancel the flusher, drain the buffer, close the client."""
        if self._flush_task is not None:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
            self._flush_task = None
        await self._flush()
        if self._client is not None:
            try:
                self._client.close()
            except Exception as ex:  # noqa: BLE001
                logger.debug("silvanexum_relay: client close raised (%s)", ex)

    def _interval_elapsed(self) -> bool:
        if self._config.flush_interval_s <= 0:
            return False
        return (time.monotonic() - self._last_flush) >= self._config.flush_interval_s


# --- helpers --------------------------------------------------------------- #
def _event_provider(event: Dict[str, Any]) -> Optional[str]:
    profile = event.get("category_profile")
    if isinstance(profile, dict):
        for key in ("provider", "provider_name"):
            v = profile.get(key)
            if isinstance(v, str) and v:
                return v
    return None


def _build_client(config: SilvanexumConfig) -> Optional[Silvanexum]:
    """Build the Silvanexum client, or ``None`` (disabled) on no key / failure."""
    if not config.api_key:
        logger.warning(
            "silvanexum_relay: no API key (set %s or the plugin's api_key); "
            "the plugin is DISABLED and will drop events and never block (the host runs normally).",
            _API_KEY_ENV,
        )
        return None
    try:
        return Silvanexum(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.timeout_s,
            max_retries=0,
        )
    except Exception as ex:  # noqa: BLE001 - SilvanexumError on bad config, etc.
        logger.warning(
            "silvanexum_relay: could not build the Silvanexum client (%s); the plugin is DISABLED.",
            ex,
        )
        return None


def _opt_str(v: Any) -> Optional[str]:
    return v if isinstance(v, str) and v.strip() else None


def _pos_int(v: Any, *, default: int, minimum: int) -> int:
    try:
        return max(minimum, int(v))
    except (TypeError, ValueError):
        return default


def _pos_float(v: Any, *, default: float) -> float:
    try:
        f = float(v)
        return f if f > 0 else default
    except (TypeError, ValueError):
        return default


def _non_neg_float(v: Any, *, default: float) -> float:
    try:
        f = float(v)
        return f if f >= 0 else default
    except (TypeError, ValueError):
        return default
