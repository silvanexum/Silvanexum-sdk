"""Meter + guardrail tests against a mocked Silvanexum HTTP API.

These drive the real :class:`SilvanexumMeter` with plain ATOF event dicts (no
Relay SDK needed — the meter/guardrail take dicts), against an ``httpx``
MockTransport, the same pattern the SDK's own tests use.
"""
from __future__ import annotations

import asyncio
import json
import time

import httpx
from silvanexum import Silvanexum

from silvanexum_relay.plugin import SilvanexumConfig, SilvanexumMeter

BASE = "https://api.test"


def make_meter(handler, **overrides) -> SilvanexumMeter:
    cfg_raw = {"api_key": "sx_test_123", "base_url": BASE, **overrides}
    meter = SilvanexumMeter(SilvanexumConfig(cfg_raw))
    # Swap the real client for one wired to the mock transport.
    transport = httpx.MockTransport(handler)
    meter._client = Silvanexum(
        api_key="sx_test_123", base_url=BASE, http_client=httpx.Client(transport=transport), max_retries=0
    )
    meter.enabled = True
    return meter


def llm_end(model="gpt-4o", usage=None, uuid="s1", parent="run-1", ts=5.0, metadata=None):
    profile = {"model_name": model}
    if usage is not None:
        profile["annotated_response"] = {"usage": usage}
    return {
        "kind": "scope",
        "category": "llm",
        "scope_category": "end",
        "uuid": uuid,
        "parent_uuid": parent,
        "timestamp": ts,
        "metadata": metadata or {},
        "category_profile": profile,
    }


def llm_start(uuid="s1", ts=4.5):
    return {"kind": "scope", "category": "llm", "scope_category": "start", "uuid": uuid, "timestamp": ts}


# --- metering -------------------------------------------------------------- #
async def test_llm_end_meters_mapped_usage_and_attribution():
    seen: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.url.path, json.loads(request.content or b"{}")))
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0.3})

    meter = make_meter(handler, batch_size=1, customer="acme", agent="matcher")
    await meter.on_event(llm_start(uuid="s1", ts=4.0))
    await meter.on_event(
        llm_end("nvidia/nemotron-3-super", {"prompt_tokens": 100, "completion_tokens": 20, "cache_read_tokens": 10}, uuid="s1", ts=5.0)
    )
    path, body = seen[0]
    assert path == "/meter/events"
    ev = body["events"][0]
    assert ev["provider"] == "nvidia" and ev["model"] == "nvidia/nemotron-3-super"
    assert ev["inputTokens"] == 100 and ev["outputTokens"] == 20 and ev["cacheReadTokens"] == 10
    assert ev["agent"] == "matcher" and ev["customer"] == "acme" and ev["traceId"] == "run-1"
    assert ev["status"] == "success" and ev["latencyMs"] == 1000
    await meter.aclose()


async def test_llm_end_without_usage_is_a_success_with_zero_tokens():
    # Providers often omit usage on streams; that is not a failed call.
    seen: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content)["events"][0])
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(handler, batch_size=1)
    await meter.on_event(llm_end("gpt-4o", usage=None))
    assert seen[0]["status"] == "success" and seen[0]["inputTokens"] == 0
    await meter.aclose()


async def test_llm_end_marked_error_by_relay_is_recorded_as_error():
    seen: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content)["events"][0])
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(handler, batch_size=1)
    await meter.on_event(llm_end("gpt-4o", usage=None, metadata={"otel.status_code": "ERROR"}))
    assert seen[0]["status"] == "error"
    await meter.aclose()


# Shapes captured from a live nemo-relay 0.11.0 gateway (RFC 3339 timestamps,
# request headers + provider body on the LLM start event).
def relay_llm_start(uuid="s9", headers=None):
    return {
        "kind": "scope", "category": "llm", "scope_category": "start", "uuid": uuid,
        "parent_uuid": "turn-1", "timestamp": "2026-10-29T17:59:08.261872700+00:00",
        "data": {"headers": headers or {}, "content": {"model": "gpt-4o-mini", "messages": []}},
        "metadata": {"agent_kind": "gateway"},
    }


