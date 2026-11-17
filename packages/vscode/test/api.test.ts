import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Api, ApiError } from "../src/api.js";

// ── fetch mock ────────────────────────────────────────────────────────────────
interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}
let calls: Captured[] = [];
const realFetch = globalThis.fetch;

function mockFetch(status: number, bodyObj: unknown): void {
  globalThis.fetch = (async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body });
    const text = bodyObj === undefined ? "" : JSON.stringify(bodyObj);
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => text,
    } as Response;
  }) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  calls = [];
});

const BASE = "https://api.test";
const api = (token?: string) => new Api(BASE, token);

test("regression #1: listMyAgents hits /agents/mine (not /agents)", async () => {
  mockFetch(200, { agents: [{ id: "a1", name: "Solo" }] });
  const agents = await api("sx_live_x").listMyAgents();
  assert.equal(calls[0]!.url, `${BASE}/agents/mine`);
  assert.equal(calls[0]!.method, "GET");
  assert.equal(agents[0]!.name, "Solo");
});

test("listAgents still hits the org+public /agents endpoint", async () => {
  mockFetch(200, { agents: [] });
  await api("t").listAgents();
  assert.equal(calls[0]!.url, `${BASE}/agents`);
});

test("auth: bearer token attached when present, absent otherwise", async () => {
  mockFetch(200, { agents: [] });
  await api("sx_live_secret").listMyAgents();
  assert.equal(calls[0]!.headers["Authorization"], "Bearer sx_live_secret");
  calls = [];
  mockFetch(200, { agents: [] });
  await api().listMyAgents();
  assert.equal(calls[0]!.headers["Authorization"], undefined);
});

test("listBudgets: scopeType becomes a query param", async () => {
  mockFetch(200, { budgets: [] });
  await api("t").listBudgets("agent");
  assert.equal(calls[0]!.url, `${BASE}/budgets?scopeType=agent`);
  calls = [];
  mockFetch(200, { budgets: [] });
  await api("t").listBudgets();
  assert.equal(calls[0]!.url, `${BASE}/budgets`);
});

test("createBudget: POST with JSON body + content-type", async () => {
  mockFetch(201, { budget: {}, status: {} });
  await api("t").createBudget({ name: "Cap", scopeType: "org", periodType: "monthly", limitCredits: 1000 });
  assert.equal(calls[0]!.method, "POST");
  assert.equal(calls[0]!.url, `${BASE}/budgets`);
  assert.equal(calls[0]!.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0]!.body!), {
    name: "Cap",
    scopeType: "org",
    periodType: "monthly",
    limitCredits: 1000,
  });
});

test("deleteBudget: DELETE, empty 204 body resolves", async () => {
  mockFetch(204, undefined);
  await api("t").deleteBudget("b1");
  assert.equal(calls[0]!.method, "DELETE");
  assert.equal(calls[0]!.url, `${BASE}/budgets/b1`);
});

test("spendingSummary: query params are encoded", async () => {
  mockFetch(200, { rows: [] });
  await api("t").spendingSummary({ groupBy: "provider", from: "-30d" });
  assert.equal(calls[0]!.url, `${BASE}/spending/summary?groupBy=provider&from=-30d`);
});

test("listMeshCalls: direction + limit in path", async () => {
  mockFetch(200, { calls: [], nextCursor: null });
  await api("t").listMeshCalls("incoming", 50);
  assert.equal(calls[0]!.url, `${BASE}/mesh/calls?direction=incoming&limit=50`);
});

test("error mapping: non-2xx → ApiError carrying status + code + message", async () => {
  mockFetch(402, { error: "budget_exceeded", message: "Budget 'Cap' exhausted" });
  await assert.rejects(
    () => api("t").runAgent("a1", "hi"),
    (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 402);
      assert.equal(e.code, "budget_exceeded");
      assert.equal(e.message, "Budget 'Cap' exhausted");
      return true;
    },
  );
});

test("devicePollOnce: authorization_pending → null; success → token", async () => {
  mockFetch(400, { error: "authorization_pending" });
  assert.equal(await Api.devicePollOnce(BASE, "dc"), null);
  calls = [];
  mockFetch(200, { access_token: "sx_live_new" });
  assert.equal(await Api.devicePollOnce(BASE, "dc"), "sx_live_new");
});
