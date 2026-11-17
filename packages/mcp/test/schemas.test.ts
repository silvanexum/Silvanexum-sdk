// MCP tool input schemas (schemas.ts). index.ts opens a stdio transport at
// import time (it is the server entrypoint), so we test the pure Zod raw shapes
// it feeds to registerTool instead: every tool exposes a well-formed input
// schema, and the validation contract (required vs optional, enum domains,
// numeric constraints) matches what each backend endpoint expects.
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
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
} from "../src/schemas.js";

// The 10 shapes are the inputSchema for the 10 registered tools in index.ts.
const SHAPES: Record<string, z.ZodRawShape> = {
  search_agents: searchAgentsShape,
  run_agent: runAgentShape,
  deploy_template: deployTemplateShape,
  get_agent: getAgentShape,
  get_reputation: getReputationShape,
  get_run: getRunShape,
  wallet_balance: walletBalanceShape,
  get_spending: getSpendingShape,
  list_budgets: listBudgetsShape,
  create_budget: createBudgetShape,
};

test("every tool shape is a valid ZodRawShape of Zod fields", () => {
  assert.equal(Object.keys(SHAPES).length, 10);
  for (const [tool, shape] of Object.entries(SHAPES)) {
    assert.equal(typeof shape, "object", `${tool} shape must be an object`);
    for (const [field, schema] of Object.entries(shape)) {
      assert.ok(schema instanceof z.ZodType, `${tool}.${field} must be a Zod schema`);
    }
    // Must build into a usable object validator (this is what registerTool does).
    assert.doesNotThrow(() => z.object(shape), `${tool} must form a Zod object`);
  }
});

test("required vs optional fields match each endpoint's contract", () => {
  // run_agent: both required
  assert.ok(!z.object(runAgentShape).safeParse({ agentId: "a" }).success, "prompt required");
  assert.ok(z.object(runAgentShape).safeParse({ agentId: "a", prompt: "hi" }).success);

  // id lookups: the single id is required
  assert.ok(!z.object(getAgentShape).safeParse({}).success);
  assert.ok(z.object(getAgentShape).safeParse({ agentId: "x" }).success);
  assert.ok(!z.object(getRunShape).safeParse({}).success);
  assert.ok(z.object(getRunShape).safeParse({ runId: "r" }).success);
  assert.ok(z.object(getReputationShape).safeParse({ agentId: "x" }).success);

  // wallet_balance: no input at all
  assert.deepEqual(Object.keys(walletBalanceShape), []);
  assert.ok(z.object(walletBalanceShape).safeParse({}).success);

  // search_agents / list_budgets / get_spending: all-optional (empty is valid)
  assert.ok(z.object(searchAgentsShape).safeParse({}).success);
  assert.ok(z.object(listBudgetsShape).safeParse({}).success);
  assert.ok(z.object(getSpendingShape).safeParse({}).success);

  // deploy_template: templateId required, params optional
  assert.ok(!z.object(deployTemplateShape).safeParse({}).success);
  assert.ok(z.object(deployTemplateShape).safeParse({ templateId: "t" }).success);
});

test("enum domains are pinned to the backend's allowed values", () => {
  const search = z.object(searchAgentsShape);
  assert.ok(search.safeParse({ sort: "proof" }).success);
  assert.ok(!search.safeParse({ sort: "cheapest" }).success, "unknown sort rejected");

  const spend = z.object(getSpendingShape);
  assert.ok(spend.safeParse({ groupBy: "project" }).success);
  assert.ok(!spend.safeParse({ groupBy: "team" }).success);

  const budgets = z.object(listBudgetsShape);
  assert.ok(budgets.safeParse({ scopeType: "agent" }).success);
  assert.ok(!budgets.safeParse({ scopeType: "galaxy" }).success);
});

test("create_budget enforces required fields, enums, and a positive limit", () => {
  const b = z.object(createBudgetShape);
  const valid = {
    name: "Q3 cap",
    scopeType: "org",
    periodType: "monthly",
    limitCredits: 1000,
    enforcement: "block",
  };
  assert.ok(b.safeParse(valid).success, "a complete budget validates");
  assert.ok(!b.safeParse({ ...valid, name: undefined }).success, "name required");
  assert.ok(!b.safeParse({ ...valid, scopeType: "nope" }).success, "scopeType enum");
  assert.ok(!b.safeParse({ ...valid, periodType: "yearly" }).success, "periodType enum");
  assert.ok(!b.safeParse({ ...valid, limitCredits: 0 }).success, "limit must be positive");
  assert.ok(!b.safeParse({ ...valid, limitCredits: -5 }).success);
  assert.ok(!b.safeParse({ ...valid, enforcement: "maybe" }).success, "enforcement enum");
  // scopeId + alertThresholdPct are optional
  assert.ok(b.safeParse({ ...valid, scopeId: "proj_1", alertThresholdPct: 80 }).success);
});
