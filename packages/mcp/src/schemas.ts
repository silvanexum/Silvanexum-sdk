/**
 * MCP tool input schemas — DERIVED FROM the backend Zod contracts, not hand-written.
 *
 * The backend's `src/shared/*` Zod schemas are the single source of truth for the
 * API. `pnpm generate` emits their TypeScript shapes into
 * `@silvanexum/sdk` (`packages/sdk-ts/src/generated/types.ts`) as `*Input`
 * interfaces. Here we declare each tool's input as a Zod raw shape and BIND it to
 * the corresponding generated interface with a compile-time conformance check
 * (`assertExtends` below). If a backend contract changes and the codegen output
 * shifts, the binding stops type-checking — so a tool's input schema can never
 * silently drift from the endpoint it adapts. This is the MCP-side equivalent of
 * the SDK's generated-types discipline (M18 §10, "schemas generated from
 * src/shared/* Zod").
 *
 * The MCP SDK's `registerTool` takes a `ZodRawShape` (a record of Zod field
 * schemas) as `inputSchema`, which is exactly what we export here.
 */
import { z } from "zod";
import type {
  MarketplaceSearchInput,
  PlaygroundRunInput,
  DeployTemplateInput,
} from "@silvanexum/sdk";

/**
 * An id supplied by the model. These become path segments in the SDK (e.g.
 * `/agents/${agentId}`), so they must never contain characters that could
 * redirect the request to another endpoint (path traversal via `..`, extra
 * segments via `/`, or query/fragment smuggling via `?`/`#`). The backend ids
 * are UUIDs or slugs, so this conservative allowlist is safe and defends the
 * tool surface against prompt-injected ids. Stays assignable to `string`, so the
 * generated-contract conformance checks still hold.
 */
const idString = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_.-]+$/, "must not contain path separators or special characters")
  .refine((s) => !s.includes(".."), "must not contain '..'");

/**
 * Compile-time guard: assert that the Zod-inferred input is structurally
 * compatible with the generated contract type. `Contract extends Inferred`
 * proves every contract-required field is accepted by the Zod schema (the schema
 * never demands a field the contract lacks); the reverse direction is allowed to
 * be wider only via explicit optionals. A drift in the generated type breaks
 * this assignment and fails `pnpm typecheck`.
 */
type AssertExtends<Contract, Inferred> = Contract extends Inferred ? true : never;

// ── search_agents ⇐ MarketplaceSearchInput ─────────────────────────────────────
export const searchAgentsShape = {
  q: z.string().optional().describe("Free-text query, e.g. 'legal contract review'."),
  category: z.string().optional().describe("Filter by listing category."),
  sort: z
    .enum(["proof", "recent", "price"])
    .optional()
    .describe("Ranking. Default: proof (by signed-run corpus + reputation)."),
} satisfies z.ZodRawShape;

type SearchAgentsInferred = z.infer<z.ZodObject<typeof searchAgentsShape>>;
// `limit` is server-defaulted, so the tool omits it; the rest must conform.
const _searchConforms: AssertExtends<
  Omit<MarketplaceSearchInput, "limit">,
  SearchAgentsInferred
> = true;
void _searchConforms;

// ── run_agent ⇐ PlaygroundRunInput ──────────────────────────────────────────────
export const runAgentShape = {
  agentId: idString.describe("The agent id to run."),
  prompt: z.string().describe("The input/instruction for the agent."),
} satisfies z.ZodRawShape;

type RunAgentInferred = z.infer<z.ZodObject<typeof runAgentShape>>;
const _runConforms: AssertExtends<PlaygroundRunInput, RunAgentInferred> = true;
void _runConforms;

// ── deploy_template ⇐ DeployTemplateInput ───────────────────────────────────────
export const deployTemplateShape = {
  templateId: idString.describe("The template id to deploy."),
  params: z
    .record(z.string())
    .optional()
    .describe("Template parameter values (key → value)."),
} satisfies z.ZodRawShape;

type DeployTemplateInferred = z.infer<z.ZodObject<typeof deployTemplateShape>>;
// templateId is a path param (not in the body contract); the body fields conform.
const _deployConforms: AssertExtends<
  Pick<DeployTemplateInput, "params">,
  Pick<DeployTemplateInferred, "params">
> = true;
void _deployConforms;

// ── Tools with no backend body contract (path-only / no input) ──────────────────
// get_agent / get_reputation / get_run take an id (path param, no Zod body);
// wallet_balance takes nothing. We declare these locally — there is no contract
// to drift from.
export const getAgentShape = {
  agentId: idString.describe("The agent id."),
} satisfies z.ZodRawShape;

export const getReputationShape = {
  agentId: idString.describe("The agent id."),
} satisfies z.ZodRawShape;

export const getRunShape = {
  runId: idString.describe("The run/execution id."),
} satisfies z.ZodRawShape;

export const walletBalanceShape = {} satisfies z.ZodRawShape;

// ── Agent FinOps: cost attribution + spend governance ───────────────────────────
// Enum values mirror the backend contracts (src/shared/spending.ts, budgets.ts).
export const getSpendingShape = {
  groupBy: z
    .enum(["agent", "project", "model", "provider"])
    .optional()
    .describe("Dimension to attribute spend by. Default: agent."),
  // "since" (not "from"): keeps the contract identical on the Python server,
  // where `from` is a reserved word and can't be a tool argument (testlab S2).
  since: z.string().optional().describe("Window start — relative ('-7d', '-24h') or ISO. Default -30d."),
  to: z.string().optional().describe("Window end — ISO. Default now."),
} satisfies z.ZodRawShape;

export const listBudgetsShape = {
  scopeType: z
    .enum(["org", "project", "agent"])
    .optional()
    .describe("Filter budgets by scope."),
} satisfies z.ZodRawShape;

export const createBudgetShape = {
  name: z.string().describe("Human label for the budget."),
  scopeType: z.enum(["org", "project", "agent"]).describe("What the cap applies to."),
  scopeId: z.string().optional().describe("The project/agent id — required unless scopeType is 'org'."),
  periodType: z
    .enum(["daily", "weekly", "monthly", "rolling_30d", "custom"])
    .describe("Reset cadence for the cap."),
  limitCredits: z.number().positive().describe("Spend cap in credits for the period."),
  enforcement: z
    .enum(["off", "alert", "block"])
    .optional()
    .describe("'block' rejects a breaching run/hop (HTTP 402); 'alert' only warns. Default block."),
  alertThresholdPct: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Percent of the cap that flips state to 'warn'. Default 80."),
} satisfies z.ZodRawShape;
