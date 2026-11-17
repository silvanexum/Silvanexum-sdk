import type { HttpClient } from "../core/http.js";
import type {
  ExecutionView,
  PublicRunResponse,
  RecentExecution,
  RerunInput,
  RunVisibility,
} from "../generated/types.js";

/** Execute agents and read signed, replayable traces. `sx.runs.*` */
export class RunsResource {
  constructor(private readonly http: HttpClient) {}

  /** Run an agent on a prompt. The run is captured, scrubbed, and signed. */
  async create(input: { agentId: string; prompt: string }): Promise<ExecutionView> {
    return (
      await this.http.request<{ execution: ExecutionView }>({
        method: "POST",
        path: "/playground/run",
        body: input,
      })
    ).execution;
  }

  /** Re-run a recorded run, optionally swapping the agent or editing the prompt. */
  async rerun(input: RerunInput): Promise<ExecutionView> {
    return (
      await this.http.request<{ execution: ExecutionView }>({
        method: "POST",
        path: "/playground/rerun",
        body: input,
      })
    ).execution;
  }

  /** List runs for an agent. */
  async list(agentId: string): Promise<ExecutionView[]> {
    return (
      await this.http.request<{ executions: ExecutionView[] }>({
        method: "GET",
        path: "/executions",
        query: { agentId },
      })
    ).executions;
  }

  /** Most recent runs across your org. */
  async recent(limit = 15): Promise<RecentExecution[]> {
    return (
      await this.http.request<{ executions: RecentExecution[] }>({
        method: "GET",
        path: "/executions/recent",
        query: { limit },
      })
    ).executions;
  }

  /** Fetch one run's full signed trace. */
  async get(id: string): Promise<ExecutionView> {
    return (
      await this.http.request<{ execution: ExecutionView }>({
        method: "GET",
        path: `/executions/${id}`,
      })
    ).execution;
  }

  /** Make a run public (shareable) or private. */
  async setVisibility(id: string, visibility: RunVisibility): Promise<ExecutionView> {
    return (
      await this.http.request<{ execution: ExecutionView }>({
        method: "POST",
        path: `/executions/${id}/visibility`,
        body: { visibility },
      })
    ).execution;
  }

  /** Public (scrubbed) view of a shared run. No authentication required. */
  async getPublic(id: string): Promise<PublicRunResponse> {
    return this.http.request<PublicRunResponse>({
      method: "GET",
      path: `/executions/public/${id}`,
    });
  }

  /** The canonical share URL for a public run. */
  shareUrl(id: string, webBaseUrl = "https://silvanexum.com"): string {
    return `${webBaseUrl.replace(/\/$/, "")}/runs/${id}`;
  }
}
