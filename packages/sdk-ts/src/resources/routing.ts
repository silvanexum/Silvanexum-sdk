import type { HttpClient } from "../core/http.js";
import type {
  RoutingDecisionView,
  RoutingPolicyView,
  RoutingPreview,
  UpsertRoutingPolicyInput,
} from "../generated/types.js";

type RoutingObjective = "min_cost" | "min_latency" | "max_quality" | "balanced";

/** Per-agent model routing policies, previews & decision log (M15). `sx.routing.*` */
export class RoutingResource {
  constructor(private readonly http: HttpClient) {}

  /** Create or update an agent's routing policy. */
  async upsertPolicy(agentId: string, input: UpsertRoutingPolicyInput): Promise<RoutingPolicyView> {
    return (
      await this.http.request<{ policy: RoutingPolicyView }>({
        method: "POST",
        path: `/agents/${agentId}/routing-policy`,
        body: input,
      })
    ).policy;
  }

  /** Read an agent's routing policy (or null). */
  async getPolicy(agentId: string): Promise<RoutingPolicyView | null> {
    return (
      await this.http.request<{ policy: RoutingPolicyView | null }>({
        method: "GET",
        path: `/agents/${agentId}/routing-policy`,
      })
    ).policy;
  }

  /** Delete an agent's routing policy. */
  async deletePolicy(agentId: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/agents/${agentId}/routing-policy` });
  }

  /** Dry-run the routing decision for an agent. */
  async preview(agentId: string, objective?: RoutingObjective): Promise<RoutingPreview> {
    return this.http.request<RoutingPreview>({
      method: "POST",
      path: `/agents/${agentId}/routing/preview`,
      body: objective ? { objective } : {},
    });
  }

  /** Page the append-only routing decision log. */
  async decisions(
    opts: { agentId?: string; objective?: RoutingObjective; limit?: number; cursor?: string } = {},
  ): Promise<{ decisions: RoutingDecisionView[]; nextCursor: string | null }> {
    return this.http.request({ method: "GET", path: "/routing/decisions", query: opts });
  }

  /** Fetch one routing decision. */
  async getDecision(id: string): Promise<RoutingDecisionView> {
    return (
      await this.http.request<{ decision: RoutingDecisionView }>({
        method: "GET",
        path: `/routing/decisions/${id}`,
      })
    ).decision;
  }
}
