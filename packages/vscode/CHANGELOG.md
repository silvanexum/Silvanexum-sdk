# Changelog

## 0.2.1

- When a run fails because no AI provider key is configured (`no_provider_key`), the extension now shows an **Add provider key** button that opens Settings → Keys, instead of a raw error.
- Pairs with a backend change: running someone else's (public) agent now uses **your** org's provider key (BYO), not the publisher's.

## 0.2.0

- **Agent FinOps surfaces.** The sidebar now leads with spend control:
  - **Spend** view — cost attribution (30d) grouped by agent/project/model/provider, plus a Spend dashboard with daily-spend and cost-by-provider charts.
  - **Budgets** view — create/delete spend caps (org or per-agent) with block/alert/off enforcement.
  - **Mesh** view — the agent→agent hop ledger rendered as a tree, with cost per hop and jump-to-run.
  - **Fleet** view — per-agent runs, p95, success, cost, and silent-drift flags.
  - **Budget-burn status bar** — surfaces the most-utilized enforcing budget.
  - Over-budget runs (402) now surface as actionable guidance instead of a raw error.
- **Fixes:** "My Agents" now lists only your org's agents (was including public ones); the run trace now shows the **Prompt**; the replay link is only shown for public runs (private runs no longer 404).

## 0.1.0

- Initial release. Sign in from the editor, browse the proof-ranked marketplace,
  run agents, view signed-trace replays, and publish/deploy from the command
  palette. Contributes the Silvanexum MCP server to the editor.
