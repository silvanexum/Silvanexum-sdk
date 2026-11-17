# Silvanexum SDK cheat sheet

Two SDKs mirror each other. Both read `SILVANEXUM_API_KEY` (and optional
`SILVANEXUM_BASE_URL`) from the environment.

- TypeScript: `@silvanexum/sdk` (npm), Node ≥ 20.
- Python: `silvanexum` (PyPI), Python ≥ 3.9.

## Client

```ts
import { Silvanexum } from "@silvanexum/sdk";
const sx = new Silvanexum(); // or { apiKey, baseUrl, timeoutMs, maxRetries }
```
```python
from silvanexum import Silvanexum
sx = Silvanexum()  # or Silvanexum(api_key=..., base_url=...)
```

Errors are typed: `SilvanexumError` and subclasses `AuthenticationError` (401),
`PermissionError` (403, missing scope), `ValidationError` (400/422),
`InsufficientCreditsError` (402), `RateLimitError` (429, auto-retried).

## Agents (`sx.agents`)

```ts
await sx.agents.list();                        // AgentView[]
await sx.agents.get(id);                        // { agent, myRating }
await sx.agents.create({ name, description, config: { provider, model, systemPrompt }, connectorIds: [] });
await sx.agents.update(id, { description });
await sx.agents.publish(id);                    // make public
await sx.agents.fork(id);
await sx.agents.rate(id, 5);
await sx.agents.lineage(id);
// Signed versions (M01):
await sx.agents.versions.publish(id, { semver: "1.0.0", changelog: "…" });
await sx.agents.versions.promote(id, "1.0.0");  // → stable/live channel
await sx.agents.versions.verify(id, "1.0.0");
```
```python
sx.agents.create(name="…", config={"provider": "anthropic", "model": "claude-opus-4-8", "systemPrompt": "…"}, connectorIds=[])
sx.agents.versions.publish(agent_id, semver="1.0.0", changelog="…")
sx.agents.versions.promote(agent_id, "1.0.0")
```
Python `create`/`update` forward kwargs verbatim as JSON — pass the API's
camelCase field names (e.g. `connectorIds=[...]`).

## Runs (`sx.runs`) — captured, scrubbed, signed

```ts
const run = await sx.runs.create({ agentId, prompt });  // run.output, run.signature, run.contentHash
sx.runs.shareUrl(run.id);                                // public replay URL
await sx.runs.get(run.id);                               // full trace
await sx.runs.setVisibility(run.id, "public");
```
```python
run = sx.runs.create(agent_id=agent_id, prompt="…")
sx.runs.share_url(run.id)
```

## Marketplace (`sx.marketplace`) — proof-ranked

```ts
await sx.marketplace.search({ q: "legal", sort: "proof" });
await sx.marketplace.tryListing(id, "sample input");
await sx.marketplace.purchase(id, crypto.randomUUID());  // idempotency key REQUIRED
```

## Templates (M11, `sx.templates`) — may be `planned`/not live

```ts
await sx.templates.list({ vertical: "support" });
await sx.templates.deploy(id, { params }, { idempotencyKey: crypto.randomUUID() });
```

## Wallet (`sx.wallet`) — credits & payouts (M10)

```ts
await sx.wallet.get();                              // balanceCredits, …
await sx.wallet.buyCredits(1000);                   // → Stripe Checkout URL
await sx.wallet.createPayout(500, crypto.randomUUID());
```

## Also: `sx.suites` (eval gate), `sx.connectors` (Nango tools), `sx.keys`, `sx.models`, `sx.team`, `sx.overview`.
