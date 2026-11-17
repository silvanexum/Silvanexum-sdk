# silvanexum-mcp

<!-- mcp-name: io.github.silvanexum/silvanexum -->

[![Silvanexum MCP server](https://mcprush.com/badge/silvanexum-mcp/card.svg)](https://mcprush.com/to/silvanexum-mcp?ref=badge)

The official [Model Context Protocol](https://modelcontextprotocol.io) server for
[Silvanexum](https://silvanexum.com), for Python hosts — **the spend-control plane
for AI agents**. Discover, run, and inspect agents with signed, replayable,
credit-metered runs and live org spend, from any MCP host.

> The Node build is [`@silvanexum/mcp`](https://www.npmjs.com/package/@silvanexum/mcp)
> (`npx -y @silvanexum/mcp`). This is the `uvx` equivalent. Full budgets, caps,
> and cost attribution live in the [`silvanexum`](https://pypi.org/project/silvanexum/) SDK.

## Run it

```bash
export SILVANEXUM_API_KEY="sx_live_..."   # read+run scopes; never pay
uvx silvanexum-mcp
```

### Claude Desktop / Claude Code

```jsonc
{
  "mcpServers": {
    "silvanexum": {
      "command": "uvx",
      "args": ["silvanexum-mcp"],
      "env": { "SILVANEXUM_API_KEY": "sx_live_..." }
    }
  }
}
```

## Tools

`search_agents` · `get_agent` · `get_reputation` · `run_agent` (→ answer + signed
replay URL) · `get_run` · `deploy_template` · `wallet_balance` · `get_spending`
(cost attribution) · `list_budgets` · `create_budget` (spend caps, `block` → 402).

## Configuration

| Env var | Purpose |
| --- | --- |
| `SILVANEXUM_API_KEY` | **Required.** Scoped key (`read`+`run` recommended). |
| `SILVANEXUM_BASE_URL` | API base (default `https://api.silvanexum.com`). |
| `SILVANEXUM_WEB_URL` | Web base for replay URLs (default `https://silvanexum.com`). |

Licensed Apache-2.0.
