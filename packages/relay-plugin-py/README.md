# silvanexum-relay

**Silvanexum spend control for [NVIDIA NeMo Relay](https://docs.nvidia.com/nemo/relay/).**

A Relay `grpc-v1` worker plugin (component kind `silvanexum`) that:

- **meters every LLM call** to [Silvanexum](https://silvanexum.com) — the
  spend-control plane for AI agents — priced server-side and attributed per
  agent and per customer; and
- **rejects an LLM call before it runs** when a budget is exhausted, via a Relay
  LLM conditional-execution guardrail — real enforcement inside NVIDIA's stack.

Because Relay wraps LangChain, LangGraph, Deep Agents, Google ADK, Claude Code,
Codex and more, one plugin puts Silvanexum in front of all of them.

ðŸ“š Silvanexum docs: **https://docs.silvanexum.com**

## How it complements Relay's built-in pricing

Relay ships a `pricing` component, but it carries no prices (you supply a
catalog), only estimates per-token cost locally, and has no budgets, ledger,
per-customer attribution or dashboard. Silvanexum is the central plane Relay
feeds. This package also **ships a pricing catalog** (see below) so Relay's own
`pricing` component works out of the box, even without a Silvanexum account.

## Install

Requires Python 3.11–3.13 and NeMo Relay 0.11+ (`pip install nemo-relay-cli-bin`).

```bash
pip install silvanexum-relay
# Relay installs Python workers from a project folder; generate one:
python -m silvanexum_relay init ./silvanexum-relay-plugin
nemo-relay plugins add ./silvanexum-relay-plugin/relay-plugin.toml
nemo-relay plugins enable silvanexum
```

`plugins add` builds an isolated environment for the worker (it pip-installs
`silvanexum-relay`) and checks the worker file's SHA-256 against the manifest.
Re-run `init --force` and `plugins add` after upgrading `silvanexum-relay`.
From a source checkout of this repo you can skip `init` and add
`./relay-plugin.toml` directly.

## Configure (`plugins.toml`)

`plugins enable` records the plugin in your `plugins.toml`
(`~/.config/nemo-relay/plugins.toml`, or `%APPDATA%
emo-relay` on Windows).
Put the plugin's settings under `[plugins.dynamic.config]` of that entry:

```toml
version = 1

# Relay's gateway/server mode requires signed plugins by default. Until
# silvanexum-relay releases are signed, allow integrity-checked workers:
[plugins.policy.defaults]
attestation = "integrity_only"

[[plugins.dynamic]]
manifest = "./silvanexum-relay-plugin/relay-plugin.toml"

[plugins.dynamic.config]
# api_key defaults to $SILVANEXUM_API_KEY (read + run scopes)
agent = "support-bot"      # default agent for spend attribution
enforce_budget = true      # reject a call that would breach a budget
# customer = "acme-inc"    # default customer; or send x-silvanexum-customer per call
# provider = "nim"         # pin for a self-hosted NIM (see Provider inference)
```

Restart Relay after changing the config. The worker is a separate process, so a
plugin fault can't take Relay down.

### Per-call attribution

Send `x-silvanexum-customer` and/or `x-silvanexum-agent` headers on an LLM
request that goes through Relay (the same headers the Silvanexum gateway reads).
They override the config defaults for that call, for **both** the budget check
and the metered event, so a call is checked against the budget it's billed to.

> Silvanexum's budget check (`/meter/check`) currently enforces **org-level**
> budgets. The agent and customer are sent with every check, so per-agent and
> per-customer caps will take effect without a plugin change once the server
> enforces them. Metering is attributed per agent and customer today.

## What's blocked vs logged

| Behaviour | When | Effect |
| --- | --- | --- |
| **Metering** | always | Every LLM-end event is mapped to a Silvanexum meter event and batched off the event loop. Priced server-side. |
| **Hard block** | `enforce_budget = true` | Before each LLM call, the guardrail calls `sx.meter.check`; if the budget is exhausted it **rejects the call** with Silvanexum's message. The call never runs. |
| **Fail-open** | Silvanexum unreachable | With `fail_open = true` (default) the call is **allowed** and the failure logged. Set `fail_open = false` to block instead. |
| **Disabled** | no API key | One warning; the plugin drops events and never blocks. The host runs normally. |

A short TTL cache (`budget_cache_ttl_s`, default 2s) keyed by
(agent, customer, model) keeps a burst of calls from each paying a round trip.

Verified end to end against `nemo-relay` 0.11.0 in gateway mode: an allowed call
is checked, forwarded and metered with its real token usage; a denied call gets
HTTP 403 `nemo_relay_guardrail_rejected` and never reaches the upstream.

## Usage mapping

| Relay `Usage` | Silvanexum field |
| --- | --- |
| `prompt_tokens` (cache-inclusive) | `inputTokens` |
| `completion_tokens` (reasoning folded in) | `outputTokens` |
| `cache_read_tokens` | `cacheReadTokens` |
| `cache_write_tokens` | `cacheWriteTokens` |

`status` follows Relay's own verdict on the LLM scope (`otel.status_code`):
`ERROR` is recorded as `status="error"`. A successful call whose provider sent
no usage (common on streams, e.g. OpenAI without
`stream_options.include_usage`) is recorded as a success with 0 tokens and a
warning in the worker log, so turn usage reporting on for streaming calls.
Latency comes from the paired LLM start/end timestamps. Relay's own
`Usage.cost` is left for reconciliation; Silvanexum prices from its own table.

## Provider inference

The event carries the model *name*, not the LLM config `_type` or `base_url`, so
the Silvanexum provider is resolved as: config `provider` → a provider on the
event → model-name markers (`nvidia/` / `meta/` / `nemotron` → `nvidia`, `gpt-`
→ `openai`, `claude` → `anthropic`, `gemini` → `google`) → `other`.

- **Self-hosted NIM:** pin `provider = "nim"`. Without it, a NIM model name reads
  as hosted `nvidia`.
- **Open models on non-NVIDIA hosts** (OpenAI-compatible, Bedrock, litellm):
  pin `provider`, since a bare `llama`/`mixtral` name is ambiguous.

## Pricing catalog (quick win)

`catalogs/silvanexum-pricing.json` is a Relay pricing catalog (`version`/`entries`
format, validated with `nemo-relay model-pricing validate`) generated from
Silvanexum's model price table: per-million rates for concrete OpenAI,
Anthropic, Gemini and NVIDIA-hosted Nemotron model ids. Relay matches exact
model ids only, so a model not listed gets no local estimate (Silvanexum's own
server-side pricing still uses prefix matching). Point Relay's built-in
`pricing` component at it:

```toml
[[components]]
kind = "pricing"
[[components.config.sources]]
type = "file"
path = "catalogs/silvanexum-pricing.json"
```

Regenerate it from the backend price table with:

```bash
python scripts/export_relay_pricing.py \
  --backend <path>/Silvanexum-backend/src/modules/fleet/service.ts
```

## Configuration reference

| Field | Default | Description |
| --- | --- | --- |
| `api_key` | `$SILVANEXUM_API_KEY` | Silvanexum API key. |
| `base_url` | `$SILVANEXUM_BASE_URL` or `https://api.silvanexum.com` | Silvanexum API base URL. |
| `agent` | event metadata | Default agent to attribute spend to (`x-silvanexum-agent` overrides per call). |
| `customer` | event metadata | Default customer to attribute spend to (`x-silvanexum-customer` overrides per call). |
| `provider` | inferred | Force `openai`\|`anthropic`\|`google`\|`nvidia`\|`nim`\|`other`. |
| `enforce_budget` | `false` | Hard-block LLM calls that would breach a budget. |
| `fail_open` | `true` | Allow calls when Silvanexum is unreachable. |
| `batch_size` | `50` | Flush after this many events. |
| `flush_interval_s` | `5.0` | Background flush interval (also flushes a quiet workflow). |
| `timeout_s` | `5.0` | Per-request timeout for Silvanexum calls (calls run off the loop). |
| `budget_cache_ttl_s` | `2.0` | TTL for cached budget verdicts. |

## Example

See [`examples/relay-langchain-nim/`](examples/relay-langchain-nim/) for a
LangChain agent through Relay on a build.nvidia.com NIM model, with
`enforce_budget = true` and a demonstrated budget rejection.

Licensed Apache-2.0.
