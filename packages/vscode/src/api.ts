// Minimal HTTP client for the extension host (Node 20 global fetch). Kept
// self-contained so the extension doesn't bundle the full SDK; the surface it
// needs is small. Mirrors the @silvanexum/sdk shapes loosely.

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export class Api {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async req<T>(
    method: string,
    path: string,
    opts: { body?: unknown; auth?: boolean } = {},
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.auth !== false && this.token) headers["Authorization"] = `Bearer ${this.token}`;

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (e) {
      throw new ApiError(`Can't reach ${this.baseUrl}. ${(e as Error).message}`, 0);
    }
    const text = await res.text();
    const data = text ? safeParse(text) : undefined;
    if (!res.ok) {
      const d = (data ?? {}) as { message?: string; error?: string };
      throw new ApiError(d.message || d.error || `Request failed (${res.status})`, res.status, d.error);
    }
    return data as T;
  }

  // ── Device authorization grant (no token yet) ──────────────────────────────
  static async deviceCode(
    baseUrl: string,
    clientName: string,
    scopes: string[],
  ): Promise<DeviceCodeResponse> {
    return new Api(baseUrl).req<DeviceCodeResponse>("POST", "/auth/device/code", {
      body: { clientName, scopes },
      auth: false,
    });
  }

  /** Poll once. Returns the token, or null if still pending; throws on terminal errors. */
  static async devicePollOnce(baseUrl: string, deviceCode: string): Promise<string | null> {
    try {
      const r = await new Api(baseUrl).req<{ access_token: string }>(
        "POST",
        "/auth/device/token",
        { body: { device_code: deviceCode }, auth: false },
      );
      return r.access_token;
    } catch (e) {
      if (e instanceof ApiError && e.code === "authorization_pending") return null;
      if (e instanceof ApiError && e.code === "slow_down") return null;
      throw e;
    }
  }

  // ── Authenticated surface ──────────────────────────────────────────────────
  listAgents() {
    return this.req<{ agents: Agent[] }>("GET", "/agents").then((r) => r.agents);
  }
  /** The caller's OWN org agents only — no public agents bleed in. Backs "My Agents". */
  listMyAgents() {
    return this.req<{ agents: Agent[] }>("GET", "/agents/mine").then((r) => r.agents);
  }
  getAgent(id: string) {
    return this.req<{ agent: Agent; myRating: number | null }>("GET", `/agents/${id}`);
  }
  searchMarketplace(q: string) {
    return this.req<{ results: Listing[] }>(
      "GET",
      `/marketplace/search?sort=proof${q ? `&q=${encodeURIComponent(q)}` : ""}`,
    ).then((r) => r.results);
  }
  runAgent(agentId: string, prompt: string) {
    return this.req<{ execution: Execution }>("POST", "/playground/run", {
      body: { agentId, prompt },
    }).then((r) => r.execution);
  }
  getRun(id: string) {
    return this.req<{ execution: Execution }>("GET", `/executions/${id}`).then((r) => r.execution);
  }
  /** Recent runs for an agent (most-recent first). Used for "show proof". */
  listRuns(agentId: string, limit = 10) {
    return this.req<{ executions: Execution[] }>(
      "GET",
      `/executions?agentId=${encodeURIComponent(agentId)}&limit=${limit}`,
    ).then((r) => r.executions);
  }
  listVersions(agentId: string) {
    return this.req<{ versions: Version[] }>("GET", `/agents/${agentId}/versions`).then(
      (r) => r.versions,
    );
  }
  publishVersion(agentId: string, semver: string, changelog: string) {
    return this.req<{ version: Version }>("POST", `/agents/${agentId}/versions`, {
      body: { semver, changelog },
    }).then((r) => r.version);
  }
  listTemplates() {
    return this.req<{ templates: Template[] }>("GET", "/templates").then((r) => r.templates);
  }
  deployTemplate(id: string, params: Record<string, unknown>) {
    return this.req<{ agent: Agent }>("POST", `/templates/${id}/deploy`, {
      body: { params },
    }).then((r) => r.agent);
  }
  wallet() {
    return this.req<Wallet>("GET", "/wallet");
  }

  // ── Agent FinOps: spend control plane ───────────────────────────────────────
  // Budgets (read + manage; the IDE key holds both). Spend/mesh/fleet are reads.

  /** Budgets with live spend/state. `scopeType` optionally filters org|project|agent. */
  listBudgets(scopeType?: BudgetScopeType) {
    const q = scopeType ? `?scopeType=${scopeType}` : "";
    return this.req<{ budgets: BudgetStatusView[] }>("GET", `/budgets${q}`).then((r) => r.budgets);
  }
  /** Cheap single-budget status poll (for a live meter). */
  budgetStatus(id: string) {
    return this.req<{ status: BudgetStatusView }>("GET", `/budgets/${id}/status`).then((r) => r.status);
  }
  createBudget(input: CreateBudgetInput) {
    return this.req<{ budget: BudgetView; status: BudgetStatusView }>("POST", "/budgets", { body: input });
  }
  updateBudget(id: string, input: UpdateBudgetInput) {
    return this.req<{ budget: BudgetView; status: BudgetStatusView }>("PATCH", `/budgets/${id}`, { body: input });
  }
  deleteBudget(id: string) {
    return this.req<void>("DELETE", `/budgets/${id}`);
  }

  /** Cost attribution over a window, grouped by agent|project|model|provider. */
  spendingSummary(opts: { groupBy?: SpendingGroupBy; from?: string; to?: string } = {}) {
    const q = qs({ groupBy: opts.groupBy, from: opts.from, to: opts.to });
    return this.req<{ rows: SpendingRow[] }>("GET", `/spending/summary${q}`).then((r) => r.rows);
  }
  /** Spend over time, bucketed 1h|1d. */
  spendingTrends(opts: { bucket?: "1h" | "1d"; from?: string; to?: string } = {}) {
    const q = qs({ bucket: opts.bucket, from: opts.from, to: opts.to });
    return this.req<{ points: SpendingTrendPoint[] }>("GET", `/spending/trends${q}`).then((r) => r.points);
  }
  /** Multi-hop cost rollup for a root run — the mesh provenance the moat is built on. */
  meshTrace(rootRunId: string) {
    return this.req<{ trace: MeshTraceView }>("GET", `/spending/mesh-trace/${rootRunId}`).then((r) => r.trace);
  }

  /** Agent→agent hop ledger. direction = outgoing (hired by my agents) | incoming. */
  listMeshCalls(direction: "outgoing" | "incoming" = "outgoing", limit = 100) {
    return this.req<{ calls: MeshCallView[]; nextCursor: string | null }>(
      "GET",
      `/mesh/calls?direction=${direction}&limit=${limit}`,
    ).then((r) => r.calls);
  }
  listMeshGrants() {
    return this.req<{ issued: MeshGrantView[]; targetingMe: MeshGrantView[] }>("GET", "/mesh/grants");
  }

  /** Fleet observability over the signed-run corpus. */
  fleetAgents() {
    return this.req<{ agents: FleetAgentRow[] }>("GET", "/fleet/agents").then((r) => r.agents);
  }
  fleetCost(groupBy: "provider" | "model" = "provider") {
    return this.req<{ rows: FleetCostRow[] }>("GET", `/fleet/cost?groupBy=${groupBy}`).then((r) => r.rows);
  }
  fleetDrift() {
    return this.req<{ flags: DriftFlag[] }>("GET", "/fleet/drift").then((r) => r.flags);
  }
}