def relay_llm_end(uuid="s9"):
    return {
        "kind": "scope", "category": "llm", "scope_category": "end", "uuid": uuid,
        "parent_uuid": "turn-1", "timestamp": "2026-10-29T17:59:08.267273600+00:00",
        "metadata": {"agent_kind": "gateway", "otel.status_code": "OK"},
        "category_profile": {
            "model_name": "gpt-4o-mini",
            "annotated_response": {"usage": {"prompt_tokens": 12, "completion_tokens": 8, "total_tokens": 20}},
        },
    }


async def test_live_relay_shapes_give_latency_and_header_attribution():
    seen: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content)["events"][0])
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(handler, batch_size=1, agent="default-agent")
    await meter.on_event(relay_llm_start(headers={"X-Silvanexum-Customer": "acme", "x-silvanexum-agent": "router"}))
    await meter.on_event(relay_llm_end())
    ev = seen[0]
    assert ev["latencyMs"] == 5  # 08.2618727 -> 08.2672736
    assert ev["customer"] == "acme" and ev["agent"] == "router"  # headers beat config
    assert ev["inputTokens"] == 12 and ev["outputTokens"] == 8 and ev["traceId"] == "turn-1"
    await meter.aclose()


async def test_pending_starts_are_capped(monkeypatch):
    from silvanexum_relay import plugin as plugin_mod

    monkeypatch.setattr(plugin_mod, "_MAX_PENDING_STARTS", 3)
    meter = make_meter(lambda r: httpx.Response(200, json={}), batch_size=100)
    for i in range(10):
        await meter.on_event(relay_llm_start(uuid=f"u{i}"))
    assert len(meter._pending_starts) == 3 and "u9" in meter._pending_starts
    await meter.aclose()


async def test_batching_threshold_and_shutdown_flush():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["events"])
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(handler, batch_size=3, flush_interval_s=0)
    for i in range(2):
        await meter.on_event(llm_end(usage={"prompt_tokens": 1, "completion_tokens": 1}, uuid=f"u{i}"))
    assert calls == []  # below threshold
    await meter.on_event(llm_end(usage={"prompt_tokens": 1, "completion_tokens": 1}, uuid="u2"))
    assert len(calls) == 1 and len(calls[0]) == 3
    await meter.on_event(llm_end(usage={"prompt_tokens": 1, "completion_tokens": 1}, uuid="u3"))
    await meter.aclose()  # drains the 4th
    assert len(calls) == 2 and len(calls[1]) == 1


async def test_background_flush_on_quiet_workflow():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["events"])
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(handler, batch_size=1000, flush_interval_s=0.05)
    await meter.on_event(llm_end(usage={"prompt_tokens": 1, "completion_tokens": 1}))
    assert calls == []
    await asyncio.sleep(0.2)
    assert len(calls) == 1
    await meter.aclose()


# --- budget guardrail ------------------------------------------------------ #
async def test_guardrail_allows_when_budget_ok():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/meter/check"
        return httpx.Response(200, json={"allowed": True})

    meter = make_meter(handler, enforce_budget=True)
    assert await meter.check_allowed({"model": "gpt-4o"}) is None
    await meter.aclose()


async def test_guardrail_rejects_with_message_when_blocked():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(402, json={"allowed": False, "message": "Budget \"cap\" exhausted"})

    meter = make_meter(handler, enforce_budget=True)
    msg = await meter.check_allowed({"model": "gpt-4o"})
    assert msg == 'Budget "cap" exhausted'
    await meter.aclose()


async def test_guardrail_fail_open_allows_when_silvanexum_down():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "unavailable"})

    meter = make_meter(handler, enforce_budget=True, fail_open=True)
    assert await meter.check_allowed({"model": "gpt-4o"}) is None  # allowed despite failure
    await meter.aclose()


