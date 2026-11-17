import type { HttpClient } from "../core/http.js";
import type { MeshTraceView, SpendingRow, SpendingTrendPoint } from "../generated/types.js";

type SpendingGroupBy = "agent" | "project" | "model" | "provider";
type SpendingBucket = "1h" | "1d";

/**
 * Agent FinOps — cost attribution (spend visibility). `sx.spending.*`
 *
 * Read-only rollups over real run telemetry + the multi-hop mesh ledger: which
 * agent / project / model spent, over time, and — across a mesh — on whose behalf.
 * `from`/`to` accept relative ("-7d", "-24h") or absolute ISO; default last 30 days.
 */
export class SpendingResource {
  constructor(private readonly http: HttpClient) {}

  /** Spend attributed by a dimension (agent / project / model / provider). */
  async summary(
    opts: { from?: string; to?: string; groupBy?: SpendingGroupBy } = {},
  ): Promise<SpendingRow[]> {
    return (
      await this.http.request<{ rows: SpendingRow[] }>({
        method: "GET",
        path: "/spending/summary",
        query: { from: opts.from, to: opts.to, groupBy: opts.groupBy },
      })
    ).rows;
  }

  /** Spend over time (hour/day buckets). */
  async trends(
    opts: { from?: string; to?: string; bucket?: SpendingBucket } = {},
  ): Promise<SpendingTrendPoint[]> {
    return (
      await this.http.request<{ points: SpendingTrendPoint[] }>({
        method: "GET",
        path: "/spending/trends",
        query: { from: opts.from, to: opts.to, bucket: opts.bucket },
      })
    ).points;
  }

  /** Multi-hop cost rolled up across an agent→agent trace (by its root run id). */
  async meshTrace(rootRunId: string): Promise<MeshTraceView> {
    return (
      await this.http.request<{ trace: MeshTraceView }>({
        method: "GET",
        path: `/spending/mesh-trace/${rootRunId}`,
      })
    ).trace;
  }
}
