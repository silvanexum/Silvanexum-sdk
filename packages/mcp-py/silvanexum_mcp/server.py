"""
Silvanexum MCP server.

Exposes proof-ranked agent discovery, signed runs, reputation, and
credit-metered execution as Model Context Protocol tools, so any MCP host
(Claude Desktop, Claude Code, Cursor, Windsurf, …) can use Silvanexum natively.

    uvx silvanexum-mcp        (with SILVANEXUM_API_KEY in the environment)

Auth: a scoped API key via SILVANEXUM_API_KEY. Grant ``read``+``run`` — never
``pay`` by default. Every run_agent result links a signed, replayable trace.
"""
from __future__ import annotations

import os
import sys
from importlib.metadata import PackageNotFoundError, version as _pkg_version
from typing import Any, Optional

from mcp.server.fastmcp import FastMCP

from silvanexum import Silvanexum

mcp = FastMCP("silvanexum")
# Report OUR package version in the initialize handshake (the lowlevel server
# otherwise defaults to the `mcp` library's version — testlab issue S3).
try:
    mcp._mcp_server.version = _pkg_version("silvanexum-mcp")
except PackageNotFoundError:  # running from a source tree
    mcp._mcp_server.version = "0.0.0-dev"

_client: Optional[Silvanexum] = None
_WEB = os.environ.get("SILVANEXUM_WEB_URL", "https://silvanexum.com")

SIGNUP_URL = "https://silvanexum.com/signup"
# No key -> sandbox: tools return marked sample data instead of the client
# failing, so the server is usable on first run before signup.
SANDBOX = not os.environ.get("SILVANEXUM_API_KEY")
_NOTE = (
    "SANDBOX - sample data. Get a free key (read+run) for your own agents "
    f"& live spend: {SIGNUP_URL}"
)


def _mark(d: dict) -> dict:
    """Tag a sample payload as sandbox data."""
    return {"sandbox": True, "note": _NOTE, **d}


def _g(obj: Any, key: str, default: Any = None) -> Any:
    """Field access that works for pydantic models AND plain dicts — the SDK's
    loosely-typed blocks (proof, pricing) arrive as either (testlab issue S1)."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _sx() -> Silvanexum:
    """Lazily build the client so tools register even without a key set."""
    global _client
    if _client is None:
        _client = Silvanexum(
            api_key=os.environ.get("SILVANEXUM_API_KEY"),
            base_url=os.environ.get("SILVANEXUM_BASE_URL"),
        )
    return _client


@mcp.tool()
def search_agents(
    q: Optional[str] = None,
    sort: Optional[str] = None,
    category: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Search the marketplace for agents, ranked by PROVEN OUTCOMES (real run
    corpus + reputation), not stars. `sort` is one of proof|recent|price."""
    if SANDBOX:
        return [
            _mark({"listingId": "lst_demo_contract", "agentId": "agt_demo_contract", "title": "Contract Review Analyst", "category": "legal", "proofScore": 0.92, "trustScore": 0.89, "totalRuns": 1284, "confidence": "high", "pricing": "per_run"}),
            _mark({"listingId": "lst_demo_support", "agentId": "agt_demo_support", "title": "Tier-1 Support Triage", "category": "support", "proofScore": 0.81, "trustScore": 0.77, "totalRuns": 452, "confidence": "medium", "pricing": "free"}),
        ]
    results = _sx().marketplace.search(q=q, sort=sort or "proof", category=category)
    return [
        {
            "listingId": _g(r, "id"),
            "agentId": _g(r, "agentId"),
            "title": _g(r, "title"),
            "category": _g(r, "category"),
            "proofScore": _g(r, "proofScore"),
            "trustScore": _g(_g(r, "proof"), "trustScore"),
            "totalRuns": _g(_g(r, "proof"), "totalRuns", 0),
            "confidence": _g(_g(r, "proof"), "confidence", "none"),
            "pricing": _g(_g(r, "pricing"), "model", "free"),
        }
        for r in results
    ]