async def test_guardrail_fail_closed_blocks_when_silvanexum_down():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "unavailable"})

    meter = make_meter(handler, enforce_budget=True, fail_open=False)
    msg = await meter.check_allowed({"model": "gpt-4o"})
    assert msg and "fail_open" in msg
    await meter.aclose()


async def test_guardrail_uses_ttl_cache():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.path)
        return httpx.Response(402, json={"allowed": False, "message": "nope"})

    meter = make_meter(handler, enforce_budget=True, budget_cache_ttl_s=60.0)
    assert await meter.check_allowed({"model": "gpt-4o"}) == "nope"
    assert await meter.check_allowed({"model": "gpt-4o"}) == "nope"  # served from cache
    assert len(calls) == 1  # only one real check


# --- robustness ------------------------------------------------------------ #
async def test_disabled_meter_no_key_drops_and_never_blocks(monkeypatch):
    monkeypatch.delenv("SILVANEXUM_API_KEY", raising=False)
    meter = SilvanexumMeter(SilvanexumConfig({"enforce_budget": True}))  # no key
    assert meter.enabled is False
    await meter.on_event(llm_end(usage={"prompt_tokens": 1, "completion_tokens": 1}))  # no-op
    assert await meter.check_allowed({"model": "gpt-4o"}) is None  # never blocks
    await meter.aclose()


async def test_concurrent_runs_do_not_cross_bill():
    calls: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content)["events"])
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(handler, batch_size=1)
    # Two runs with distinct traces fire concurrently.
    await asyncio.gather(
        meter.on_event(llm_end("gpt-4o", {"prompt_tokens": 1, "completion_tokens": 1}, uuid="a", parent="runA")),
        meter.on_event(llm_end("claude-sonnet-5", {"prompt_tokens": 2, "completion_tokens": 2}, uuid="b", parent="runB")),
    )
    traces = sorted(ev["traceId"] for batch in calls for ev in batch)
    assert traces == ["runA", "runB"]  # both billed, each to its own trace, once
    await meter.aclose()


async def test_slow_silvanexum_does_not_block_the_loop():
    def slow_handler(request: httpx.Request) -> httpx.Response:
        time.sleep(0.5)
        return httpx.Response(200, json={"recorded": 1})

    meter = make_meter(slow_handler, batch_size=1)
    ticks = 0

    async def ticker():
        nonlocal ticks
        for _ in range(10):
            await asyncio.sleep(0.02)
            ticks += 1

    await asyncio.gather(
        meter.on_event(llm_end(usage={"prompt_tokens": 1, "completion_tokens": 1})),
        ticker(),
    )
    assert ticks >= 5  # loop kept running during the 0.5s blocking call
    await meter.aclose()


async def test_a_bad_event_never_raises():
    meter = make_meter(lambda r: httpx.Response(200, json={}), batch_size=1)
    await meter.on_event("not a dict")  # ignored
    await meter.on_event({"kind": "scope", "category": "llm", "scope_category": "end"})  # no profile
    await meter.aclose()


async def test_guardrail_checks_the_customer_from_request_headers():
    bodies: list = []

    def handler(request: httpx.Request) -> httpx.Response:
        bodies.append(json.loads(request.content))
        return httpx.Response(200, json={"allowed": False, "message": "acme is over budget"})

    meter = make_meter(handler, enforce_budget=True, agent="default-agent", budget_cache_ttl_s=0)
    req = {
        "headers": {"x-silvanexum-customer": "acme"},
        "content": {"model": "nvidia/nemotron-3-super-120b-a12b", "messages": []},
    }
    assert await meter.check_allowed(req) == "acme is over budget"
    assert bodies[0] == {"agent": "default-agent", "customer": "acme", "model": "nvidia/nemotron-3-super-120b-a12b"}
    await meter.aclose()
