# @silvanexum/mcp

[![Silvanexum MCP server](https://mcprush.com/badge/silvanexum-mcp/card.svg)](https://mcprush.com/to/silvanexum-mcp?ref=badge)

The official [Model Context Protocol](https://modelcontextprotocol.io) server for
[Silvanexum](https://silvanexum.com) — **the spend-control plane for AI agents**.
Discover, run, and inspect agents — with signed, replayable, credit-metered runs
and live org spend — natively from Claude Desktop, Claude Code, Cursor, Windsurf,
or any MCP host.

> Every `run_agent` returns a **signed, replayable** run metered in credits — and
> `get_spending` / `list_budgets` / `create_budget` bring cost attribution and
> spend caps right into the host. The [SDK](https://www.npmjs.com/package/@silvanexum/sdk)
> and dashboard cover the full surface (gateway capture, trends, mesh traces).

## Run it

```bash
npx -y @silvanexum/mcp
```

Set a scoped API key in the environment first (create one in the dashboard under
**Settings → API keys** — grant `read`+`run`, never `pay`):

```bash
export SILVANEXUM_API_KEY="sx_live_..."
```

### Claude Desktop / Claude Code

```jsonc
{
  "mcpServers": {
    "silvanexum": {
      "command": "npx",
      "args": ["-y", "@silvanexum/mcp"],
      "env": { "SILVANEXUM_API_KEY": "sx_live_..." }
    }
  }
}
```

Python users can run the same server via [`silvanexum-mcp`](https://pypi.org/project/silvanexum-mcp/): `uvx silvanexum-mcp`.

### VS Code

Two ways:

1. **Install the [Silvanexum extension](https://marketplace.visualstudio.com/items?itemName=silvanexum.silvanexum-vscode)** — it contributes this MCP server automatically and wires it to your signed-in key (VS Code ≥ 1.101). Nothing to configure.
2. **Manual** — add `.vscode/mcp.json`:

```jsonc
{
  "servers": {
    "silvanexum": {
      "command": "npx",
      "args": ["-y", "@silvanexum/mcp"],
      "env": { "SILVANEXUM_API_KEY": "${input:silvanexum_key}" }
    }
  },
  "inputs": [
    { "id": "silvanexum_key", "type": "promptString", "description": "Silvanexum API key", "password": true }
  ]
}
```

This server also ships a `server.json` for the [MCP Registry](https://registry.modelcontextprotocol.io).

## Tools

| Tool | What it does | Scope |
| --- | --- | --- |
| `search_agents` | Proof-ranked marketplace search (outcomes, not stars) | `read` |
| `get_agent` | Fetch an agent's config + reputation | `read` |
| `get_reputation` | Volume-aware trust score + confidence | `read` |
| `run_agent` | Run an agent → answer + **signed, replayable** trace URL | `run` |
| `get_run` | Fetch a run's full signed trace | `read` |
| `deploy_template` | Deploy a 1-click vertical template (M11, may be `planned`) | `manage` |
| `wallet_balance` | Org credit balance | `read` |
| `get_spending` | Cost attribution — spend by agent / project / model / provider | `read` |
| `list_budgets` | Spend caps with live spend + state (ok / warn / exceeded) | `read` |
| `create_budget` | Create a spend cap; `block` rejects a breaching run (HTTP 402) | `manage` |

## Configuration

| Env var | Purpose |
| --- | --- |
| `SILVANEXUM_API_KEY` | **Required.** Scoped key (`read`+`run` recommended). |
| `SILVANEXUM_BASE_URL` | API base (default `https://api.silvanexum.com`). |
| `SILVANEXUM_WEB_URL` | Web base for replay URLs (default `https://silvanexum.com`). |

A tool that needs a scope your key lacks fails with a clear `insufficient_scope`
error — by design. Licensed Apache-2.0.
