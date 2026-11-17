# Silvanexum SDKs, MCP server and integrations

[![npm](https://img.shields.io/npm/v/@silvanexum/sdk?label=%40silvanexum%2Fsdk)](https://www.npmjs.com/package/@silvanexum/sdk)
[![PyPI](https://img.shields.io/pypi/v/silvanexum?label=silvanexum)](https://pypi.org/project/silvanexum/)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Silvanexum MCP server](https://mcprush.com/badge/silvanexum-mcp/card.svg)](https://mcprush.com/to/silvanexum-mcp?ref=badge)

[Silvanexum](https://silvanexum.com) is spend control for AI agents. It tells you
what every LLM call cost, **which customer and which agent** it was for, and it
can **stop a call before it runs** when a budget is spent. It works across
OpenAI, Anthropic, Gemini and NVIDIA NIM.

This repo holds everything you install to use it: the TypeScript and Python
SDKs, the MCP server, the NVIDIA NeMo plugins, a VS Code extension and a Claude
skill. All Apache-2.0.

📚 Docs: **https://docs.silvanexum.com**

## Packages

| Package | Install | What it is |
| --- | --- | --- |
| [`@silvanexum/sdk`](packages/sdk-ts) | `npm i @silvanexum/sdk` | TypeScript/JavaScript SDK (ESM + CJS, typed) |
| [`silvanexum`](packages/sdk-py) | `pip install silvanexum` | Python SDK (pydantic v2, typed) |
| [`@silvanexum/mcp`](packages/mcp) | `npx -y @silvanexum/mcp` | MCP server for Claude, Cursor, Windsurf and other MCP hosts |
| [`silvanexum-mcp`](packages/mcp-py) | `uvx silvanexum-mcp` | The same MCP server in Python |
| [`silvanexum-relay`](packages/relay-plugin-py) | `pip install silvanexum-relay` | NVIDIA NeMo Relay plugin: meters every LLM call, blocks over-budget calls |
| [`silvanexum-nat`](packages/nat-plugin-py) | `pip install silvanexum-nat` | NVIDIA NeMo Agent Toolkit cost-tracking exporter |
| [`silvanexum-vscode`](packages/vscode) | see the package README | Spend, budgets and traces in your editor |
| [`skill/silvanexum`](skill) | copy into `~/.claude/skills` | Claude Agent Skill |

## Quickstart

Get an API key at [silvanexum.com](https://silvanexum.com), then pick one of three ways in.

**1. SDK-only metering.** You keep calling your provider directly; nothing sits in
your request path and no prompts leave your stack. Silvanexum prices the usage,
attributes it, and enforces budgets.

```ts
import { Silvanexum } from "@silvanexum/sdk";

const sx = new Silvanexum({ apiKey: process.env.SILVANEXUM_API_KEY });

const msg = await sx.meter.track("anthropic", "claude-sonnet-5-5", { customer: "acme", agent: "support-bot" },
  () => claude.messages.create({ model: "claude-sonnet-5-5", max_tokens: 1024, messages }));
```

**2. Gateway.** Point your OpenAI client at the gateway. Zero changes to agent code.

```ts
const openai = new OpenAI({
  baseURL: sx.gateway.openaiBaseUrl(),
  apiKey: process.env.SILVANEXUM_API_KEY,
});
```

**3. Budgets and reports.**

```ts
await sx.budgets.create({
  name: "acme-monthly",
  scopeType: "agent",
  scopeId: "agt_123",
  periodType: "monthly",
  limitCredits: 50_000,
  enforcement: "block", // over-budget calls are rejected, not just alerted on
});

console.table(await sx.spending.summary({ groupBy: "agent" }));
```

Python works the same way; see [`packages/sdk-py`](packages/sdk-py).

## Repo layout

```
packages/
  sdk-ts/            @silvanexum/sdk
  sdk-py/            silvanexum
  mcp/               @silvanexum/mcp
  mcp-py/            silvanexum-mcp
  relay-plugin-py/   silvanexum-relay
  nat-plugin-py/     silvanexum-nat
  vscode/            VS Code extension
  codegen/           generates spec/openapi.json and the SDK types
spec/
  openapi.json       OpenAPI 3.1 document for the public API
skill/
  silvanexum/        Claude Agent Skill
```

The SDK types and `spec/openapi.json` are **generated** from the Silvanexum API's
contracts, so they match the live API. Please don't edit files under
`generated/` or `_generated/` by hand; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Develop

```bash
pnpm install
pnpm -r build
pnpm -r test
```

Python packages use their own `pyproject.toml`; run `pytest` inside each one.

## Contributing and security

Bug reports, ideas and PRs are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).
Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[Apache-2.0](LICENSE). "Silvanexum" and the Silvanexum logo are trademarks of
Silvanexum and are not covered by the license.