@mcp.tool()
def get_agent(agentId: str) -> dict[str, Any]:
    """Fetch an agent's configuration and earned reputation by id."""
    if SANDBOX:
        return _mark({"id": agentId, "name": "Contract Review Analyst", "description": "Extracts obligations, dates, and risk flags from commercial contracts.", "visibility": "public", "reputation": {"trustScore": 0.89, "successRate": 0.94, "totalRuns": 1284, "confidence": "high"}})
    return _sx().agents.get(agentId).model_dump()


@mcp.tool()
def get_reputation(agentId: str) -> dict[str, Any]:
    """Get an agent's earned reputation — volume-aware trust score, success
    rate, and confidence, derived from signed runs."""
    if SANDBOX:
        return _mark({"agentId": agentId, "trustScore": 0.89, "successRate": 0.94, "totalRuns": 1284, "confidence": "high"})
    agent = _sx().agents.get(agentId)
    rep = agent.reputation
    if rep is None:
        return {"note": "No reputation yet — the agent has no signed runs."}
    return rep.model_dump()


@mcp.tool()
def run_agent(agentId: str, prompt: str) -> dict[str, Any]:
    """Run an agent on a prompt. The run is captured, secret-scrubbed, and
    cryptographically signed. Returns the answer plus a replayable, signed trace
    URL. Requires the `run` scope."""
    if SANDBOX:
        return _mark({"runId": "run_demo_9f2a", "status": "success", "output": "[sample output] Sandbox canned response; a real run is captured, secret-scrubbed, and signed.", "latencyMs": 1840, "signed": True, "contentHash": "sha256:demo-c0ffee", "replayUrl": "https://silvanexum.com/runs/run_demo_9f2a"})
    run = _sx().runs.create(agent_id=agentId, prompt=prompt)
    return {
        "runId": run.id,
        "status": run.status,
        "output": run.output,
        "latencyMs": run.latencyMs,
        "signed": bool(run.signature),
        "contentHash": run.contentHash,
        "replayUrl": _sx().runs.share_url(run.id, _WEB),
    }


@mcp.tool()
def get_run(runId: str) -> dict[str, Any]:
    """Fetch a run's full signed trace (the step-by-step model/tool/agent
    timeline) by id."""
    if SANDBOX:
        return _mark({"runId": runId, "status": "success", "output": "[sample output] The signed trace of a completed run.", "signed": True, "contentHash": "sha256:demo-c0ffee", "trace": [{"step": 1, "type": "model", "model": "gpt-4o-mini"}], "replayUrl": f"https://silvanexum.com/runs/{runId}"})
    run = _sx().runs.get(runId)
    return {
        "runId": run.id,
        "status": run.status,
        "output": run.output,
        "signed": bool(run.signature),
        "contentHash": run.contentHash,
        "trace": [s.model_dump() for s in run.trace],
        "replayUrl": _sx().runs.share_url(run.id, _WEB),
    }


