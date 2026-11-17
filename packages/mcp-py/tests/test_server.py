"""Tests for the Python MCP server (silvanexum_mcp.server).

Importing the module must register all tools without needing an API key (the
client is built lazily), and the tool surface must match the TypeScript MCP
server's ten tools. main() is guarded by __name__ == "__main__", so import is
side-effect free.
"""
import asyncio

from silvanexum_mcp import server

EXPECTED_TOOLS = {
    "search_agents",
    "get_agent",
    "get_reputation",
    "run_agent",
    "get_run",
    "deploy_template",
    "wallet_balance",
    "get_spending",
    "list_budgets",
    "create_budget",
}


def _tool_names():
    mcp = server.mcp
    # Prefer the sync tool-manager view; fall back to the async API across
    # FastMCP versions.
    mgr = getattr(mcp, "_tool_manager", None)
    if mgr is not None and hasattr(mgr, "list_tools"):
        tools = mgr.list_tools()
    else:
        tools = asyncio.run(mcp.list_tools())
    return {getattr(t, "name", None) for t in tools}


def test_all_ten_tools_registered():
    assert _tool_names() == EXPECTED_TOOLS


def test_import_needs_no_api_key(monkeypatch):
    # Import already happened above without SILVANEXUM_API_KEY; assert the module
    # exposes its callable tools regardless of environment.
    monkeypatch.delenv("SILVANEXUM_API_KEY", raising=False)
    for name in ("run_agent", "get_agent", "create_budget"):
        assert callable(getattr(server, name)), f"{name} should be importable"


def test_tool_signatures_match_contract():
    import inspect

    # run_agent(agentId, prompt) — both required positional.
    params = inspect.signature(server.run_agent).parameters
    assert list(params) == ["agentId", "prompt"]

    # create_budget requires name/scopeType/periodType/limitCredits; scopeId,
    # enforcement, alertThresholdPct are optional (have defaults).
    cb = inspect.signature(server.create_budget).parameters
    required = [n for n, p in cb.items() if p.default is inspect.Parameter.empty]
    for field in ("name", "scopeType", "periodType", "limitCredits"):
        assert field in required, f"{field} must be required"
    for field in ("scopeId", "enforcement", "alertThresholdPct"):
        assert field not in required, f"{field} must be optional"

    # wallet_balance takes no arguments.
    assert list(inspect.signature(server.wallet_balance).parameters) == []
