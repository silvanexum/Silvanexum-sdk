# silvanexum

Official Python SDK for [Silvanexum](https://silvanexum.com) — **the spend-control
plane for AI agents**. Meter, attribute, cap, and audit what every agent spends
across your whole agent-to-agent mesh, on any model or rail. Models are generated
from the API's Zod contracts (pydantic v2), so they never drift from the live API.

📚 Full docs: **https://docs.silvanexum.com**

## Install

```bash
pip install silvanexum
# uv add silvanexum · poetry add silvanexum
```

Requires Python ≥ 3.9.

## Quickstart — cap spend, then see who spent it

```python
import os
from silvanexum import Silvanexum

sx = Silvanexum(api_key=os.environ["SILVANEXUM_API_KEY"])

# Cap runaway spend — a run or mesh hop that would breach the budget is
# rejected server-side (HTTP 402). "Spent" is computed from real run telemetry.
sx.budgets.create(
    name="support-team",
    scope_type="agent",
    scope_id="agt_123",
    period_type="monthly",
    limit_credits=50_000,
    enforcement="block",
)

# Attribute cost across the mesh — which agent / project / model actually spent.
for row in sx.spending.summary(group_by="agent"):
    print(row.label, row.costCredits)
```

The client is a context manager, so connections are cleaned up for you:

```python
with Silvanexum() as sx:          # reads SILVANEXUM_API_KEY from the env
    trend = sx.spending.trends(bucket="1d")  # daily spend, last 30 days
```

## What's in the SDK

| Resource | What it does |
| --- | --- |
| `sx.spending` | Cost attribution — `summary` / `trends` / `mesh_trace` (by agent, project, model, provider) |
| `sx.budgets` | Spend caps with `off` / `alert` / `block` enforcement + live status |
| `sx.gateway` | Zero-code OpenAI-compatible capture + usage |
| `sx.fleet` | Cost, latency, drift, and alert observability |
| `sx.runs` · `sx.agents` | Run agents; read signed, replayable traces |
| `sx.security` | Hash-chained audit log + compliance export |

…plus `marketplace`, `wallet`, `routing`, `connectors`, `team`, and more. Full
reference: **https://docs.silvanexum.com/docs/sdk-reference/python**.

## Zero-code capture (gateway)

Point your OpenAI client's `base_url` at the gateway and use your Silvanexum key.
Every call is metered on your own provider key and counts toward budgets:

```python
from openai import OpenAI

openai = OpenAI(
    base_url=sx.gateway.openai_base_url(),
    api_key=os.environ["SILVANEXUM_API_KEY"],
    default_headers={"x-silvanexum-trace": trace_id},  # optional mesh stitching
)
```

## NVIDIA NeMo Relay

Running agents through NVIDIA's [NeMo Relay](https://docs.nvidia.com/nemo/relay/)?
The companion [`silvanexum-relay`](../relay-plugin-py/README.md) package is a
Relay worker plugin that meters every LLM call to Silvanexum (priced server-side,
Nemotron/NIM included) and can **reject a call before it runs** when a budget is
exhausted. Relay wraps LangChain, LangGraph, Claude Code and more, so one plugin
covers all of them.

```bash
pip install silvanexum-relay
python -m silvanexum_relay init ./silvanexum-relay-plugin
nemo-relay plugins add ./silvanexum-relay-plugin/relay-plugin.toml
nemo-relay plugins enable silvanexum
```

Then set `enforce_budget = true` under that plugin's `[plugins.dynamic.config]`
in Relay's `plugins.toml`.

It also ships a Relay pricing catalog (Nemotron and NIM included) for Relay's
built-in `pricing` component. See [`relay-plugin-py`](../relay-plugin-py/README.md).

> The earlier [`silvanexum-nat`](../nat-plugin-py/README.md) plugin targets NeMo
> Agent Toolkit, which NVIDIA deprecated (EOL end of 2026). Use `silvanexum-relay`.

## Errors

```python
from silvanexum import InsufficientCreditsError, RateLimitError

try:
    sx.runs.create(agent_id="agt_123", prompt="…")
except InsufficientCreditsError:
    ...  # budget/credits exhausted (HTTP 402) — top up or raise the cap
except RateLimitError:
    ...  # client already retried with backoff
```

Licensed Apache-2.0.
