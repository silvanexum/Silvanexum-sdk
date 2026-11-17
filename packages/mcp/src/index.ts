/**
 * Silvanexum MCP server.
 *
 * Exposes proof-ranked agent discovery, signed runs, reputation, and
 * credit-metered execution as Model Context Protocol tools, so any MCP host
 * (Claude Desktop, Claude Code, Cursor, Windsurf, …) can use Silvanexum natively.
 *
 *   npx -y @silvanexum/mcp        (with SILVANEXUM_API_KEY in the environment)
 *
 * Auth: a scoped API key via SILVANEXUM_API_KEY. Grant `read`+`run` — never `pay`
 * by default. Every run_agent result links a signed, replayable trace.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Silvanexum, SilvanexumError } from "@silvanexum/sdk";
import {
  searchAgentsShape,
  runAgentShape,
  deployTemplateShape,
  getAgentShape,
  getReputationShape,
  getRunShape,
  walletBalanceShape,
  getSpendingShape,
  listBudgetsShape,
  createBudgetShape,
} from "./schemas.js";
import { SIGNUP_URL, sample, sandboxData } from "./sandbox.js";
import { fireActivation } from "./telemetry.js";

// Keep in sync with package.json "version" (reported in the MCP handshake).
const VERSION = "0.4.0";

function fail(message: string): never {
  process.stderr.write(`silvanexum-mcp: ${message}\n`);
  process.exit(1);
}

// No key → SANDBOX mode: the server still starts and every tool returns clearly
// marked sample data, so the developer sees it work in their host and can then
// grab a free key. (Previously a missing key exited the process, which read as
// "broken extension" on first run — the #1 reason installs never converted.)
const apiKey = process.env.SILVANEXUM_API_KEY;
const SANDBOX = !apiKey;

const sx = SANDBOX
  ? null
  : new Silvanexum({ apiKey, baseUrl: process.env.SILVANEXUM_BASE_URL });
const webBaseUrl = process.env.SILVANEXUM_WEB_URL ?? "https://silvanexum.com";

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function ok(value: unknown): ToolResult {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text }] };
}

/** Run an SDK call, turning any failure into a legible MCP error result. */
async function guard(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (e) {
    const msg =
      e instanceof SilvanexumError
        ? `${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`
        : e instanceof Error
          ? e.message
          : String(e);
    return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
  }
}

const server = new McpServer({ name: "silvanexum", version: VERSION });

server.registerTool(
  "search_agents",
  {
    title: "Search agents",
    description:
      "Search the Silvanexum marketplace for agents, ranked by PROVEN OUTCOMES (real run corpus + reputation), not stars. Returns proof-ranked listings.",
    inputSchema: searchAgentsShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  ({ q, sort, category }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.searchAgents()));
      const results = await sx!.marketplace.search({ q, sort, category });
      return ok(
        results.map((r) => ({
          listingId: r.id,
          agentId: r.agentId,
          title: r.title,
          category: r.category,
          proofScore: r.proofScore,
          trustScore: r.proof?.trustScore ?? null,
          totalRuns: r.proof?.totalRuns ?? 0,
          confidence: r.proof?.confidence ?? "none",
          pricing: r.pricing?.model ?? "free",
        })),
      );
    }),
);

server.registerTool(
  "get_agent",
  {
    title: "Get agent",
    description: "Fetch an agent's configuration and earned reputation by id.",
    inputSchema: getAgentShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  ({ agentId }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.getAgent(agentId)));
      const { agent } = await sx!.agents.get(agentId);
      return ok(agent);
    }),
);

server.registerTool(
  "get_reputation",
  {
    title: "Get reputation",
    description:
      "Get an agent's earned reputation — volume-aware trust score, success rate, and confidence, derived from signed runs.",
    inputSchema: getReputationShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  ({ agentId }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.getReputation(agentId)));
      const { agent } = await sx!.agents.get(agentId);
      return ok(agent.reputation ?? { note: "No reputation yet — the agent has no signed runs." });
    }),
);

