# @silvanexum/sdk

Official TypeScript/JavaScript SDK for [Silvanexum](https://silvanexum.com) —
**the spend-control plane for AI agents**. Meter, attribute, cap, and audit what
every agent spends across your whole agent-to-agent mesh, on any model or rail.
Types are generated from the API's Zod contracts, so they never drift from the
live API.

📚 Full docs: **https://docs.silvanexum.com**

## Install

```bash
npm install @silvanexum/sdk
# pnpm add @silvanexum/sdk · yarn add @silvanexum/sdk · bun add @silvanexum/sdk
```

Requires Node ≥ 20 (uses the built-in `fetch`). Ships dual ESM + CJS with
bundled types.

## Quickstart — cap spend, then see who spent it

```ts
import { Silvanexum } from "@silvanexum/sdk";

const sx = new Silvanexum({ apiKey: process.env.SILVANEXUM_API_KEY });

// Cap runaway spend — a run or mesh hop that would breach the budget is
// rejected server-side (HTTP 402). "Spent" is computed from real run telemetry.
await sx.budgets.create({
  name: "support-team",
  scopeType: "agent",
  scopeId: "agt_123",
  periodType: "monthly",
  limitCredits: 50_000,
  enforcement: "block",
});

// Attribute cost across the mesh — which agent / project / model actually spent.
const rows = await sx.spending.summary({ groupBy: "agent" });
console.table(rows);
```

## Zero-code capture (gateway)

Point your OpenAI client's `baseURL` at the gateway and use your Silvanexum key.
Every call is metered on your own provider key and counts toward budgets — with
no change to your agent code:

```ts
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: sx.gateway.openaiBaseUrl(),
  apiKey: process.env.SILVANEXUM_API_KEY,
  // pass a trace id to stitch a call into a multi-hop mesh graph:
  defaultHeaders: { "x-silvanexum-trace": traceId },
});
```

NVIDIA NIM is OpenAI-compatible too: use `sx.gateway.nvidiaBaseUrl()` for the
hosted API catalog (build.nvidia.com, metered on your stored `nvapi-` key) or
`sx.gateway.nimBaseUrl()` for the deployment's self-hosted NIM. In SDK-only mode,
`sx.meter.track("nvidia" | "nim", model, ...)` reads usage the same way.

## What's in the SDK

| Resource | What it does |
| --- | --- |
| `sx.spending` | Cost attribution — `summary` / `trends` / `meshTrace` (by agent, project, model, provider) |
| `sx.budgets` | Spend caps with `off` / `alert` / `block` enforcement + live status |
| `sx.gateway` | Zero-code OpenAI-compatible capture + usage |
| `sx.fleet` | Cost, latency, drift, and alert observability |
| `sx.runs` · `sx.agents` | Run agents; read signed, replayable traces |
| `sx.security` | Hash-chained audit log + compliance export |

…plus `marketplace`, `wallet`, `routing`, `connectors`, `team`, and more. Full
reference: **https://docs.silvanexum.com/docs/sdk-reference/typescript**.

## Errors

Every failure throws a typed `SilvanexumError` subclass:

```ts
import { RateLimitError, InsufficientCreditsError } from "@silvanexum/sdk";

try {
  await sx.runs.create({ agentId: "agt_123", prompt: "…" });
} catch (err) {
  if (err instanceof InsufficientCreditsError) {
    // budget/credits exhausted (HTTP 402) — top up or raise the cap
  } else if (err instanceof RateLimitError) {
    // the client already retried with backoff; surface to the user
  }
}
```

## Configuration

```ts
new Silvanexum({
  apiKey: "sx_live_...",        // or env SILVANEXUM_API_KEY
  baseUrl: "https://api.silvanexum.com", // or env SILVANEXUM_BASE_URL
  timeoutMs: 60_000,
  maxRetries: 2,                // retries 429 / 5xx / connection errors
});
```

Licensed Apache-2.0.