/** Build a `?k=v&…` query string from defined, non-empty values (encoded). */
function qs(params: Record<string, string | undefined>): string {
  const pairs = Object.entries(params).filter(([, v]) => v != null && v !== "");
  return pairs.length ? `?${pairs.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&")}` : "";
}

function safeParse(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

// Loose shapes (just what the UI reads).
export interface Reputation {
  trustScore: number | null;
  successRate: number | null;
  totalRuns: number;
  confidence: string;
}
export interface Agent {
  id: string;
  name: string;
  description: string;
  config: { provider: string; model: string };
  visibility: string;
  reputation?: Reputation;
}
export interface Listing {
  id: string;
  agentId: string;
  title: string;
  category: string;
  proofScore: number;
  proof: { trustScore: number | null; totalRuns: number; confidence: string };
}
export interface TraceStep {
  kind: string;
  name: string;
  status: string;
  startMs: number;
  durationMs: number;
  detail?: string;
}
export interface Execution {
  id: string;
  status: string;
  prompt: string;
  output: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  visibility?: string;
  signature: string | null;
  contentHash: string | null;
  trace: TraceStep[];
}
export interface Version {
  id: string;
  semver: string;
  channels: string[];
  runs: { totalRuns: number; successRate: number | null };
}
export interface Template {
  id: string;
  displayName: string;
  vertical: string;
}
export interface Wallet {
  balanceCredits: string;
  creditValueUsd: number;
}

// ── Agent FinOps shapes (loose mirrors of the backend views) ──────────────────
// NOTE: all credit/cost fields arrive as decimal STRINGS — coerce with Number().
export type BudgetScopeType = "org" | "project" | "agent";
export type BudgetPeriodType = "daily" | "weekly" | "monthly" | "rolling_30d" | "custom";
export type BudgetEnforcementMode = "off" | "alert" | "block";
export type BudgetState = "ok" | "warn" | "exceeded";

export interface BudgetView {
  id: string;
  name: string;
  scopeType: BudgetScopeType;
  scopeId: string | null;
  periodType: BudgetPeriodType;
  limitCredits: string;
  enforcement: BudgetEnforcementMode;
  alertThresholdPct: number;
  periodStartAt: string | null;
  periodEndAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface BudgetStatusView {
  budget: BudgetView;
  periodStart: string;
  periodEnd: string;
  spentCredits: string;
  limitCredits: string;
  remainingCredits: string;
  usedPct: number;
  state: BudgetState;
}
export interface CreateBudgetInput {
  name: string;
  scopeType: BudgetScopeType;
  scopeId?: string | null;
  periodType: BudgetPeriodType;
  limitCredits: number; // number on input, string on output
  enforcement?: BudgetEnforcementMode;
  alertThresholdPct?: number;
  periodStartAt?: string;
  periodEndAt?: string;
}
export interface UpdateBudgetInput {
  name?: string;
  periodType?: BudgetPeriodType;
  limitCredits?: number;
  enforcement?: BudgetEnforcementMode;
  alertThresholdPct?: number;
}

export type SpendingGroupBy = "agent" | "project" | "model" | "provider";
export interface SpendingRow {
  key: string;
  label: string;
  costCredits: string;
  runs: number;
}
export interface SpendingTrendPoint {
  ts: string;
  costCredits: string;
  runs: number;
}

export type MeshCallStatus = "authorized" | "running" | "settled" | "failed" | "released";
export interface MeshAttribution {
  path: string[];
  rootRunId: string | null;
  depth: number;
}
export interface MeshCallView {
  id: string;
  callerAgent: string;
  calleeAgent: string;
  runId: string | null;
  parentCallId: string | null;
  depth: number;
  attribution: MeshAttribution;
  grantId: string | null;
  escrowCredits: string;
  costCredits: string | null;
  status: MeshCallStatus;
  createdAt: string;
  settledAt: string | null;
}
export interface MeshHopView {
  callId: string;
  callerAgentId: string;
  calleeAgentId: string;
  depth: number;
  costCredits: string | null;
  status: string;
  createdAt: string;
}
export interface MeshTraceView {
  rootRunId: string;
  totalCredits: string;
  hops: MeshHopView[];
}
export type MeshGranteeScope = "agent" | "org" | "public";
export type MeshRateUnit = "per_call" | "per_1k_tokens";
export interface MeshGrantView {
  id: string;
  grantorAgent: string;
  granteeScope: MeshGranteeScope;
  granteeAgent: string | null;
  granteeOrg: string | null;
  allowed: boolean;
  rateCredits: string;
  rateUnit: MeshRateUnit;
  quotaCalls: number | null;
  quotaWindow: string | null;
  minTrustScore: string | null;
  createdAt: string;
}

export type DriftKind = "alias" | "shift";
export interface FleetAgentRow {
  agentId: string;
  name: string;
  runs: number;
  p95LatencyMs: number | null;
  successRate: number;
  costCredits: string;
  modelAlias: string | null;
  drift: { kind: DriftKind; runIds: string[] } | null;
}
export interface FleetCostRow {
  provider: string;
  model: string | null;
  costCredits: string;
  runs: number;
}
export interface DriftObservation {
  modelAlias: string | null;
  p50LatencyMs: number | null;
  p50CostCredits: string | null;
  successRate: number | null;
}
export interface DriftFlag {
  agentId: string;
  kind: DriftKind;
  baseline: DriftObservation;
  observed: DriftObservation;
  runIds: string[];
}
