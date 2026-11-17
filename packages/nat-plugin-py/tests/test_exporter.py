"""Exporter tests: batching, budget-block path, and silent failure.

These exercise the real :class:`SilvanexumExporter` against a mocked Silvanexum
HTTP API (``httpx.MockTransport``, same pattern as the SDK's own tests). NAT is
required only for the ``IntermediateStepType`` enum; the workflow events are
lightweight duck-typed fakes, so we don't have to build NAT's full
``IntermediateStep`` object graph (parent_id, InvocationNode, payload, …).
"""
from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, List, Optional

import httpx
import pytest

# The exporter imports `nat`; skip the whole module cleanly if it isn't present
# (the fast mapping tests in test_mapping.py still run without NAT).
nat_is = pytest.importorskip("nat.data_models.intermediate_step")
IntermediateStepType = nat_is.IntermediateStepType

from silvanexum import Silvanexum  # noqa: E402

from silvanexum_nat.exporter import SilvanexumExporter  # noqa: E402

BASE = "https://api.test"


@dataclass
class FakeTokenUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    cached_tokens: int = 0
    reasoning_tokens: int = 0
    total_tokens: int = 0

    def model_dump(self) -> dict:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "cached_tokens": self.cached_tokens,
            "reasoning_tokens": self.reasoning_tokens,
            "total_tokens": self.total_tokens,
        }


@dataclass
class FakeUsageInfo:
    token_usage: FakeTokenUsage = field(default_factory=FakeTokenUsage)


@dataclass
class FakeStep:
    """Duck-typed stand-in for nat's IntermediateStep (property surface only)."""

    event_type: Any
    name: Optional[str] = None
    usage_info: Optional[FakeUsageInfo] = None
    UUID: Optional[str] = "uuid-1"
    event_timestamp: Optional[float] = None
    span_event_timestamp: Optional[float] = None


def make_client(handler) -> Silvanexum:
    transport = httpx.MockTransport(handler)
    return Silvanexum(
        api_key="sx_test_123",
        base_url=BASE,
        http_client=httpx.Client(transport=transport),
        max_retries=0,
    )


def llm_end(model: str, usage: FakeTokenUsage, uuid: str = "uuid-1") -> FakeStep:
    return FakeStep(
        event_type=IntermediateStepType.LLM_END,
        name=model,
        usage_info=FakeUsageInfo(token_usage=usage),
        UUID=uuid,
    )


async def _run(exporter: SilvanexumExporter, items: List[FakeStep]) -> None:
    for item in items:
        await exporter.export_processed(item)


# --------------------------------------------------------------------------- #
# Usage mapping end-to-end (event reaches the wire with the right shape).
# --------------------------------------------------------------------------- #
async def test_llm_end_reports_mapped_usage_and_attribution():
    seen: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.url.path, json.loads(request.content or b"{}")))
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0.4})

    sx = make_client(handler)
    exporter = SilvanexumExporter(client=sx, agent="matcher", customer="acme", batch_size=1)
    await _run(exporter, [llm_end("nvidia/nemotron-3-super-120b-a12b", FakeTokenUsage(1500, 400, 1000, 100))])

    path, body = seen[0]
    assert path == "/meter/events"
    ev = body["events"][0]
    assert ev["provider"] == "nvidia"
    assert ev["model"] == "nvidia/nemotron-3-super-120b-a12b"
    assert ev["inputTokens"] == 1500 and ev["outputTokens"] == 500 and ev["cacheReadTokens"] == 1000
    assert ev["agent"] == "matcher" and ev["customer"] == "acme"
    assert ev["status"] == "success"


# --------------------------------------------------------------------------- #
# Batching: nothing sent until the batch fills, then one call with all events;
# the rest flush on shutdown.
# --------------------------------------------------------------------------- #
async def test_events_are_batched_and_flushed_on_threshold_and_shutdown():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["events"])
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    # batch_size=3, interval off so only the threshold / shutdown trigger flushes.
    exporter = SilvanexumExporter(client=sx, agent="a", batch_size=3, flush_interval_s=0)

    await _run(exporter, [llm_end("gpt-4o", FakeTokenUsage(1, 1), uuid=f"u{i}") for i in range(2)])
    assert calls == []  # below threshold -> buffered, nothing sent

    await _run(exporter, [llm_end("gpt-4o", FakeTokenUsage(1, 1), uuid="u2")])
    assert len(calls) == 1 and len(calls[0]) == 3  # threshold hit -> one batched call

    # A 4th event buffers; shutdown flushes it.
    await _run(exporter, [llm_end("gpt-4o", FakeTokenUsage(1, 1), uuid="u3")])
    assert len(calls) == 1
    await exporter._cleanup()
    assert len(calls) == 2 and len(calls[1]) == 1


