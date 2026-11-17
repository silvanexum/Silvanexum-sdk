"""Pure mapping + provider-inference + event-extraction tests (no Relay SDK)."""
from __future__ import annotations

from silvanexum_relay._mapping import (
    build_event,
    event_latency_ms,
    extract_attribution,
    extract_model,
    extract_model_from_request,
    extract_usage,
    infer_provider,
    is_llm_end,
    is_llm_start,
    map_usage,
)


def llm_end_event(**profile):
    return {
        "kind": "scope",
        "category": "llm",
        "scope_category": "end",
        "uuid": "scope-1",
        "parent_uuid": "run-9",
        "timestamp": 12.0,
        "metadata": {},
        "category_profile": profile,
    }


# --- usage mapping --------------------------------------------------------- #
def test_map_usage_prompt_tokens_are_cache_inclusive():
    assert map_usage(
        {"prompt_tokens": 1500, "completion_tokens": 400, "cache_read_tokens": 1000}
    ) == {
        "inputTokens": 1500,
        "outputTokens": 400,
        "cacheReadTokens": 1000,
        "cacheWriteTokens": 0,
    }


def test_map_usage_rebuilds_total_from_authoritative_split():
    # Only uncached_input_tokens + cache split present (no prompt_tokens).
    assert map_usage(
        {"uncached_input_tokens": 500, "cache_read_tokens": 1000, "cache_write_tokens": 100, "completion_tokens": 20}
    ) == {
        "inputTokens": 1600,
        "outputTokens": 20,
        "cacheReadTokens": 1000,
        "cacheWriteTokens": 100,
    }


def test_map_usage_defensive_about_none_and_garbage():
    assert map_usage(None) == {"inputTokens": 0, "outputTokens": 0, "cacheReadTokens": 0, "cacheWriteTokens": 0}
    assert map_usage({"prompt_tokens": "x", "completion_tokens": -3})["inputTokens"] == 0
    assert map_usage({"completion_tokens": -3})["outputTokens"] == 0


# --- provider inference ---------------------------------------------------- #
def test_infer_provider_nvidia_catalog_only():
    assert infer_provider("nvidia/nemotron-3-super") == "nvidia"
    assert infer_provider("meta/llama-3.1-8b-instruct") == "nvidia"
    assert infer_provider("some-nemotron") == "nvidia"
    # Bare open-model names are ambiguous -> not nvidia.
    assert infer_provider("llama-3.1-8b") == "other"
    assert infer_provider("mixtral-8x7b") == "other"


def test_infer_provider_other_families_and_fallback():
    assert infer_provider("gpt-4o-mini") == "openai"
    assert infer_provider("claude-sonnet-5") == "anthropic"
    assert infer_provider("gemini-3-pro") == "google"
    assert infer_provider("mystery") == "other"


def test_infer_provider_override_and_event_provider():
    assert infer_provider("gpt-4o", override="nim") == "nim"
    assert infer_provider("gpt-4o", override="bogus") == "openai"  # invalid override ignored
    assert infer_provider("whatever", event_provider="anthropic") == "anthropic"
    # Override beats event-provider.
    assert infer_provider("whatever", override="nvidia", event_provider="openai") == "nvidia"


# --- event helpers --------------------------------------------------------- #
def test_is_llm_end_and_start():
    assert is_llm_end(llm_end_event(model_name="x"))
    assert not is_llm_end({"kind": "scope", "category": "tool", "scope_category": "end"})
    assert is_llm_start({"kind": "scope", "category": "llm", "scope_category": "start"})
    assert not is_llm_start(llm_end_event(model_name="x"))


def test_extract_model_prefers_model_name_then_annotated():
    assert extract_model(llm_end_event(model_name="meta/llama-3.1-8b-instruct")) == "meta/llama-3.1-8b-instruct"
    assert extract_model(llm_end_event(annotated_response={"model": "gpt-4o"})) == "gpt-4o"
    assert extract_model(llm_end_event()) == "unknown"


def test_extract_usage_from_annotated_response_then_fallbacks():
    ev = llm_end_event(annotated_response={"usage": {"prompt_tokens": 7, "completion_tokens": 2}})
    assert extract_usage(ev) == {"prompt_tokens": 7, "completion_tokens": 2}
    # fallback: top-level data.usage
    ev2 = {**llm_end_event(), "data": {"usage": {"prompt_tokens": 3}}}
    assert extract_usage(ev2) == {"prompt_tokens": 3}
    assert extract_usage(llm_end_event()) == {}


def test_extract_attribution_config_wins_then_metadata_then_scope():
    ev = llm_end_event(model_name="x")
    ev["metadata"] = {"customer": "from-meta", "silvanexum_agent": "meta-agent"}
    # config overrides metadata
    assert extract_attribution(ev, customer="cfg", agent="cfg-agent") == {
        "customer": "cfg",
        "agent": "cfg-agent",
        "trace_id": "run-9",
    }
    # falls back to metadata when config is None
    assert extract_attribution(ev, customer=None, agent=None) == {
        "customer": "from-meta",
        "agent": "meta-agent",
        "trace_id": "run-9",
    }


def test_event_latency_ms_uses_start_pair():
    ev = llm_end_event(model_name="x")  # timestamp 12.0
    assert event_latency_ms(ev, start_ts=11.5) == 500
    assert event_latency_ms(ev, start_ts=None) == 0
    assert event_latency_ms(ev, start_ts=20.0) == 0  # end before start -> 0


def test_extract_model_from_request():
    assert extract_model_from_request({"model": "gpt-4o", "messages": []}) == "gpt-4o"
    assert extract_model_from_request({"body": {"model": "meta/llama-3.1-8b"}}) == "meta/llama-3.1-8b"
    assert extract_model_from_request({"temperature": 0.2}) == "unknown"
    # The shape Relay 0.11 actually passes the guardrail: {"headers", "content"}.
    live = {"headers": {"x-nemo-relay-source": "gateway"}, "content": {"model": "gpt-4o-mini", "messages": []}}
    assert extract_model_from_request(live) == "gpt-4o-mini"


def test_parse_ts_handles_relay_rfc3339_and_numbers():
    from silvanexum_relay._mapping import parse_ts

    a = parse_ts("2026-10-29T17:59:08.261872700+00:00")
    b = parse_ts("2026-10-29T17:59:08.267273600+00:00")
    assert a is not None and b is not None and round((b - a) * 1000) == 5
    assert parse_ts(4.5) == 4.5
    assert parse_ts("not a time") is None and parse_ts(None) is None and parse_ts(True) is None


def test_build_event_camelcase_and_drops_none():
    ev = build_event(
        provider="nvidia",
        model="nvidia/nemotron-3-super",
        usage={"prompt_tokens": 100, "completion_tokens": 20},
        latency_ms=1840,
        agent="a",
        customer="acme",
        trace_id="run-9",
    )
    assert ev == {
        "provider": "nvidia",
        "model": "nvidia/nemotron-3-super",
        "inputTokens": 100,
        "outputTokens": 20,
        "cacheReadTokens": 0,
        "cacheWriteTokens": 0,
        "latencyMs": 1840,
        "status": "success",
        "agent": "a",
        "customer": "acme",
        "traceId": "run-9",
    }
    lean = build_event(provider="other", model="x", usage=None)
    assert "customer" not in lean and "traceId" not in lean
