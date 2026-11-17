"""Pure mapping + provider-inference tests (no ``nat`` install required)."""
from __future__ import annotations

from silvanexum_nat._mapping import build_event, infer_provider, map_token_usage


class _TokenUsage:
    """Stand-in for nat's TokenUsageBaseModel (duck-typed via model_dump)."""

    def __init__(self, **fields: int) -> None:
        self._fields = fields

    def model_dump(self) -> dict:
        return dict(self._fields)


def test_map_token_usage_folds_reasoning_into_output_and_reads_cache():
    usage = _TokenUsage(
        prompt_tokens=1500,
        completion_tokens=400,
        reasoning_tokens=100,
        cached_tokens=1000,
        total_tokens=2000,
    )
    assert map_token_usage(usage) == {
        "inputTokens": 1500,
        "outputTokens": 500,  # 400 completion + 100 reasoning
        "cacheReadTokens": 1000,
        "cacheWriteTokens": 0,
    }


def test_map_token_usage_accepts_plain_mapping_and_handles_missing_fields():
    assert map_token_usage({"prompt_tokens": 10, "completion_tokens": 3}) == {
        "inputTokens": 10,
        "outputTokens": 3,
        "cacheReadTokens": 0,
        "cacheWriteTokens": 0,
    }


def test_map_token_usage_is_defensive_about_none_and_garbage():
    assert map_token_usage(None) == {
        "inputTokens": 0,
        "outputTokens": 0,
        "cacheReadTokens": 0,
        "cacheWriteTokens": 0,
    }
    assert map_token_usage({"prompt_tokens": "oops", "completion_tokens": -5})["inputTokens"] == 0
    # negative clamps to 0
    assert map_token_usage({"completion_tokens": -5})["outputTokens"] == 0


def test_infer_provider_from_model_name_markers():
    assert infer_provider("nvidia/nemotron-3-super-120b-a12b") == "nvidia"
    assert infer_provider("meta/llama-3.1-8b-instruct") == "nvidia"
    assert infer_provider("gpt-4o-mini") == "openai"
    assert infer_provider("o3-mini") == "openai"
    assert infer_provider("claude-sonnet-4-5") == "anthropic"
    assert infer_provider("gemini-2.5-flash") == "google"


def test_infer_provider_self_hosted_nim_requires_an_explicit_override():
    # The exporter can't see the LLM's base_url, so a self-hosted NIM must be
    # pinned via `provider: nim`; without it, a NIM model name reads as hosted.
    assert infer_provider("meta/llama-3.1-8b-instruct", override="nim") == "nim"
    assert infer_provider("meta/llama-3.1-8b-instruct") == "nvidia"


def test_infer_provider_override_wins_and_is_validated():
    assert infer_provider("gpt-4o", override="nvidia") == "nvidia"
    assert infer_provider("gpt-4o", override="NIM") == "nim"
    # An invalid override is ignored, falling back to name inference.
    assert infer_provider("gpt-4o", override="bogus") == "openai"


def test_infer_provider_falls_back_to_other():
    assert infer_provider("some-unknown-model") == "other"
    assert infer_provider(None) == "other"
    assert infer_provider("") == "other"


def test_infer_provider_does_not_claim_bare_open_models_as_nvidia():
    # A bare open-model name (no nvidia/ or meta/ org prefix) is ambiguous — it
    # may be served by a non-NVIDIA host — so it must NOT infer nvidia.
    assert infer_provider("llama-3.1-8b-instruct") == "other"
    assert infer_provider("mixtral-8x7b") == "other"
    assert infer_provider("mistralai/Mistral-7B") == "other"
    # Clear NVIDIA catalog names still resolve.
    assert infer_provider("nvidia/nemotron-3-super-120b-a12b") == "nvidia"
    assert infer_provider("meta/llama-3.1-8b-instruct") == "nvidia"
    assert infer_provider("some-nemotron-variant") == "nvidia"


def test_build_event_shapes_camelcase_and_drops_none():
    event = build_event(
        provider="nvidia",
        model="nvidia/nemotron-3-super-120b-a12b",
        token_usage={"prompt_tokens": 100, "completion_tokens": 20},
        latency_ms=1840,
        agent="matcher",
        customer="acme",
        trace_id="run_abc",
    )
    assert event == {
        "provider": "nvidia",
        "model": "nvidia/nemotron-3-super-120b-a12b",
        "inputTokens": 100,
        "outputTokens": 20,
        "cacheReadTokens": 0,
        "cacheWriteTokens": 0,
        "latencyMs": 1840,
        "status": "success",
        "agent": "matcher",
        "customer": "acme",
        "traceId": "run_abc",
    }
    # `customer`/`traceId`/`occurredAt` omitted when None.
    lean = build_event(provider="other", model="x", token_usage=None)
    assert "customer" not in lean and "traceId" not in lean and "occurredAt" not in lean
    assert lean["status"] == "success" and lean["latencyMs"] == 0
