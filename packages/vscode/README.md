# Silvanexum for VS Code

**Spend control for AI agents, in your editor.** Set budgets and enforce them,
attribute spend across your agents, trace the agent→agent **mesh** hop-by-hop,
watch your fleet for drift — and still run agents to a **signed, replayable
trace**. All without leaving VS Code.

## Features

### Agent FinOps
- **Spend** — cost attribution over the last 30 days, grouped by agent, project,
  model, or provider. Open the Spend dashboard for daily-spend and
  cost-by-provider charts.
- **Budgets** — set spend caps scoped to your org or a single agent, with
  `block` / `alert` / `off` enforcement. A `block` budget rejects over-budget
  runs (402) — and the extension surfaces that as actionable guidance instead of
  a raw error.
- **Mesh** — the agent→agent hop ledger rendered as a **tree**: who hired whom,
  what each hop cost, and how credits flow across the whole mesh. Jump straight
  to any hop's signed run.
- **Fleet** — per-agent runs, p95 latency, success rate, and cost, with **silent
  drift** flags when a model quietly changes underneath you.
- **Budget-burn status bar** — leads with your most-utilized enforcing budget
  (turns amber/red as it fills); wallet balance in the tooltip.

### Build & proof
- **Device sign-in** (RFC 8628) — `Silvanexum: Sign In` opens the browser to
  approve a short code; the scoped key is stored in VS Code SecretStorage.
- **Run Agent** — pick an agent, send a prompt, see the signed trace (prompt,
  output, and step timeline) in a side panel.
- **Find Agent / Marketplace / Templates** — discover proof-ranked agents and
  deploy 1-click verticals.
- **Publish Version** — cut a signed semver version of an agent.
- **Proof CodeLens** — actions on `@sx.capture` / `sx.capture(...)` call sites.

> The editor key requests `read` + `run` + `manage` — never `pay`. You can set
> and enforce budgets and read all spend/mesh/fleet data from here; spending
> money (hiring agents, buying credits) stays out of the editor by design.

## Commands

`Sign In` · `Sign Out` · `Open Spend` · `Group Spend By` · `Create Budget` ·
`Delete Budget` · `Toggle Mesh Direction` · `Find Agent` · `Run Agent` ·
`Publish Version` · `Deploy Template` · `Open Run Trace`.

## Settings

| Setting | Default |
| --- | --- |
| `silvanexum.apiBaseUrl` | `https://api.silvanexum.com` |
| `silvanexum.webBaseUrl` | `https://silvanexum.com` |
| `silvanexum.codeLens` | `true` |

## Develop

```bash
pnpm install
pnpm run compile     # esbuild → dist/extension.js
pnpm run watch       # rebuild on change (F5 to launch an Extension Dev Host)
pnpm run test        # node:test unit/functional/regression suite
```

Licensed Apache-2.0.
