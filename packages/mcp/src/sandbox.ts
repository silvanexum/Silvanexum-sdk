/**
 * Sandbox mode — what the MCP server serves when no SILVANEXUM_API_KEY is set.
 *
 * Instead of exiting (which made `npx @silvanexum/mcp` look broken on first run),
 * the server starts and each tool returns realistic SAMPLE data, clearly marked,
 * so a developer can see the tools work inside their MCP host before signing up.
 * Every payload carries a `note` pointing at the free-key signup.
 */

export const SIGNUP_URL = "https://silvanexum.com/signup";

function note(): string {
  return `SANDBOX — sample data. Get a free key (read+run) to see your own agents & live spend: ${SIGNUP_URL}`;
}

/** Wrap any sample payload with the sandbox marker + signup note. */
export function sample(data: unknown): { sandbox: true; note: string; data: unknown } {
  return { sandbox: true, note: note(), data };
}

export const sandboxData = {
  searchAgents: () => [
    {
      listingId: "lst_demo_contract",
      agentId: "agt_demo_contract",
      title: "Contract Review Analyst",
      category: "legal",
      proofScore: 0.92,
      trustScore: 0.89,
      totalRuns: 1284,
      confidence: "high",
      pricing: "per_run",
    },
    {
      listingId: "lst_demo_support",
      agentId: "agt_demo_support",
      title: "Tier-1 Support Triage",
      category: "support",
      proofScore: 0.81,
      trustScore: 0.77,
      totalRuns: 452,
      confidence: "medium",
      pricing: "free",
    },
  ],

  getAgent: (agentId: string) => ({
    id: agentId,
    name: "Contract Review Analyst",
    description: "Extracts obligations, dates, and risk flags from commercial contracts.",
    visibility: "public",
    reputation: { trustScore: 0.89, successRate: 0.94, totalRuns: 1284, confidence: "high" },
  }),

  getReputation: (agentId: string) => ({
    agentId,
    trustScore: 0.89,
    successRate: 0.94,
    totalRuns: 1284,
    confidence: "high",
  }),

  runAgent: (agentId: string, prompt: string) => ({
    runId: "run_demo_9f2a",
    status: "success",
    output: `[sample output] Analyzed the prompt (“${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}”) with ${agentId}. In sandbox this is a canned response; a real run is captured, secret-scrubbed, and cryptographically signed.`,
    latencyMs: 1840,
    signed: true,
    contentHash: "sha256:demo…c0ffee",
    replayUrl: "https://silvanexum.com/runs/run_demo_9f2a",
  }),

  getRun: (runId: string) => ({
    runId,
    status: "success",
    output: "[sample output] The signed trace of a completed run.",
    signed: true,
    contentHash: "sha256:demo…c0ffee",
    trace: [
      { step: 1, type: "model", model: "gpt-4o-mini", tokensIn: 1200, tokensOut: 340 },
      { step: 2, type: "tool", name: "extract_clauses" },
    ],
    replayUrl: `https://silvanexum.com/runs/${runId}`,
  }),

  deployTemplate: (templateId: string) => ({
    id: "agt_demo_from_template",
    name: "My Deployed Agent",
    fromTemplate: templateId,
    visibility: "private",
  }),

  walletBalance: () => ({
    balanceCredits: "2500.00",
    pendingEarningsCredits: "0.00",
    creditValueUsd: 0.001,
  }),

  getSpending: (groupBy: string | undefined) => {
    const dim = groupBy ?? "agent";
    const rows: Record<string, { key: string; spentCredits: string; runs: number }[]> = {
      agent: [
        { key: "Contract Review Analyst", spentCredits: "1420.50", runs: 612 },
        { key: "Tier-1 Support Triage", spentCredits: "388.00", runs: 240 },
      ],
      model: [
        { key: "gpt-4o", spentCredits: "1210.00", runs: 402 },
        { key: "claude-sonnet", spentCredits: "598.50", runs: 450 },
      ],
      provider: [{ key: "openai", spentCredits: "1210.00", runs: 402 }],
      project: [{ key: "prod", spentCredits: "1808.50", runs: 852 }],
    };
    return { groupBy: dim, rows: rows[dim] ?? rows.agent };
  },

  listBudgets: () => [
    {
      id: "bdg_demo_prod",
      name: "Prod monthly cap",
      scopeType: "org",
      periodType: "monthly",
      limitCredits: "5000.00",
      spentCredits: "1808.50",
      remainingCredits: "3191.50",
      usedPct: 36,
      state: "ok",
      enforcement: "block",
    },
  ],

  createBudget: (input: { name: string; scopeType: string; periodType: string; limitCredits: number }) => ({
    id: "bdg_demo_new",
    ...input,
    limitCredits: input.limitCredits.toFixed(2),
    spentCredits: "0.00",
    state: "ok",
    note: "In sandbox no budget is persisted. Sign up to create real, enforced caps.",
  }),
};
