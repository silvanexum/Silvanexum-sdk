# silvanexum-nat

> **Not published.** NVIDIA deprecated NeMo Agent Toolkit (October 2026; EOL end
> of 2026). This package is kept for reference only — use
> [`silvanexum-relay`](../relay-plugin-py/README.md) for NeMo Relay, the named
> successor, which also adds a hard pre-call budget block.

**Silvanexum cost tracking for [NVIDIA NeMo Agent Toolkit](https://docs.nvidia.com/nemo/agent-toolkit/) (NAT).**

Add a few lines of workflow YAML and every LLM call in your NAT workflow is
reported to [Silvanexum](https://silvanexum.com) — the spend-control plane for
AI agents — for **server-side pricing**, **per-agent / per-customer cost
attribution**, and **budget pre-flight**. Works with NIM (hosted on
build.nvidia.com or self-hosted) and other OpenAI-compatible providers.

📚 Silvanexum docs: **https://docs.silvanexum.com**

## Install

```bash
pip install silvanexum-nat
# brings in silvanexum (the SDK) and depends on nvidia-nat-core
```

Requires Python 3.11–3.13 and NeMo Agent Toolkit 1.8+.

## Enable it (5-line YAML)

```yaml
general:
  telemetry:
    tracing:
      silvanexum:
        _type: silvanexum
        enforce_budget: true   # optional
```

Set your key in the environment and run the workflow as usual:

```bash
export SILVANEXUM_API_KEY="sx_live_..."   # read + run scopes
export NVIDIA_API_KEY="nvapi-..."         # your NIM key, for the workflow itself
nat run --config_file config.yml --input "..."
```

LLM usage now shows up in the Silvanexum dashboard, attributed to the workflow
(as the agent) and priced from Silvanexum's per-model table — Nemotron and the
other NIM models included.

## How it works

The plugin registers a NAT **telemetry exporter** (`_type: silvanexum`). It
watches the workflow's intermediate steps and, on each **LLM end** event, maps
NAT's token usage to a Silvanexum meter event and sends it in batches:

| NAT token field | Silvanexum field |
| --- | --- |
| `prompt_tokens` | `inputTokens` (all prompt tokens, cache included) |
| `completion_tokens` + `reasoning_tokens` | `outputTokens` (thinking bills as output) |
| `cached_tokens` | `cacheReadTokens` |
| — | `cacheWriteTokens` = 0 |

Pricing happens **server-side** from Silvanexum's model table, so you never
hard-code rates. The provider is inferred per call (see below).

Events are batched and flushed when `batch_size` is reached, on a background
`flush_interval_s` timer (so a quiet workflow doesn't hold events), and on
shutdown. Failed LLM calls are not reported: NAT (as of 1.9) emits no
`LLM_END` when an LLM call raises, so an exporter never sees them. If an
`LLM_END` ever arrives without usage, it is recorded with `status="error"` and
zero tokens.

**It never breaks your agent.** Calls to Silvanexum run off the event loop with
a short timeout; reporting failures (Silvanexum down, a 5xx, a malformed event,
a missing API key) are logged and swallowed — your workflow runs regardless.

## Provider inference

A telemetry exporter only sees the model *name*, never the LLM config `_type`
or its `base_url`, so the Silvanexum provider is resolved as:

1. the `provider` field in this config, if set (authoritative); else
2. the model name — `nvidia/` / `nemotron` / `meta/` → `nvidia`,
   `gpt-` / `o1` / `o3` → `openai`, `claude` → `anthropic`, `gemini` → `google`; else
3. `other`.

**Self-hosted NIM:** pin `provider: nim`. The exporter can't see the LLM's
`base_url`, so it can't distinguish a self-hosted NIM from the hosted
build.nvidia.com catalog — without the pin, a self-hosted call is reported as
`nvidia` and priced at hosted rates.

**Open models on non-NVIDIA hosts:** a Llama/Mistral served through an
OpenAI-compatible host, Bedrock, or litellm has the same model name as the
NVIDIA catalog entry, so name inference can't tell them apart. Pin `provider:`
explicitly in that case.

## Budget enforcement (and its limit)

With `enforce_budget: true`, the exporter calls Silvanexum's budget check on each
**LLM start** and loudly logs — and records on `exporter.blocked_calls` — any
call that would breach a `block`-mode budget.

> **Important:** a NAT telemetry exporter is a passive observer; it cannot abort
> an in-flight LLM call. So a breach is **flagged and logged, not hard-blocked**.
> For a true pre-call hard stop, enforcement belongs in a NAT **middleware**
> component (a separate extension point) that wraps the call — that's a planned
> follow-up. Use this flag today for visibility and alerting.

## Configuration reference

| Field | Default | Description |
| --- | --- | --- |
| `api_key` | `$SILVANEXUM_API_KEY` | Silvanexum API key. |
| `base_url` | `$SILVANEXUM_BASE_URL` or `https://api.silvanexum.com` | Silvanexum API base URL. |
| `agent` | the workflow name | Agent to attribute spend to. |
| `customer` | — | Customer/tenant to attribute spend to (static). |
| `provider` | inferred | Force `openai`\|`anthropic`\|`google`\|`nvidia`\|`nim`\|`other`. |
| `enforce_budget` | `false` | Pre-flight budgets on LLM start (flag + log; see above). |
| `batch_size` | `50` | Flush after this many buffered events. |
| `flush_interval_s` | `5.0` | Background flush interval (seconds); also flushes a quiet workflow. |
| `timeout_s` | `5.0` | Per-request timeout for Silvanexum calls (kept short; calls run off the loop). |
| `max_retries` | `0` | Silvanexum client retry count (0 = fast-fail telemetry). |

## Example

See [`examples/nat-nim-cost-tracking/`](examples/nat-nim-cost-tracking/) for a
runnable NIM workflow with the exporter enabled.

Licensed Apache-2.0.
