import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fmtCredits,
  creditsToUsd,
  budgetTone,
  budgetSummary,
  buildHopTree,
  isBudgetExceeded,
  isNoProviderKey,
} from "../src/finops.js";
import { ApiError, type MeshCallView } from "../src/api.js";

// Minimal mesh call factory — only the fields buildHopTree reads matter.
function call(id: string, parentCallId: string | null): MeshCallView {
  return { id, parentCallId } as unknown as MeshCallView;
}

test("fmtCredits: coerces decimal strings and groups", () => {
  assert.equal(fmtCredits("1234.5"), "1,234.5");
  assert.equal(fmtCredits(1000), "1,000");
  assert.equal(fmtCredits("0"), "0");
});

test("fmtCredits: null/empty/garbage → em dash", () => {
  assert.equal(fmtCredits(null), "—");
  assert.equal(fmtCredits(undefined), "—");
  assert.equal(fmtCredits(""), "—");
  assert.equal(fmtCredits("not-a-number"), "—");
});

test("fmtCredits: respects digit cap", () => {
  assert.equal(fmtCredits("1.239", 2), "1.24");
  assert.equal(fmtCredits("1.239999", 6), "1.239999");
});

test("creditsToUsd: multiplies by rate, null when missing", () => {
  assert.equal(creditsToUsd("100", 0.01), "$1.00");
  assert.equal(creditsToUsd("100", null), null);
  assert.equal(creditsToUsd(null, 0.01), null);
  assert.equal(creditsToUsd("x", 0.01), null);
});

test("budgetTone: maps state → tone", () => {
  assert.equal(budgetTone("ok"), "ok");
  assert.equal(budgetTone("warn"), "warn");
  assert.equal(budgetTone("exceeded"), "error");
});

test("budgetSummary: rounds pct and appends enforcement", () => {
  assert.equal(budgetSummary(82.4, "block"), "82% · block");
  assert.equal(budgetSummary(NaN, "off"), "0% · off");
});

test("buildHopTree: nests children under parents", () => {
  // root -> a -> b ; root -> c
  const calls = [call("root", null), call("a", "root"), call("b", "a"), call("c", "root")];
  const roots = buildHopTree(calls);
  assert.equal(roots.length, 1);
  assert.equal(roots[0]!.call.id, "root");
  const childIds = roots[0]!.children.map((n) => n.call.id).sort();
  assert.deepEqual(childIds, ["a", "c"]);
  const a = roots[0]!.children.find((n) => n.call.id === "a")!;
  assert.deepEqual(a.children.map((n) => n.call.id), ["b"]);
});

test("buildHopTree: orphans (missing parent) become roots — nothing dropped", () => {
  const calls = [call("x", "ghost"), call("y", null)];
  const roots = buildHopTree(calls);
  assert.equal(roots.length, 2);
  assert.deepEqual(roots.map((r) => r.call.id).sort(), ["x", "y"]);
});

test("buildHopTree: self-parent doesn't infinite-loop", () => {
  const roots = buildHopTree([call("self", "self")]);
  assert.equal(roots.length, 1);
  assert.equal(roots[0]!.children.length, 0);
});

test("isBudgetExceeded: true on 402 or budget_exceeded code", () => {
  assert.equal(isBudgetExceeded(new ApiError("nope", 402)), true);
  assert.equal(isBudgetExceeded(new ApiError("nope", 400, "budget_exceeded")), true);
  assert.equal(isBudgetExceeded(new ApiError("other", 500, "server_error")), false);
  assert.equal(isBudgetExceeded(new Error("plain")), false);
});

test("isNoProviderKey: true on no_provider_key / seller_has_no_provider_key", () => {
  assert.equal(isNoProviderKey(new ApiError("x", 400, "no_provider_key")), true);
  assert.equal(isNoProviderKey(new ApiError("x", 400, "seller_has_no_provider_key")), true);
  assert.equal(isNoProviderKey(new ApiError("x", 402, "budget_exceeded")), false);
  assert.equal(isNoProviderKey(new Error("plain")), false);
});