# --------------------------------------------------------------------------- #
# Budget block path: enforce_budget calls /meter/check on LLM_START. A denial is
# flagged + logged, but (correctly for a telemetry exporter) does NOT abort.
# --------------------------------------------------------------------------- #
async def test_enforce_budget_flags_block_on_llm_start():
    paths: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        paths.append(request.url.path)
        if request.url.path == "/meter/check":
            return httpx.Response(402, json={"allowed": False, "message": "Budget \"cap\" is exhausted"})
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    exporter = SilvanexumExporter(client=sx, agent="a", enforce_budget=True, batch_size=1)

    start = FakeStep(event_type=IntermediateStepType.LLM_START, name="gpt-4o", UUID="call-1")
    await exporter.export_processed(start)

    assert "/meter/check" in paths
    assert exporter.blocked_calls == ["call-1"]


async def test_no_budget_check_when_enforcement_is_off():
    paths: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        paths.append(request.url.path)
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    exporter = SilvanexumExporter(client=sx, agent="a", enforce_budget=False, batch_size=1)
    await exporter.export_processed(FakeStep(event_type=IntermediateStepType.LLM_START, name="gpt-4o"))
    assert paths == []  # no check call made


# --------------------------------------------------------------------------- #
# Silent failure: Silvanexum down (5xx / connection error) must never raise out
# of the exporter — the user's workflow keeps running.
# --------------------------------------------------------------------------- #
async def test_reporting_failure_is_swallowed():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "boom"})

    sx = make_client(handler)
    exporter = SilvanexumExporter(client=sx, agent="a", batch_size=1)
    # Must not raise.
    await _run(exporter, [llm_end("gpt-4o", FakeTokenUsage(1, 1))])


async def test_check_failure_allows_the_call_and_does_not_raise():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/meter/check":
            return httpx.Response(503, json={"error": "unavailable"})
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    exporter = SilvanexumExporter(client=sx, agent="a", enforce_budget=True, batch_size=1)
    # A failed check must not block or raise; nothing is flagged.
    await exporter.export_processed(FakeStep(event_type=IntermediateStepType.LLM_START, name="gpt-4o"))
    assert exporter.blocked_calls == []


async def test_a_bad_event_never_breaks_export():
    sx = make_client(lambda r: httpx.Response(200, json={}))
    exporter = SilvanexumExporter(client=sx, agent="a", batch_size=1)

    class Explosive:
        @property
        def event_type(self):  # noqa: ANN202
            raise RuntimeError("corrupt event")

    # Swallowed, not raised.
    await exporter.export_processed(Explosive())


# --------------------------------------------------------------------------- #
# Disabled mode: with no client (e.g. missing API key) the exporter must run as
# a no-op that drops events, never raising — so a misconfig can't break the agent.
# --------------------------------------------------------------------------- #
async def test_disabled_exporter_drops_events_without_raising():
    exporter = SilvanexumExporter(client=None, agent="a", enforce_budget=True, batch_size=1)
    # LLM_END + LLM_START + shutdown: all no-ops, no network, no exception.
    await _run(exporter, [llm_end("gpt-4o", FakeTokenUsage(1, 1))])
    await exporter.export_processed(FakeStep(event_type=IntermediateStepType.LLM_START, name="gpt-4o"))
    await exporter._cleanup()
    assert exporter.blocked_calls == []


# --------------------------------------------------------------------------- #
# Failed LLM calls: an LLM_END with no usage_info is recorded as an error with
# zero tokens, so error rates surface instead of the call vanishing.
# --------------------------------------------------------------------------- #
async def test_llm_end_without_usage_is_recorded_as_error():
    seen: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content)["events"][0])
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    exporter = SilvanexumExporter(client=sx, agent="a", batch_size=1)
    # LLM_END with usage_info=None (a failed call).
    await exporter.export_processed(
        FakeStep(event_type=IntermediateStepType.LLM_END, name="gpt-4o", usage_info=None)
    )
    ev = seen[0]
    assert ev["status"] == "error"
    assert ev["inputTokens"] == 0 and ev["outputTokens"] == 0