@mcp.tool()
def deploy_template(templateId: str, params: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    """Deploy a 1-click vertical agent template into a ready, signed agent (M11).
    Note: template endpoints may be 'planned' / not yet live on a deployment."""
    if SANDBOX:
        return _mark({"id": "agt_demo_from_template", "name": "My Deployed Agent", "fromTemplate": templateId, "visibility": "private"})
    agent = _sx().templates.deploy(templateId, params=params or {})
    return agent.model_dump()


@mcp.tool()
def wallet_balance() -> dict[str, Any]:
    """Get the org's credit balance."""
    if SANDBOX:
        return _mark({"balanceCredits": "2500.00", "pendingEarningsCredits": "0.00", "creditValueUsd": 0.001})
    w = _sx().wallet.get()
    return {
        "balanceCredits": w.balanceCredits,
        "pendingEarningsCredits": w.pendingEarningsCredits,
        "creditValueUsd": w.creditValueUsd,
    }


@mcp.tool()
def get_spending(
    groupBy: Optional[str] = None,
    since: Optional[str] = None,
    to: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Agent FinOps — cost attribution. Spend rolled up by a dimension
    (agent|project|model|provider) over a window, from real run telemetry + the
    mesh ledger. Read-only — answers 'which agent/model burned the budget?'.
    `since` accepts relative ('-7d', '-24h') or ISO; default last 30 days."""
    if SANDBOX:
        return [
            _mark({"key": "Contract Review Analyst", "spentCredits": "1420.50", "runs": 612}),
            _mark({"key": "Tier-1 Support Triage", "spentCredits": "388.00", "runs": 240}),
        ]
    rows = _sx().spending.summary(group_by=groupBy, from_=since, to=to)
    return [r.model_dump() for r in rows]


@mcp.tool()
def list_budgets(scopeType: Optional[str] = None) -> list[dict[str, Any]]:
    """Agent FinOps — list spend caps (budgets), each with its live computed
    spend, remaining, and state (ok|warn|exceeded) for the current period."""
    if SANDBOX:
        return [_mark({"id": "bdg_demo_prod", "name": "Prod monthly cap", "scopeType": "org", "periodType": "monthly", "limitCredits": "5000.00", "spentCredits": "1808.50", "remainingCredits": "3191.50", "usedPct": 36, "state": "ok", "enforcement": "block"})]
    return [b.model_dump() for b in _sx().budgets.list(scope_type=scopeType)]


@mcp.tool()
def create_budget(
    name: str,
    scopeType: str,
    periodType: str,
    limitCredits: float,
    scopeId: Optional[str] = None,
    enforcement: Optional[str] = None,
    alertThresholdPct: Optional[int] = None,
) -> dict[str, Any]:
    """Agent FinOps — create a spend cap over an org/project/agent for a period.
    With enforcement 'block', a run or mesh hop that would breach it is rejected
    server-side (HTTP 402). scope_id is required unless scope_type is 'org'.
    Requires a key with write scope."""
    if SANDBOX:
        return _mark({"id": "bdg_demo_new", "name": name, "scopeType": scopeType, "periodType": periodType, "limitCredits": f"{limitCredits:.2f}", "spentCredits": "0.00", "state": "ok"})
    budget = _sx().budgets.create(
        name=name,
        scope_type=scopeType,
        period_type=periodType,
        limit_credits=limitCredits,
        scope_id=scopeId,
        enforcement=enforcement,
        alert_threshold_pct=alertThresholdPct,
    )
    return budget.model_dump()


def _fire_activation(mode: str) -> None:
    """Anonymous first-use activation ping (fire-and-forget, best-effort).
    No PII; honors DO_NOT_TRACK / SILVANEXUM_TELEMETRY=0."""
    if os.environ.get("DO_NOT_TRACK") in ("1", "true"):
        return
    if os.environ.get("SILVANEXUM_TELEMETRY") in ("0", "false"):
        return
    try:
        import json
        import threading
        import urllib.request
        import uuid
        from pathlib import Path

        d = Path.home() / ".silvanexum"
        f = d / "device-id"
        try:
            device_id = f.read_text().strip()
        except Exception:
            device_id = ""
        if not device_id:
            try:
                d.mkdir(parents=True, exist_ok=True)
                device_id = str(uuid.uuid4())
                f.write_text(device_id)
            except Exception:
                device_id = "unknown"

        try:
            ver = _pkg_version("silvanexum-mcp")
        except PackageNotFoundError:
            ver = "0.0.0-dev"
        base = os.environ.get("SILVANEXUM_BASE_URL", "https://api.silvanexum.com").rstrip("/")
        payload = json.dumps(
            {"surface": "mcp-py", "version": ver, "mode": mode, "deviceId": device_id}
        ).encode()

        def _send() -> None:
            try:
                req = urllib.request.Request(
                    base + "/events/activation",
                    data=payload,
                    headers={"content-type": "application/json"},
                    method="POST",
                )
                urllib.request.urlopen(req, timeout=3).read()
            except Exception:
                pass

        threading.Thread(target=_send, daemon=True).start()
    except Exception:
        pass


def main() -> None:
    if SANDBOX:
        print(
            "silvanexum-mcp ready - SANDBOX MODE (no SILVANEXUM_API_KEY set).\n"
            "  Tools return sample data so you can try them right now.\n"
            "  Get a free key (read+run) to use your own agents & live spend:\n"
            f"    {SIGNUP_URL}\n"
            "  Then set SILVANEXUM_API_KEY and restart.",
            file=sys.stderr,
        )
    _fire_activation("sandbox" if SANDBOX else "keyed")
    mcp.run()  # stdio transport by default


if __name__ == "__main__":
    main()
