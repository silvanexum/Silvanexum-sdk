import { test } from "node:test";
import assert from "node:assert/strict";
import { Silvanexum, AuthenticationError, RateLimitError } from "../src/index.js";
import type { FetchLike } from "../src/core/http.js";

interface Call {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** Build a fake fetch that records calls and returns a scripted response. */
function mockFetch(
  handler: (call: Call) => { status: number; json?: unknown; headers?: Record<string, string> },
): { fetch: FetchLike; calls: Call[] } {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    const call: Call = { url, method: init?.method, headers: init?.headers, body: init?.body };
    calls.push(call);
    const { status, json, headers = {} } = handler(call);
    const text = json === undefined ? "" : JSON.stringify(json);
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
      text: async () => text,
    };
  };
  return { fetch, calls };
}

test("sends bearer auth + unwraps the envelope for list()", async () => {
  const { fetch, calls } = mockFetch(() => ({
    status: 200,
    json: { agents: [{ id: "a1", name: "Support" }] },
  }));
  const sx = new Silvanexum({ apiKey: "sx_test_123", baseUrl: "https://api.test", fetch });

  const agents = await sx.agents.list();

  assert.equal(agents.length, 1);
  assert.equal(agents[0]!.id, "a1");
  assert.equal(calls[0]!.url, "https://api.test/agents");
  assert.equal(calls[0]!.headers!.Authorization, "Bearer sx_test_123");
});

test("serializes query params and body", async () => {
  const { fetch, calls } = mockFetch(() => ({ status: 200, json: { results: [] } }));
  const sx = new Silvanexum({ apiKey: "k", baseUrl: "https://api.test", fetch });

  await sx.marketplace.search({ q: "legal agent", sort: "proof" });

  assert.match(calls[0]!.url, /\/marketplace\/search\?/);
  assert.match(calls[0]!.url, /q=legal%20agent/);
  assert.match(calls[0]!.url, /sort=proof/);
});

test("attaches idempotency-key on purchase", async () => {
  const { fetch, calls } = mockFetch(() => ({ status: 200, json: { purchaseId: "p1" } }));
  const sx = new Silvanexum({ apiKey: "k", baseUrl: "https://api.test", fetch });

  await sx.marketplace.purchase("listing_1", "idem-abc");

  assert.equal(calls[0]!.headers!["idempotency-key"], "idem-abc");
});

test("maps 401 to AuthenticationError with message", async () => {
  const { fetch } = mockFetch(() => ({ status: 401, json: { message: "bad key" } }));
  const sx = new Silvanexum({ apiKey: "k", baseUrl: "https://api.test", fetch, maxRetries: 0 });

  await assert.rejects(() => sx.agents.list(), (err: unknown) => {
    assert.ok(err instanceof AuthenticationError);
    assert.equal((err as AuthenticationError).status, 401);
    assert.equal((err as AuthenticationError).message, "bad key");
    return true;
  });
});

test("retries 429 then succeeds", async () => {
  let n = 0;
  const { fetch, calls } = mockFetch(() => {
    n++;
    return n === 1 ? { status: 429, json: { message: "slow down" } } : { status: 200, json: { agents: [] } };
  });
  const sx = new Silvanexum({ apiKey: "k", baseUrl: "https://api.test", fetch, maxRetries: 2 });

  const agents = await sx.agents.list();
  assert.deepEqual(agents, []);
  assert.equal(calls.length, 2);
});

test("gives up after maxRetries on persistent 429", async () => {
  const { fetch } = mockFetch(() => ({ status: 429, json: { message: "nope" } }));
  const sx = new Silvanexum({ apiKey: "k", baseUrl: "https://api.test", fetch, maxRetries: 1 });
  await assert.rejects(() => sx.agents.list(), RateLimitError);
});

test("throws a clear error when no api key is provided", () => {
  const prev = process.env.SILVANEXUM_API_KEY;
  delete process.env.SILVANEXUM_API_KEY;
  try {
    assert.throws(() => new Silvanexum({ baseUrl: "https://api.test" }), /Missing API key/);
  } finally {
    if (prev !== undefined) process.env.SILVANEXUM_API_KEY = prev;
  }
});