# --------------------------------------------------------------------------- #
# Background flush: a quiet workflow (no further events) still reports, because
# the periodic flusher fires on flush_interval_s rather than waiting for the
# next LLM_END or shutdown.
# --------------------------------------------------------------------------- #
async def test_background_flush_reports_without_further_events():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["events"])
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    # Big batch_size so the threshold never triggers; short interval so the
    # background task flushes on its own.
    exporter = SilvanexumExporter(client=sx, agent="a", batch_size=1000, flush_interval_s=0.05)
    await exporter.export_processed(llm_end("gpt-4o", FakeTokenUsage(1, 1)))
    assert calls == []  # buffered; threshold not hit, no further events

    await asyncio.sleep(0.2)  # let the background flusher run
    assert len(calls) == 1 and len(calls[0]) == 1

    await exporter._cleanup()  # cancels the task cleanly


# --------------------------------------------------------------------------- #
# Non-blocking I/O: a slow Silvanexum must not freeze the event loop. The SDK
# call is synchronous, so the exporter offloads it with asyncio.to_thread; while
# a flush is in flight the loop must keep running other coroutines.
# --------------------------------------------------------------------------- #
async def test_export_does_not_block_the_event_loop():
    import time as _time

    def slow_handler(request: httpx.Request) -> httpx.Response:
        _time.sleep(0.5)  # simulate a slow Silvanexum (blocking)
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(slow_handler)
    exporter = SilvanexumExporter(client=sx, agent="a", batch_size=1)

    ticks = 0

    async def ticker():
        nonlocal ticks
        for _ in range(10):
            await asyncio.sleep(0.02)
            ticks += 1

    # Run the (flushing) export concurrently with the ticker. If export_processed
    # blocked the loop, the ticker couldn't advance until the 0.5s call returned.
    await asyncio.gather(
        exporter.export_processed(llm_end("gpt-4o", FakeTokenUsage(1, 1))),
        ticker(),
    )
    # The ticker made real progress during the slow blocking call.
    assert ticks >= 5


async def test_registration_without_api_key_yields_a_disabled_exporter(monkeypatch):
    """The @register_telemetry_exporter function must not raise when no key is
    set; it yields a disabled exporter instead of letting Silvanexum() throw."""
    monkeypatch.delenv("SILVANEXUM_API_KEY", raising=False)
    from silvanexum_nat.register import SilvanexumTelemetryExporter, silvanexum_telemetry_exporter

    cfg = SilvanexumTelemetryExporter(agent="a")  # no api_key, no env var
    # register_telemetry_exporter wraps the async generator as an async context
    # manager, which is how NAT consumes it; entering it must not raise.
    async with silvanexum_telemetry_exporter(cfg, builder=object()) as exporter:
        assert exporter._enabled is False
        await exporter.export_processed(llm_end("gpt-4o", FakeTokenUsage(1, 1)))  # no-op


# --------------------------------------------------------------------------- #
# Per-run isolation: NAT gives each concurrent workflow run a shallow copy of
# the exporter. The copies must not share the buffer, or one run's flush sends
# the other's events and the other run then sends them again.
# --------------------------------------------------------------------------- #
async def test_isolated_instances_do_not_share_the_buffer():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["events"])
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    base = SilvanexumExporter(client=sx, agent="a", batch_size=1000, flush_interval_s=0)
    run_a = base.create_isolated_instance(None)
    run_b = base.create_isolated_instance(None)

    await run_a.export_processed(llm_end("gpt-4o", FakeTokenUsage(1, 1), uuid="a1"))
    await run_b.export_processed(llm_end("gpt-4o", FakeTokenUsage(2, 2), uuid="b1"))
    await run_a._cleanup()
    await run_b._cleanup()

    assert [len(batch) for batch in calls] == [1, 1]
    assert calls[0][0]["inputTokens"] == 1 and calls[1][0]["inputTokens"] == 2
    assert base._buffer == []