server.registerTool(
  "run_agent",
  {
    title: "Run agent",
    description:
      "Run an agent on a prompt. The run is captured, secret-scrubbed, and cryptographically signed. Returns the answer plus a replayable, signed trace URL. Requires the `run` scope.",
    inputSchema: runAgentShape,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  ({ agentId, prompt }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.runAgent(agentId, prompt)));
      const run = await sx!.runs.create({ agentId, prompt });
      return ok({
        runId: run.id,
        status: run.status,
        output: run.output,
        latencyMs: run.latencyMs,
        signed: Boolean(run.signature),
        contentHash: run.contentHash,
        replayUrl: sx!.runs.shareUrl(run.id, webBaseUrl),
      });
    }),
);

server.registerTool(
  "get_run",
  {
    title: "Get run",
    description: "Fetch a run's full signed trace (the step-by-step model/tool/agent timeline) by id.",
    inputSchema: getRunShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  ({ runId }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.getRun(runId)));
      const run = await sx!.runs.get(runId);
      return ok({
        runId: run.id,
        status: run.status,
        output: run.output,
        signed: Boolean(run.signature),
        contentHash: run.contentHash,
        trace: run.trace,
        replayUrl: sx!.runs.shareUrl(run.id, webBaseUrl),
      });
    }),
);

server.registerTool(
  "deploy_template",
  {
    title: "Deploy template",
    description:
      "Deploy a 1-click vertical agent template into a ready, signed agent (M11). Note: template endpoints may be 'planned' / not yet live on a given deployment.",
    inputSchema: deployTemplateShape,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  ({ templateId, params }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.deployTemplate(templateId)));
      const agent = await sx!.templates.deploy(templateId, { params: params ?? {} });
      return ok(agent);
    }),
);

server.registerTool(
  "wallet_balance",
  {
    title: "Wallet balance",
    description: "Get the org's credit balance and recent ledger activity.",
    inputSchema: walletBalanceShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  () =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.walletBalance()));
      const w = await sx!.wallet.get();
      return ok({
        balanceCredits: w.balanceCredits,
        pendingEarningsCredits: w.pendingEarningsCredits,
        creditValueUsd: w.creditValueUsd,
      });
    }),
);

server.registerTool(
  "get_spending",
  {
    title: "Get spending",
    description:
      "Agent FinOps — cost attribution. Spend rolled up by a dimension (agent / project / model / provider) over a time window, from real run telemetry + the mesh ledger. Read-only. Answers 'which agent/model burned the budget?'.",
    inputSchema: getSpendingShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  ({ groupBy, since, to }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.getSpending(groupBy)));
      const rows = await sx!.spending.summary({ groupBy, from: since, to });
      return ok(rows);
    }),
);

server.registerTool(
  "list_budgets",
  {
    title: "List budgets",
    description:
      "Agent FinOps — list spend caps (budgets), each with its live computed spend, remaining, and state (ok / warn / exceeded) for the current period.",
    inputSchema: listBudgetsShape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  ({ scopeType }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.listBudgets()));
      const budgets = await sx!.budgets.list({ scopeType });
      return ok(budgets);
    }),
);

server.registerTool(
  "create_budget",
  {
    title: "Create budget",
    description:
      "Agent FinOps — create a spend cap over an org / project / agent for a period. With enforcement 'block', a run or mesh hop that would breach the cap is rejected server-side (HTTP 402). Requires a key with write scope.",
    inputSchema: createBudgetShape,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  ({ name, scopeType, scopeId, periodType, limitCredits, enforcement, alertThresholdPct }) =>
    guard(async () => {
      if (SANDBOX) return ok(sample(sandboxData.createBudget({ name, scopeType, periodType, limitCredits })));
      const budget = await sx!.budgets.create({
        name,
        scopeType,
        scopeId,
        periodType,
        limitCredits,
        enforcement,
        alertThresholdPct,
      });
      return ok(budget);
    }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  fireActivation({ surface: "mcp-ts", version: VERSION, mode: SANDBOX ? "sandbox" : "keyed" });
  if (SANDBOX) {
    process.stderr.write(
      `silvanexum-mcp ${VERSION} ready — SANDBOX MODE (no SILVANEXUM_API_KEY set).\n` +
        `  Tools return sample data so you can try them right now.\n` +
        `  Get a free key (read+run) to use your own agents & live spend:\n` +
        `    ${SIGNUP_URL}\n` +
        `  Then set SILVANEXUM_API_KEY and restart.\n`,
    );
  } else {
    process.stderr.write(`silvanexum-mcp ${VERSION} ready (base: ${sx!.baseUrl})\n`);
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
