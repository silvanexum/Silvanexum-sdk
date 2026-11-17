import type { HttpClient } from "../core/http.js";
import type {
  AgentLineage,
  AgentVersionView,
  AgentView,
  BindIdentityInput,
  CreateAgentInput,
  GetAgentResponse,
  PublishVersionInput,
  RateAgentResponse,
  UpdateAgentInput,
} from "../generated/types.js";

/** Manage agents — the core registry object. `sx.agents.*` */
export class AgentsResource {
  constructor(private readonly http: HttpClient) {}

  /** List agents in your org. */
  async list(): Promise<AgentView[]> {
    return (await this.http.request<{ agents: AgentView[] }>({ method: "GET", path: "/agents" }))
      .agents;
  }

  /** List public agents. */
  async listPublic(): Promise<AgentView[]> {
    return (
      await this.http.request<{ agents: AgentView[] }>({ method: "GET", path: "/agents/public" })
    ).agents;
  }

  /** Fetch one agent (with your rating, if any). */
  async get(id: string): Promise<GetAgentResponse> {
    return this.http.request<GetAgentResponse>({ method: "GET", path: `/agents/${id}` });
  }

  /** Create an agent. */
  async create(input: CreateAgentInput): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({ method: "POST", path: "/agents", body: input })
    ).agent;
  }

  /** Update an agent. */
  async update(id: string, input: UpdateAgentInput): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({
        method: "PATCH",
        path: `/agents/${id}`,
        body: input,
      })
    ).agent;
  }

  /** Delete an agent. */
  async delete(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/agents/${id}` });
  }

  /** Make an agent public. */
  async publish(id: string): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({ method: "POST", path: `/agents/${id}/publish` })
    ).agent;
  }

  /** Fork an agent into your org. */
  async fork(id: string): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({ method: "POST", path: `/agents/${id}/fork` })
    ).agent;
  }

  /** Rate an agent 1–5. */
  async rate(id: string, rating: number): Promise<RateAgentResponse> {
    return this.http.request<RateAgentResponse>({
      method: "POST",
      path: `/agents/${id}/rate`,
      body: { rating },
    });
  }

  /** Fork-lineage graph for an agent. */
  async lineage(id: string): Promise<AgentLineage> {
    return this.http.request<AgentLineage>({ method: "GET", path: `/agents/${id}/lineage` });
  }

  /** Bind an external A2A AgentCard identity. */
  async bindIdentity(id: string, input: BindIdentityInput): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({
        method: "POST",
        path: `/agents/${id}/identity`,
        body: input,
      })
    ).agent;
  }

  /** Unbind the external identity. */
  async unbindIdentity(id: string): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({
        method: "DELETE",
        path: `/agents/${id}/identity`,
      })
    ).agent;
  }

  /** Signed, content-addressed versions of an agent (M01). */
  readonly versions = {
    list: async (agentId: string): Promise<AgentVersionView[]> =>
      (
        await this.http.request<{ versions: AgentVersionView[] }>({
          method: "GET",
          path: `/agents/${agentId}/versions`,
        })
      ).versions,

    publish: async (agentId: string, input: PublishVersionInput): Promise<AgentVersionView> =>
      (
        await this.http.request<{ version: AgentVersionView }>({
          method: "POST",
          path: `/agents/${agentId}/versions`,
          body: input,
        })
      ).version,

    promote: (agentId: string, semver: string) =>
      this.http.request<{ promoted: string; channels: { channel: string; semver: string }[] }>({
        method: "POST",
        path: `/agents/${agentId}/versions/${semver}/promote`,
      }),

    verify: (agentId: string, semver: string) =>
      this.http.request<{ valid: boolean; digest: string; recomputedDigest: string }>({
        method: "GET",
        path: `/agents/${agentId}/versions/${semver}/verify`,
      }),
  };
}
