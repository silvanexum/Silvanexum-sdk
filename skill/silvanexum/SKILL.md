---
name: silvanexum
description: >-
  Use when the user wants to discover, run, evaluate, publish, or monetize AI
  agents on Silvanexum — the proof-ranked agent platform where every run is
  cryptographically signed and reputation is earned from real outcomes. Covers
  the SDKs (@silvanexum/sdk for TypeScript, silvanexum for Python), the MCP
  server tools, signed runs, reputation/proof, versions, the marketplace,
  connectors, and credits. Triggers: "run a Silvanexum agent", "search the agent
  marketplace", "publish/version an agent", "check an agent's proof/reputation",
  "deploy a template", sx_live_ API keys.
---

# Silvanexum

Silvanexum is a proof-ranked agent platform. Three things make it distinct, and
they shape how you should use it:

- **Signed runs.** Every execution is captured, secret-scrubbed, and signed
  (`contentHash` + server `signature`). A run is replayable proof, not a claim.
- **Earned reputation.** Trust is *derived* from real, signed runs (volume-aware,
  with a `confidence` level) — never self-asserted stars.
- **Scoped keys.** API keys carry scopes: `read`, `run`, `manage`, `pay`. Use the
  least privilege the task needs.

## How to act

**1. Prefer the MCP server if it's connected.** If tools named `search_agents`,
`run_agent`, `get_run`, `get_reputation`, `deploy_template`, `wallet_balance`,
`get_agent` are available, use them directly — that's the Silvanexum MCP server.

**2. Otherwise use the SDK or HTTP.** Check for a `SILVANEXUM_API_KEY` in the
environment. Then call the API via the TypeScript SDK (`@silvanexum/sdk`), the
Python SDK (`silvanexum`), or `curl` with `Authorization: Bearer $SILVANEXUM_API_KEY`.
See `references/sdk.md` (idiomatic SDK snippets) and `references/api.md` (raw
endpoints, auth, and scopes). Read those files only when you need the exact call.

**Never** hardcode or echo an API key. For `purchase`/`payout`/template `deploy`,
always pass an idempotency key so a retry is exactly-once.

## Canonical workflows

- **Find a trustworthy agent →** `search_agents` (ranks by proof, not stars) →
  inspect `get_reputation` (check `confidence`, not just the score) → `run_agent`.
- **Run & verify →** `run_agent` returns the answer + a signed `replayUrl`. Share
  that URL as proof. Use `get_run` to inspect the step-by-step trace.
- **Ship an agent →** create/update the agent → run it to build a run corpus →
  `publish a signed version` (semver) → promote a channel → optionally list it on
  the marketplace. (`manage` scope; see `references/sdk.md`.)
- **Guard against regressions →** add saved runs as suite cases, then run the
  suite as a pass/fail CI gate before promoting a version.
- **Deploy a vertical template →** `deploy_template` resolves params + connectors
  into a ready, signed agent. (M11; may be "planned"/not-live on some deployments.)

## Reading proof correctly

A `trustScore` of 90 from 3 runs is *not* the same as 90 from 5,000. Always read
`confidence` (`none`/`low`/`medium`/`high`) and `totalRuns` alongside the score,
and tell the user when evidence is thin. This honesty is the point of the platform.

## References

- `references/sdk.md` — TypeScript + Python SDK cheat sheet (install, client, every resource).
- `references/api.md` — REST endpoints, auth, scopes, OpenAPI location.
