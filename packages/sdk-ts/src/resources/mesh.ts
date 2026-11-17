import type { HttpClient } from "../core/http.js";
import type {
  CreateMeshGrantInput,
  MeshCallInput,
  MeshCallView,
  MeshDiscoverHit,
  MeshGrantView,
} from "../generated/types.js";

/**
 * M03 — the A2A gateway. `sx.mesh.*`
 *
 * Agents hire other agents through the mesh: the callee publishes a GRANT
 * (who may call it, at what rate, under what quota), the caller invokes a
 * HOP (grant-checked → reputation-gated → escrowed → run signed → settled),
 * and every hop lands on the ledger with multi-hop attribution.
 *
 * Supplier side: `grants.create` / `grants.list` / `grants.revoke`.
 * Caller side:   `discover` → `call` → `calls.list` / `calls.get`.
 */
export class MeshResource {
  readonly grants: MeshGrantsResource;
  readonly calls: MeshCallsResource;

  constructor(private readonly http: HttpClient) {
    this.grants = new MeshGrantsResource(http);
    this.calls = new MeshCallsResource(http);
  }

  /** Proof-ranked discovery of hireable callees (public grants + reputation). */
  async discover(
    opts: {
      q?: string;
      minTrustScore?: number;
      minSuccessRate?: number;
      minTotalRuns?: number;
      maxRateCredits?: number;
      limit?: number;
    } = {},
  ): Promise<MeshDiscoverHit[]> {
    return (
      await this.http.request<{ results: MeshDiscoverHit[] }>({
        method: "GET",
        path: "/mesh/discover",
        query: opts as Record<string, string | number | undefined>,
      })
    ).results;
  }

  /**
   * Explicitly hire a callee agent (one billed hop). Prefer an
   * `Idempotency-Key` via `opts.idempotencyKey` for safe retries.
   */
  async call(input: MeshCallInput, opts: { idempotencyKey?: string } = {}): Promise<MeshCallView> {
    return (
      await this.http.request<{ hop: MeshCallView }>({
        method: "POST",
        path: "/mesh/call",
        body: input,
        headers: opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
      })
    ).hop;
  }
}

/** Grants — the callee's published hire contract (rate, quota, trust floor). */
export class MeshGrantsResource {
  constructor(private readonly http: HttpClient) {}

  /** Grants issued by my org + grants targeting my org/agents. */
  async list(): Promise<{ issued: MeshGrantView[]; targetingMe: MeshGrantView[] }> {
    return this.http.request<{ issued: MeshGrantView[]; targetingMe: MeshGrantView[] }>({
      method: "GET",
      path: "/mesh/grants",
    });
  }

  /** Publish a grant for one of my agents (scope: agent / org / public). */
  async create(input: CreateMeshGrantInput): Promise<MeshGrantView> {
    return (
      await this.http.request<{ grant: MeshGrantView }>({
        method: "POST",
        path: "/mesh/grants",
        body: input,
      })
    ).grant;
  }

  /** Revoke (soft-delete) a grant. Existing settled hops are unaffected. */
  async revoke(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/mesh/grants/${id}` });
  }
}

/** The hop ledger — who hired whom, and what it cost. */
export class MeshCallsResource {
  constructor(private readonly http: HttpClient) {}

  /** List my org's hops (direction: outgoing hires vs incoming work). */
  async list(
    opts: { direction?: "outgoing" | "incoming"; limit?: number; cursor?: string } = {},
  ): Promise<{ calls: MeshCallView[]; nextCursor: string | null }> {
    return this.http.request<{ calls: MeshCallView[]; nextCursor: string | null }>({
      method: "GET",
      path: "/mesh/calls",
      query: opts as Record<string, string | number | undefined>,
    });
  }

  /** One hop + its signed callee run (when the hop produced one). */
  async get(id: string): Promise<{ hop: MeshCallView; run: unknown | null }> {
    return this.http.request<{ hop: MeshCallView; run: unknown | null }>({
      method: "GET",
      path: `/mesh/calls/${id}`,
    });
  }
}
