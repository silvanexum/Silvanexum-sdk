import type { HttpClient } from "../core/http.js";
import type {
  BudgetStatusView,
  BudgetView,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "../generated/types.js";

/**
 * Agent FinOps — budgets & spend governance. `sx.budgets.*`
 *
 * A budget is a spend cap over a scope (org / project / agent) for a period.
 * With `enforcement: "block"` a run or mesh hop that would breach the cap is
 * rejected server-side (HTTP 402). "Spent" is computed from real run telemetry.
 */
export class BudgetsResource {
  constructor(private readonly http: HttpClient) {}

  /** List budgets, each with its live computed spend for the current period. */
  async list(opts: { scopeType?: "org" | "project" | "agent" } = {}): Promise<BudgetStatusView[]> {
    return (
      await this.http.request<{ budgets: BudgetStatusView[] }>({
        method: "GET",
        path: "/budgets",
        query: { scopeType: opts.scopeType },
      })
    ).budgets;
  }

  /** Create a spend cap. `scopeId` is required for project/agent scopes. */
  async create(input: CreateBudgetInput): Promise<BudgetView> {
    return (
      await this.http.request<{ budget: BudgetView }>({ method: "POST", path: "/budgets", body: input })
    ).budget;
  }

  /** One budget + its current-period status (spent / remaining / state). */
  async get(id: string): Promise<BudgetStatusView> {
    return (
      await this.http.request<{ status: BudgetStatusView }>({ method: "GET", path: `/budgets/${id}` })
    ).status;
  }

  /** Update a budget's limit / enforcement / period / alert threshold. */
  async update(id: string, input: UpdateBudgetInput): Promise<BudgetView> {
    return (
      await this.http.request<{ budget: BudgetView }>({
        method: "PATCH",
        path: `/budgets/${id}`,
        body: input,
      })
    ).budget;
  }

  /** Delete a budget. */
  async delete(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/budgets/${id}` });
  }

  /** The live status only — a cheap poll for a meter UI. */
  async status(id: string): Promise<BudgetStatusView> {
    return (
      await this.http.request<{ status: BudgetStatusView }>({
        method: "GET",
        path: `/budgets/${id}/status`,
      })
    ).status;
  }
}
