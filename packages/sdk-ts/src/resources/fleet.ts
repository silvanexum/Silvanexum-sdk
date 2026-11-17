import type { HttpClient } from "../core/http.js";
import type {
  AlertEventView,
  AlertRuleView,
  CreateAlertRuleInput,
  DriftFlag,
  FleetAgentRow,
  FleetCostRow,
  FleetSeries,
  OtelTraceExport,
  UpdateAlertRuleInput,
} from "../generated/types.js";

/** Fleet observability, cost, drift, alerts & OTel export (M08). `sx.fleet.*` */
export class FleetResource {
  constructor(private readonly http: HttpClient) {}

  /** Time-series fleet metrics, bucketed and grouped. */
  async metrics(
    opts: {
      from?: string;
      to?: string;
      bucket?: "1m" | "1h" | "1d";
      agentId?: string;
      provider?: string;
      model?: string;
      groupBy?: "agent" | "provider" | "model" | "project";
    } = {},
  ): Promise<FleetSeries[]> {
    return (
      await this.http.request<{ series: FleetSeries[] }>({
        method: "GET",
        path: "/fleet/metrics",
        query: opts,
      })
    ).series;
  }

  /** Per-agent fleet grid. */
  async agents(): Promise<FleetAgentRow[]> {
    return (
      await this.http.request<{ agents: FleetAgentRow[] }>({ method: "GET", path: "/fleet/agents" })
    ).agents;
  }

  /** Cross-provider/model cost rollup. */
  async cost(
    opts: { from?: string; to?: string; groupBy?: "provider" | "model" } = {},
  ): Promise<FleetCostRow[]> {
    return (
      await this.http.request<{ rows: FleetCostRow[] }>({
        method: "GET",
        path: "/fleet/cost",
        query: opts,
      })
    ).rows;
  }

  /** Drift flags (alias / shift) against rolling baselines. */
  async drift(): Promise<DriftFlag[]> {
    return (
      await this.http.request<{ flags: DriftFlag[] }>({ method: "GET", path: "/fleet/drift" })
    ).flags;
  }

  /** Export a signed run's trace as OpenTelemetry GenAI spans. */
  async otel(executionId: string): Promise<OtelTraceExport> {
    return this.http.request<OtelTraceExport>({
      method: "GET",
      path: `/executions/${executionId}/otel`,
    });
  }

  /** List alert rules. */
  async listAlerts(): Promise<AlertRuleView[]> {
    return (
      await this.http.request<{ alerts: AlertRuleView[] }>({ method: "GET", path: "/alerts" })
    ).alerts;
  }

  /** Create an alert rule. */
  async createAlert(input: CreateAlertRuleInput): Promise<AlertRuleView> {
    return (
      await this.http.request<{ alert: AlertRuleView }>({
        method: "POST",
        path: "/alerts",
        body: input,
      })
    ).alert;
  }

  /** Update an alert rule. */
  async updateAlert(id: string, input: UpdateAlertRuleInput): Promise<AlertRuleView> {
    return (
      await this.http.request<{ alert: AlertRuleView }>({
        method: "PATCH",
        path: `/alerts/${id}`,
        body: input,
      })
    ).alert;
  }

  /** Delete an alert rule. */
  async deleteAlert(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/alerts/${id}` });
  }

  /** Fired events for an alert rule. */
  async alertEvents(id: string): Promise<AlertEventView[]> {
    return (
      await this.http.request<{ events: AlertEventView[] }>({
        method: "GET",
        path: `/alerts/${id}/events`,
      })
    ).events;
  }
}
