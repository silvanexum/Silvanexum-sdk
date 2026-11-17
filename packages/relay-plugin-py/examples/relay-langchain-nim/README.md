# Example: LangChain + NIM cost control through NeMo Relay

A LangChain call on a **build.nvidia.com NIM model** (Nemotron 3 Super), routed
through the [NeMo Relay](https://docs.nvidia.com/nemo/relay/) gateway, with the
[`silvanexum-relay`](../../README.md) plugin **metering** every call and
**hard-blocking** calls once the Silvanexum budget is exhausted. The app itself
only changes its base URL.

## 1. Install

```bash
pip install nemo-relay-cli-bin silvanexum-relay langchain-openai
python -m silvanexum_relay init ./silvanexum-relay-plugin
nemo-relay plugins add ./silvanexum-relay-plugin/relay-plugin.toml
nemo-relay plugins enable silvanexum
```

(From a source checkout you can add `../../relay-plugin.toml` instead.)

## 2. Configure

Merge [`plugins.toml`](plugins.toml) into your Relay `plugins.toml`
(`~/.config/nemo-relay/`, or `%APPDATA%\nemo-relay` on Windows). Point its
`manifest` at the one you added. It enables the `silvanexum` worker (metering +
budget block) and Relay's built-in `pricing`, fed by the shipped Silvanexum
catalog for local estimates.

```bash
export NVIDIA_API_KEY="nvapi-..."          # https://build.nvidia.com
export SILVANEXUM_API_KEY="sx_live_..."    # read + run scopes
```

## 3. Run

```bash
# Terminal 1: the Relay gateway in front of NVIDIA's OpenAI-compatible API
nemo-relay --openai-base-url https://integrate.api.nvidia.com/v1
# Terminal 2: the app, pointed at the gateway (127.0.0.1:4040)
python agent.py
```

## What you'll see

**Metered call:** in the Silvanexum dashboard under **Spending**:

| Field | Value |
| --- | --- |
| agent | `relay-nim-demo` (from the plugin config) |
| customer | `acme-inc` (from the `x-silvanexum-customer` header in `agent.py`) |
| provider | `nvidia` (hosted NIM) |
| model | `nvidia/nemotron-3-super-120b-a12b` |
| **costCredits** | priced server-side |

**Budget rejection:** add a blocking cap the org has already used up:

```python
from silvanexum import Silvanexum
sx = Silvanexum()
sx.budgets.create(name="relay-demo", scope_type="org", period_type="monthly",
                  limit_credits=0.01, enforcement="block")
```

Re-run. The plugin's guardrail asks Silvanexum **before** the LLM call, and the
gateway answers `403` with Relay's rejection instead of a model response:

```json
{"error": {"type": "nemo_relay_guardrail_rejected",
           "message": "guardrail rejected: <Silvanexum's budget message>"}}
```

The call never reaches NVIDIA, so no tokens are spent.

> Today Silvanexum's budget check (`/meter/check`) enforces **org-level**
> budgets. The plugin already sends the agent and customer with every check, so
> per-agent and per-customer caps will apply as soon as the server enforces them.

### Self-hosted NIM

Start the gateway with `--openai-base-url` pointing at your NIM container, and
set `provider = "nim"` in `[plugins.dynamic.config]` so calls are priced as
self-hosted rather than at hosted rates. The plugin can't see the upstream URL.
