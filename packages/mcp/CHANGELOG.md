# @silvanexum/mcp

## 0.6.2

### Patch Changes

- 03a6024: Every tool now declares readOnlyHint / destructiveHint / idempotentHint / openWorldHint annotations, so MCP hosts can tell read tools from write tools.
  - @silvanexum/sdk@0.6.2

## 0.6.1

### Patch Changes

- 00a4a3b: README: add the MCPRush listing badge.
  - @silvanexum/sdk@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [316f864]
  - @silvanexum/sdk@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [54384c2]
  - @silvanexum/sdk@0.5.0

## 0.3.0

### Minor Changes

- f2efb51: Add Agent FinOps tools to the MCP server: `get_spending` (cost attribution by
  agent/project/model/provider), `list_budgets` (live spend + state), and
  `create_budget` (spend caps; `block` enforcement rejects breaching runs at 402).
  The Python SDK gains the `sx.gateway` resource (zero-code OpenAI capture), and
  `sx.budgets.create` now takes ergonomic snake_case params. Docs updated to match.

### Patch Changes

- @silvanexum/sdk@0.3.0

## 0.2.2

### Patch Changes

- Updated dependencies [a97d74c]
  - @silvanexum/sdk@0.2.2

## 0.2.1

### Patch Changes

- d85a2ef: Add the `mcpName` field (`io.github.silvanexum/silvanexum`) to the package
  manifest so the npm package can be ownership-verified when publishing the
  server to the official MCP Registry.
  - @silvanexum/sdk@0.2.1

## 0.2.0

### Minor Changes

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

- Updated dependencies [c04fe76]
- Updated dependencies [ba1d743]
- Updated dependencies [aa19201]
- Updated dependencies [30ae916]
  - @silvanexum/sdk@0.2.0
