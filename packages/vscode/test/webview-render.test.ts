import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTrace, renderSpend } from "../src/webview-render.js";
import type { Execution } from "../src/api.js";

function exec(over: Partial<Execution>): Execution {
  return {
    id: "11112222-3333-4444-5555-666677778888",
    status: "success",
    prompt: "Summarize the quarterly report",
    output: "Done.",
    latencyMs: 1200,
    signature: "sig",
    contentHash: "abc",
    trace: [],
    ...over,
  };
}

test("regression #2: the prompt is rendered in the trace", () => {
  const html = renderTrace(exec({ prompt: "Summarize the quarterly report" }), "https://silvanexum.com");
  assert.match(html, /<h2>Prompt<\/h2>/);
  assert.match(html, /Summarize the quarterly report/);
});

test("regression #3: private run shows NO public replay link", () => {
  const html = renderTrace(exec({ visibility: "private" }), "https://silvanexum.com");
  assert.doesNotMatch(html, /href="https:\/\/silvanexum\.com\/runs\//);
  assert.match(html, /private/);
});

test("regression #3: public run DOES show the replay link", () => {
  const e = exec({ visibility: "public" });
  const html = renderTrace(e, "https://silvanexum.com");
  assert.match(html, new RegExp(`href="https://silvanexum.com/runs/${e.id}"`));
  assert.match(html, /Open replayable run/);
});

test("trace escapes HTML in output (no injection)", () => {
  const html = renderTrace(exec({ output: "<script>alert(1)</script>" }), "https://silvanexum.com");
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test("renderSpend: totals summed across rows", () => {
  const html = renderSpend({
    groupBy: "agent",
    summary: [
      { key: "a", label: "Agent A", costCredits: "100.5", runs: 3 },
      { key: "b", label: "Agent B", costCredits: "50", runs: 2 },
    ],
    trends: [
      { ts: "2026-06-01T00:00:00Z", costCredits: "80", runs: 3 },
      { ts: "2026-06-02T00:00:00Z", costCredits: "0", runs: 0 },
    ],
    cost: [{ provider: "openai", model: "gpt-x", costCredits: "150.5", runs: 5 }],
  });
  assert.match(html, /150\.5/); // total credits
  assert.match(html, /Agent A/);
  assert.match(html, /openai\/gpt-x/);
  assert.match(html, /By agent/);
});

test("renderSpend: empty states are handled", () => {
  const html = renderSpend({ groupBy: "model", summary: [], trends: [], cost: [] });
  assert.match(html, /No spend recorded\./);
  assert.match(html, /No trend data\./);
});
