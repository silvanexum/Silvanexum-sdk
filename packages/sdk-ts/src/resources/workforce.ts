import type { HttpClient } from "../core/http.js";
import type {
  RoleView,
  CreateRoleInput,
  AssignmentView,
  CreateAssignmentInput,
  OrgChartView,
  EscalationView,
  EscalationsQuery,
  ResolveEscalationInput,
  HitlReviewView,
  PerformanceReview,
} from "../generated/types.js";

/**
 * Agent Workforce / Org Chart (M09) — `sx.workforce.*`.
 *
 * A managed, auditable org chart of agents: functional roles, scheduled
 * assignments with reporting lines, a first-class HITL escalation inbox, and a
 * read-time performance review rollup that drills back to signed runs.
 */
export class WorkforceResource {
  constructor(private readonly http: HttpClient) {}

  /** List functional workforce roles. */
  async listRoles(): Promise<RoleView[]> {
    return (await this.http.request<{ roles: RoleView[] }>({ method: "GET", path: "/workforce/roles" }))
      .roles;
  }

  /** Define a functional role (escalation policy + reputation gates). */
  async createRole(input: CreateRoleInput): Promise<RoleView> {
    return (
      await this.http.request<{ role: RoleView }>({
        method: "POST",
        path: "/workforce/roles",
        body: input,
      })
    ).role;
  }

  /** List agent→role assignments. */
  async listAssignments(): Promise<AssignmentView[]> {
    return (
      await this.http.request<{ assignments: AssignmentView[] }>({
        method: "GET",
        path: "/workforce/assignments",
      })
    ).assignments;
  }

  /** Staff an agent into a role on a schedule with a reporting line. */
  async createAssignment(input: CreateAssignmentInput): Promise<AssignmentView> {
    return (
      await this.http.request<{ assignment: AssignmentView }>({
        method: "POST",
        path: "/workforce/assignments",
        body: input,
      })
    ).assignment;
  }

  /** The derived org chart: nodes (agents + trust) and reporting edges. */
  async orgChart(): Promise<OrgChartView> {
    return this.http.request<OrgChartView>({ method: "GET", path: "/workforce/org-chart" });
  }

  /** The HITL inbox — escalations pending a human decision. */
  async listEscalations(opts: EscalationsQuery = {}): Promise<EscalationView[]> {
    return (
      await this.http.request<{ escalations: EscalationView[] }>({
        method: "GET",
        path: "/workforce/escalations",
        query: { status: opts.status, pool: opts.pool, limit: opts.limit },
      })
    ).escalations;
  }

  /** Fetch one escalation. */
  async getEscalation(id: string): Promise<EscalationView> {
    return (
      await this.http.request<{ escalation: EscalationView }>({
        method: "GET",
        path: `/workforce/escalations/${id}`,
      })
    ).escalation;
  }

  /** Record a human decision on an escalation (approve / edit / reject / abort). */
  async resolveEscalation(
    id: string,
    input: ResolveEscalationInput,
  ): Promise<{ review: HitlReviewView; escalation: EscalationView }> {
    return this.http.request<{ review: HitlReviewView; escalation: EscalationView }>({
      method: "POST",
      path: `/escalations/${id}/resolve`,
      body: input,
    });
  }

  /** The performance review rollup for an agent over a window (e.g. "90d"). */
  async agentReview(agentId: string, opts: { window?: string } = {}): Promise<PerformanceReview> {
    return this.http.request<PerformanceReview>({
      method: "GET",
      path: `/workforce/agents/${agentId}/review`,
      query: opts,
    });
  }
}
