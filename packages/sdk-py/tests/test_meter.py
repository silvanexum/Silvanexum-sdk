"""SDK-only metering (sx.meter) against a mock httpx transport."""
from __future__ import annotations

import json

import httpx
import pytest

from silvanexum import BudgetExceededError, Silvanexum, usage_from_response

BASE = "https://api.test"


def make_client(handler) -> Silvanexum:
    transport = httpx.MockTransport(handler)
    return Silvanexum(api_key="sx_test_123", base_url=BASE, http_client=httpx.Client(transport=transport), max_retries=0)


def test_usage_from_response_normalizes_all_three_providers():
    assert usage_from_response("openai", {"usage": {"prompt_tokens": 900, "completion_tokens": 300, "prompt_tokens_details": {"cached_tokens": 400}}}) == {
        "inputTokens": 900, "outputTokens": 300, "cacheReadTokens": 400, "cacheWriteTokens": 0,
    }
    # Anthropic's input_tokens excludes cache tokens — they're added back.
    assert usage_from_response("anthropic", {"usage": {"input_tokens": 100, "cache_read_input_tokens": 2000, "cache_creation_input_tokens": 500, "output_tokens": 640}}) == {
        "inputTokens": 2600, "outputTokens": 640, "cacheReadTokens": 2000, "cacheWriteTokens": 500,
    }
    # Gemini: thinking tokens bill as output; snake_case (google-genai objects) works too.
    assert usage_from_response("google", {"usage_metadata": {"prompt_token_count": 1500, "candidates_token_count": 400, "thoughts_token_count": 100, "cached_content_token_count": 1000}}) == {
        "inputTokens": 1500, "outputTokens": 500, "cacheReadTokens": 1000, "cacheWriteTokens": 0,
    }


def test_usage_from_response_accepts_sdk_objects():
    class Obj:
        def model_dump(self):
            return {"usage": {"input_tokens": 5, "output_tokens": 7}}

    assert usage_from_response("anthropic", Obj())["outputTokens"] == 7


def test_track_reports_usage_latency_and_attribution():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.url.path, json.loads(request.content or b"{}")))
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0.5})

    sx = make_client(handler)
    with sx.meter.track("google", "gemini-2.5-flash", customer="acme", agent="matcher") as t:
        t.response({"usageMetadata": {"promptTokenCount": 10, "candidatesTokenCount": 3}})
    path, body = seen[0]
    assert path == "/meter/events"
    ev = body["events"][0]
    assert ev["provider"] == "google" and ev["model"] == "gemini-2.5-flash"
    assert ev["inputTokens"] == 10 and ev["outputTokens"] == 3
    assert ev["customer"] == "acme" and ev["agent"] == "matcher"
    assert ev["status"] == "success" and ev["latencyMs"] >= 0


def test_track_marks_errors_and_never_swallows_the_callers_exception():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content))
        return httpx.Response(200, json={"recorded": 1, "costCredits": 0})

    sx = make_client(handler)
    with pytest.raises(RuntimeError), sx.meter.track("openai", "gpt-4o"):
        raise RuntimeError("provider down")
    assert seen[0]["events"][0]["status"] == "error"


def test_reporting_failure_is_logged_not_raised_by_default():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "boom"})

    sx = make_client(handler)
    with sx.meter.track("openai", "gpt-4o") as t:
        t.set_usage(input_tokens=1, output_tokens=1)  # no exception escapes


def test_check_returns_verdict_and_track_check_blocks_before_the_call():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/meter/check":
            return httpx.Response(402, json={"allowed": False, "error": "budget_exceeded", "message": "Budget \"cap\" is exhausted"})
        raise AssertionError("no usage should be reported for a blocked call")

    sx = make_client(handler)
    assert sx.meter.check(customer="acme")["allowed"] is False
    ran = False
    with pytest.raises(BudgetExceededError):
        with sx.meter.track("anthropic", "claude-sonnet-5-5", check=True):
            ran = True
    assert ran is False


def test_gateway_base_urls():
    sx = make_client(lambda r: httpx.Response(200, json={}))
    assert sx.gateway.anthropic_base_url() == f"{BASE}/gateway/anthropic"
    assert sx.gateway.google_base_url() == f"{BASE}/gateway/google"
    assert sx.gateway.nvidia_base_url() == f"{BASE}/gateway/nvidia/v1"
    assert sx.gateway.nim_base_url() == f"{BASE}/gateway/nim/v1"


def test_usage_from_response_reads_nvidia_nim_like_openai():
    response = {"usage": {"prompt_tokens": 1000, "completion_tokens": 500, "total_tokens": 1500}}
    expected = {"inputTokens": 1000, "outputTokens": 500, "cacheReadTokens": 0, "cacheWriteTokens": 0}
    assert usage_from_response("nvidia", response) == expected
    assert usage_from_response("nim", response) == expected
