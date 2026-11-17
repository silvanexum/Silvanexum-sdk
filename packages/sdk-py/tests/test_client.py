"""Smoke tests for the Python SDK using a mock httpx transport."""
from __future__ import annotations

import httpx
import pytest

from silvanexum import AuthenticationError, RateLimitError, Silvanexum

BASE = "https://api.test"


def make_client(handler) -> Silvanexum:
    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(transport=transport)
    return Silvanexum(api_key="sx_test_123", base_url=BASE, http_client=http_client, max_retries=1)


def test_bearer_auth_and_envelope_unwrap():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["auth"] = request.headers.get("authorization")
        seen["url"] = str(request.url)
        return httpx.Response(200, json={"agents": [{
            "id": "a1", "ownerId": "o", "orgId": "g", "name": "Support", "description": "",
            "avatarUrl": None, "specialties": [], "config": {"provider": "anthropic", "model": "x"},
            "connectorIds": [], "agentToolIds": [], "visibility": "private", "forkedFromId": None,
            "projectId": None, "agentCardUrl": None, "externalName": None,
            "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z",
        }]})

    sx = make_client(handler)
    agents = sx.agents.list()
    assert len(agents) == 1
    assert agents[0].name == "Support"
    assert seen["auth"] == "Bearer sx_test_123"
    assert seen["url"] == f"{BASE}/agents"


def test_query_params_and_sort_default():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(200, json={"results": []})

    sx = make_client(handler)
    sx.marketplace.search(q="legal agent")
    assert "sort=proof" in captured["url"]
    assert "q=legal+agent" in captured["url"] or "q=legal%20agent" in captured["url"]


def test_idempotency_key_on_purchase():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["idem"] = request.headers.get("idempotency-key")
        return httpx.Response(200, json={
            "purchaseId": "p1", "grossCredits": "10", "builderCredits": "8",
            "takeRateCredits": "2", "ledgerTxnId": None,
            "install": {"id": "i", "listingId": "l", "agentId": "a", "source": "s", "active": True, "grantedAt": "2026-01-01T00:00:00.000Z"},
        })

    sx = make_client(handler)
    res = sx.marketplace.purchase("listing_1", "idem-abc")
    assert captured["idem"] == "idem-abc"
    assert res.purchaseId == "p1"


def test_maps_401_to_authentication_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"message": "bad key"})

    sx = make_client(handler)
    with pytest.raises(AuthenticationError) as exc:
        sx.agents.list()
    assert exc.value.status == 401
    assert exc.value.message == "bad key"


def test_retries_429_then_succeeds():
    state = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        state["n"] += 1
        if state["n"] == 1:
            return httpx.Response(429, json={"message": "slow down", "retryAfter": 0})
        return httpx.Response(200, json={"agents": []})

    sx = make_client(handler)
    assert sx.agents.list() == []
    assert state["n"] == 2


def test_gives_up_after_max_retries():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"message": "nope", "retryAfter": 0})

    sx = make_client(handler)
    with pytest.raises(RateLimitError):
        sx.agents.list()


def test_missing_api_key_raises(monkeypatch):
    monkeypatch.delenv("SILVANEXUM_API_KEY", raising=False)
    with pytest.raises(Exception, match="Missing API key"):
        Silvanexum(base_url=BASE)
