import { test } from "node:test";
import assert from "node:assert/strict";
import { Silvanexum, BudgetExceededError, usageFromResponse } from "../src/index.js";
import type { FetchLike } from "../src/core/http.js";

function mockFetch(handler: (url: string, body: unknown) => { status: number; json?: unknown }) {
  const calls: Array<{ url: string; body: any }> = [];
  const fetch: FetchLike = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, body });
    const { status, json } = handler(url, body);
    const text = json === undefined ? "" : JSON.stringify(json);
    return { ok: status >= 200 && status < 300, status, headers: { get: () => null }, text: async () => text };
  };
  return { fetch, calls };
}

test("usageFromResponse normalizes OpenAI, Anthropic (cache added back) and Gemini (thoughts as output)", () => {
  assert.deepEqual(usageFromResponse("openai", { usage: { prompt_tokens: 900, completion_tokens: 300, prompt_tokens_details: { cached_tokens: 400 } } }), {
    inputTokens: 900, outputTokens: 300, cacheReadTokens: 400, cacheWriteTokens: 0,
  });
  assert.deepEqual(usageFromResponse("anthropic", { usage: { input_tokens: 100, cache_read_input_tokens: 2000, cache_creation_input_tokens: 500, output_tokens: 640 } }), {
    inputTokens: 2600, outputTokens: 640, cacheReadTokens: 2000, cacheWriteTokens: 500,
  });
  assert.deepEqual(usageFromResponse("google", { usageMetadata: { promptTokenCount: 1500, candidatesTokenCount: 400, thoughtsTokenCount: 100, cachedContentTokenCount: 1000 } }), {
    inputTokens: 1500, outputTokens: 500, cacheReadTokens: 1000, cacheWriteTokens: 0,
  });
});

test("track() passes the result through and reports usage + attribution", async () => {
  const { fetch, calls } = mockFetch(() => ({ status: 200, json: { recorded: 1, costCredits: 0.1 } }));
  const sx = new Silvanexum({ apiKey: "sx_test", baseUrl: "https://api.test", fetch });
  const result = await sx.meter.track("anthropic", "claude-sonnet-5-5", { customer: "acme", agent: "ranker" }, async () => ({
    content: [{ type: "text", text: "hi" }],
    usage: { input_tokens: 5, output_tokens: 7 },
  }));
  assert.equal(result.content[0]!.text, "hi");
  assert.equal(calls[0]!.url, "https://api.test/meter/events");
  const ev = calls[0]!.body.events[0];
  assert.equal(ev.provider, "anthropic");
  assert.equal(ev.inputTokens, 5);
  assert.equal(ev.outputTokens, 7);
  assert.equal(ev.customer, "acme");
  assert.equal(ev.status, "success");
});

test("track() reports errors and rethrows the caller's error; report failures are swallowed", async () => {
  const { fetch, calls } = mockFetch(() => ({ status: 500, json: { error: "boom" } }));
  const sx = new Silvanexum({ apiKey: "sx_test", baseUrl: "https://api.test", fetch, maxRetries: 0 });
  const warn = console.warn;
  console.warn = () => {};
  try {
    await assert.rejects(sx.meter.track("openai", "gpt-4o", {}, async () => { throw new Error("provider down"); }), /provider down/);
  } finally {
    console.warn = warn;
  }
  assert.equal(calls[0]!.body.events[0].status, "error");
});

test("check() resolves allowed:false on 402 and track({check}) never runs the call", async () => {
  const { fetch } = mockFetch((url) =>
    url.endsWith("/meter/check")
      ? { status: 402, json: { allowed: false, error: "budget_exceeded", message: "exhausted" } }
      : { status: 200, json: {} },
  );
  const sx = new Silvanexum({ apiKey: "sx_test", baseUrl: "https://api.test", fetch, maxRetries: 0 });
  assert.deepEqual((await sx.meter.check({ customer: "acme" })).allowed, false);
  let ran = false;
  await assert.rejects(
    sx.meter.track("google", "gemini-2.5-flash", { check: true }, async () => { ran = true; }),
    BudgetExceededError,
  );
  assert.equal(ran, false);
});

test("gateway exposes per-provider base URLs", () => {
  const sx = new Silvanexum({ apiKey: "sx_test", baseUrl: "https://api.test", fetch: mockFetch(() => ({ status: 200 })).fetch });
  assert.equal(sx.gateway.anthropicBaseUrl(), "https://api.test/gateway/anthropic");
  assert.equal(sx.gateway.googleBaseUrl(), "https://api.test/gateway/google");
  assert.equal(sx.gateway.nvidiaBaseUrl(), "https://api.test/gateway/nvidia/v1");
  assert.equal(sx.gateway.nimBaseUrl(), "https://api.test/gateway/nim/v1");
});

test("usageFromResponse reads NVIDIA NIM (hosted and self-hosted) like OpenAI", () => {
  const response = { usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 } };
  const expected = { inputTokens: 1000, outputTokens: 500, cacheReadTokens: 0, cacheWriteTokens: 0 };
  assert.deepEqual(usageFromResponse("nvidia", response), expected);
  assert.deepEqual(usageFromResponse("nim", response), expected);
});
