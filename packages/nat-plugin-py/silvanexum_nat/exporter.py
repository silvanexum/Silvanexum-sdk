"""The Silvanexum telemetry exporter for NeMo Agent Toolkit.

A ``RawExporter[IntermediateStep, IntermediateStep]`` that watches a workflow's
LLM events and reports usage to Silvanexum for pricing, attribution and budget
enforcement. It is intentionally passive on the hot path: a reporting failure is
logged, never raised, so metering can never break the user's agent.

This module imports ``nat`` and is therefore imported lazily, from inside the
``@register_telemetry_exporter`` function in :mod:`silvanexum_nat.register`.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, List, Optional

from nat.data_models.intermediate_step import IntermediateStep, IntermediateStepType
from nat.observability.exporter.raw_exporter import RawExporter
from silvanexum import Silvanexum

from ._mapping import build_event, infer_provider

logger = logging.getLogger("silvanexum_nat")


class SilvanexumExporter(RawExporter[IntermediateStep, IntermediateStep]):
    """Report NAT LLM usage to Silvanexum; optionally pre-flight budgets.

    Parameters mirror the YAML config (see :mod:`silvanexum_nat.register`). The
    exporter buffers events and flushes them with ``sx.meter.record_events`` once
    ``batch_size`` is reached, on ``flush_interval_s`` wall-clock, or on shutdown.
    """

    def __init__(
        self,
        *,
        client: Optional[Silvanexum],
        agent: str,
        customer: Optional[str] = None,
        provider_override: Optional[str] = None,
        enforce_budget: bool = False,
        batch_size: int = 50,
        flush_interval_s: float = 5.0,
        context_state: Any = None,
    ) -> None:
        super().__init__(context_state=context_state)
        self._sx = client
        # Disabled mode: no client (e.g. missing API key). The exporter still
        # registers and runs, but drops every event instead of raising — so a
        # misconfiguration can never break the user's workflow.
        self._enabled = client is not None
        self._agent = agent
        self._customer = customer
        self._provider_override = provider_override
        self._enforce_budget = enforce_budget
        self._batch_size = max(1, int(batch_size))
        self._flush_interval_s = max(0.0, float(flush_interval_s))
        # Buffered events + per-call bookkeeping. LLM_START stamps a monotonic
        # start time keyed by the step UUID so LLM_END can compute latency.
        self._buffer: List[dict] = []
        self._pending_starts: dict[str, float] = {}
        self._last_flush = time.monotonic()
        # Background flusher so a quiet workflow doesn't hold events until
        # shutdown. Started lazily on the first event (when a loop is running),
        # cancelled in _cleanup.
        self._flush_task: Optional[asyncio.Task] = None
        #: UUIDs the budget pre-flight marked as blocked (surfaced for callers
        #: that want to read it; NAT exporters cannot abort the call itself).
        self.blocked_calls: List[str] = []

    def create_isolated_instance(self, context_state: Any) -> "SilvanexumExporter":
        """Per-run copy for concurrent workflows (NAT calls this per request).

        NAT's base makes a shallow copy, which would share the buffer, the
        pending-start map and the flusher task between concurrent runs: one run's
        flush would send another run's events, and that run would send them again.
        Give each copy its own mutable state; the Silvanexum client stays shared.
        """
        isolated = super().create_isolated_instance(context_state)
        isolated._buffer = []
        isolated._pending_starts = {}
        isolated._last_flush = time.monotonic()
        isolated._flush_task = None
        isolated.blocked_calls = []
        return isolated

    # -- NAT RawExporter hook ------------------------------------------------
    async def export_processed(self, item: IntermediateStep) -> None:
        """Handle one workflow event. Never raises, never blocks the loop."""
        if not self._enabled:
            return
        self._ensure_flush_task()
        try:
            event_type = item.event_type
            if event_type == IntermediateStepType.LLM_START:
                await self._on_llm_start(item)
            elif event_type == IntermediateStepType.LLM_END:
                await self._on_llm_end(item)
        except Exception as ex:  # noqa: BLE001 - telemetry must never break the agent
            logger.warning("silvanexum_nat: skipped an event (%s)", ex)

    # -- event handlers ------------------------------------------------------
    async def _on_llm_start(self, item: IntermediateStep) -> None:
        uuid = _uuid(item)
        if uuid:
            self._pending_starts[uuid] = time.monotonic()
        if not self._enforce_budget:
            return
        provider = infer_provider(item.name, override=self._provider_override)
        verdict = await self._safe_check(model=item.name or provider, provider=provider)
        if verdict is not None and not verdict.get("allowed", True):
            # NAT telemetry exporters are observers: we can flag and loudly log a
            # budget breach, but we can't abort the in-flight LLM call from here.
            # A hard pre-call block needs NAT middleware (see README / RESEARCH).
            if uuid:
                self.blocked_calls.append(uuid)
            logger.error(
                "silvanexum_nat: BUDGET BLOCK for agent=%s customer=%s model=%s — %s "
                "(the call was NOT aborted: a telemetry exporter cannot block a call; "
                "use NAT middleware for hard enforcement)",
                self._agent,
                self._customer,
                item.name,
                verdict.get("message") or "budget exhausted",
            )

    async def _on_llm_end(self, item: IntermediateStep) -> None:
        usage_info = item.usage_info
        token_usage = getattr(usage_info, "token_usage", None) if usage_info else None
        model = item.name or "unknown"
        provider = infer_provider(model, override=self._provider_override)
        # NAT 1.9 emits no LLM_END for a failed call, and always attaches usage
        # on success. Defensively treat a missing usage block as an error (zero
        # tokens) rather than a free success. See RESEARCH.md.
        status = "success" if item.usage_info is not None else "error"
        event = build_event(
            provider=provider,
            model=model,
            token_usage=token_usage,
            latency_ms=self._latency_ms(item),
            status=status,
            agent=self._agent,
            customer=self._customer,
            trace_id=self._trace_id(item),
        )
        self._buffer.append(event)
        if len(self._buffer) >= self._batch_size or self._interval_elapsed():
            await self._flush()

    # -- Silvanexum I/O (off the event loop, all no-raise) ------------------
    async def _safe_check(self, *, model: str, provider: str) -> Optional[dict]:
        if self._sx is None:
            return None
        try:
            # Run the synchronous SDK call off the loop so a slow/unreachable
            # Silvanexum can't freeze the agent's event loop.
            return await asyncio.to_thread(
                self._sx.meter.check, agent=self._agent, customer=self._customer, model=model
            )
        except Exception as ex:  # noqa: BLE001 - e.g. a non-JSON 200 from a proxy
            logger.warning("silvanexum_nat: budget check failed, allowing the call (%s)", ex)
            return None

    async def _flush(self) -> None:
        if not self._buffer or self._sx is None:
            return
        batch, self._buffer = self._buffer, []
        self._last_flush = time.monotonic()
        try:
            await asyncio.to_thread(self._sx.meter.record_events, batch)
        except Exception as ex:  # noqa: BLE001 - must not escape into _cleanup/flusher
            logger.warning(
                "silvanexum_nat: failed to report %d event(s); the workflow was unaffected (%s)",
                len(batch),
                ex,
            )

    # -- background flusher --------------------------------------------------
    def _ensure_flush_task(self) -> None:
        """Start the periodic flusher once, lazily (needs a running loop)."""
        if self._flush_interval_s <= 0 or self._flush_task is not None:
            return
        try:
            self._flush_task = asyncio.get_running_loop().create_task(self._periodic_flush())
        except RuntimeError:
            # No running loop (shouldn't happen from an async export); skip.
            self._flush_task = None

    async def _periodic_flush(self) -> None:
        """Flush on a wall-clock interval so quiet workflows still report."""
        try:
            while True:
                await asyncio.sleep(self._flush_interval_s)
                if self._buffer:
                    await self._flush()
        except asyncio.CancelledError:
            raise
        except Exception as ex:  # noqa: BLE001 - never let the task die loudly
            logger.debug("silvanexum_nat: periodic flush stopped (%s)", ex)

    async def _cleanup(self) -> None:
        """Cancel the flusher and flush remaining events when stopped."""
        if self._flush_task is not None:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
            self._flush_task = None
        await self._flush()
        try:
            await super()._cleanup()
        except Exception as ex:  # noqa: BLE001
            logger.debug("silvanexum_nat: base cleanup raised (%s)", ex)

    # -- small helpers -------------------------------------------------------
    def _interval_elapsed(self) -> bool:
        if self._flush_interval_s <= 0:
            return False
        return (time.monotonic() - self._last_flush) >= self._flush_interval_s

    def _latency_ms(self, item: IntermediateStep) -> int:
        uuid = _uuid(item)
        if uuid and uuid in self._pending_starts:
            started = self._pending_starts.pop(uuid)
            return int((time.monotonic() - started) * 1000)
        # Fall back to NAT's own timestamps if we never saw the START.
        start = item.span_event_timestamp
        end = item.event_timestamp
        if start and end and end >= start:
            return int((end - start) * 1000)
        return 0

    def _trace_id(self, item: IntermediateStep) -> Optional[str]:
        # Prefer the workflow run id (one per request) so a trace in the
        # Silvanexum dashboard stitches a whole workflow together.
        run_id = _workflow_run_id(self)
        if run_id:
            return run_id
        return _uuid(item) or None


def _uuid(item: IntermediateStep) -> Optional[str]:
    return getattr(item, "UUID", None)


def _workflow_run_id(exporter: SilvanexumExporter) -> Optional[str]:
    """Best-effort read of the active workflow run id from NAT's context.

    ``Context`` is provisional-public in ``nat.plugin_api``; guard the import and
    any failure so a NAT version without it simply falls back to the step UUID.
    """
    try:
        from nat.plugin_api import Context

        return getattr(Context.get(), "workflow_run_id", None)
    except Exception:  # noqa: BLE001 - optional, best-effort
        return None
