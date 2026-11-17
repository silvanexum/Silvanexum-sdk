# Example: NIM cost tracking with Silvanexum

A minimal [NeMo Agent Toolkit](https://docs.nvidia.com/nemo/agent-toolkit/)
workflow that calls a **NIM model** and reports every LLM call to
[Silvanexum](https://silvanexum.com) for pricing, attribution, and budgets — via
the [`silvanexum-nat`](../../README.md) telemetry exporter.

## 1. Install

```bash
pip install nvidia-nat silvanexum-nat
```

(`nvidia-nat` gives you the `nat` CLI and the `nim` LLM provider;
`silvanexum-nat` registers the `silvanexum` telemetry exporter.)

## 2. Set env vars

```bash
export NVIDIA_API_KEY="nvapi-..."          # create one at https://build.nvidia.com
export SILVANEXUM_API_KEY="sx_live_..."    # read + run scopes
# export SILVANEXUM_BASE_URL="https://api.silvanexum.com"   # default; override for self-host
```

No key gets printed or committed; both are read from the environment.

## 3. Run

```bash
nat run --config_file config.yml --input "Give me one fact about the Hopper GPU."
```

## 4. What you'll see in Silvanexum

Open **Spending** in the dashboard (or `sx.spending.summary(group_by="agent")`
from the Python SDK). A new event appears:

| Field | Value |
| --- | --- |
| agent | `nim-cost-demo` (from `config.yml`) |
| provider | `nvidia` (inferred from the model name; hosted NIM) |
| model | `meta/llama-3.1-8b-instruct` |
| inputTokens / outputTokens | mapped from the NIM response usage |
| **costCredits** | priced **server-side** from Silvanexum's model table (non-zero) |

### Self-hosted NIM

If you run a self-hosted NIM container, point the LLM at it **and pin the
provider** so it's priced as self-hosted (`nim`) rather than at hosted
build.nvidia.com rates — the exporter sees only the model name, never the LLM's
`base_url`, so it can't tell the two apart on its own:

```yaml
general:
  telemetry:
    tracing:
      silvanexum:
        _type: silvanexum
        provider: nim          # <- required for self-hosted NIM
llms:
  nim_llm:
    _type: nim
    model_name: meta/llama-3.1-8b-instruct
    base_url: http://localhost:8000/v1
```

### Try a Nemotron model

Swap the model line in `config.yml`:

```yaml
llms:
  nim_llm:
    _type: nim
    model_name: nvidia/nemotron-3-super-120b-a12b
```

Nemotron is in Silvanexum's price table, so `costCredits` is priced correctly.

### Turn on budget pre-flight

Set `enforce_budget: true` in `config.yml`. The exporter then checks your
Silvanexum budgets on each LLM start and logs (and records) any breach. Note it
**flags** a breach rather than hard-aborting the call — see the
[plugin README](../../README.md#budget-enforcement-and-its-limit) for why and
what a hard block would require.
