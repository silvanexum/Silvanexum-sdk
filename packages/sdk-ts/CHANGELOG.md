# @silvanexum/sdk

## 0.6.2

## 0.6.1

## 0.6.0

### Minor Changes

- 316f864: NVIDIA NIM support: `sx.gateway.nvidiaBaseUrl()` (hosted API catalog) and `sx.gateway.nimBaseUrl()` (self-hosted NIM), plus `"nvidia"` and `"nim"` as `sx.meter` providers, read like OpenAI usage. The Python SDK gets the same (`nvidia_base_url()`, `nim_base_url()`, `usage_from_response("nvidia" | "nim", ...)`).

## 0.5.0

### Minor Changes

- 54384c2: SDK-only metering (`sx.meter`): report provider usage and run budget pre-flight checks without putting a proxy in your request path. `track()` wraps a provider call, reads usage off its response (OpenAI, Anthropic, Gemini) and reports it, never breaking the caller. Gateway: Anthropic and Gemini base URLs, streaming on every provider, per-customer/agent breakdowns in `usage()`.

## 0.3.0

## 0.2.2

### Patch Changes

- a97d74c: Docs: reposition as Silvanexum, the spend-control plane for AI agents. READMEs
  and package descriptions now lead with the FinOps flow (budget caps with
  enforcement + `spending.summary` cost attribution, and the zero-code gateway),
  replacing the older "proof-ranked agent platform" framing. No API changes.

## 0.2.1

## 0.2.0

### Minor Changes

- c04fe76: Add Agent FinOps resources: `sx.budgets` (create/list/get/update/delete/status),
  `sx.spending` (summary/trends/meshTrace), and `sx.gateway` (zero-code capture —
  `openaiBaseUrl()` + `usage()`). Types are generated from the backend Zod contracts.
  The Python SDK (`silvanexum`) gains the equivalent `budgets` / `spending` surface.
- ba1d743: Initial release of the Silvanexum TypeScript SDK. Ergonomic, typed client over
  the proof-ranked agent platform API — agents, signed runs, templates,
  connectors, marketplace, wallet/credits, suites, keys, models, and team. Types
  are generated from the API's Zod contracts. Dual ESM + CJS, Node ≥ 20.
- 30ae916: Add the Silvanexum MCP server (`@silvanexum/mcp`, `npx -y @silvanexum/mcp`) —
  proof-ranked agent discovery, signed runs, reputation, and credit-metered
  execution as MCP tools. SDK type coverage expanded: marketplace, wallet/payout,
  suite, and agent-version views are now generated from backend Zod contracts
  (previously hand-mirrored), dropping approximate types from 22 to 6.

### Patch Changes

- aa19201: M19 — package distribution hardening.

  - Fix Python codegen: contract fields that are Python reserved words (e.g. the
    `from` field on AuditLogQuery / FleetMetricsQuery) are now emitted with a safe
    attribute alias (`from_`) pinned to the wire name via a pydantic
    `Field(alias="from")`, with `populate_by_name=True`. `import silvanexum` no
    longer raises SyntaxError; the JSON wire shape is unchanged.
  - Release pipeline: changeset-gated publish of @silvanexum/sdk + @silvanexum/mcp
    to npm with provenance (OIDC), silvanexum + silvanexum-mcp to PyPI via Trusted
    Publishing (sigstore attestations), and the M17 VSIX to VS Code Marketplace +
    Open VSX. CI runs the full PM matrix (npm/pnpm/yarn/bun · pip/uv/poetry) clean
    install + import, plus a CycloneDX SBOM. Registry pushes are inert until the
    publishing secrets/Environments are configured.
