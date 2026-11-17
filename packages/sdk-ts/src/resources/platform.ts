import type { HttpClient } from "../core/http.js";
import type {
  CreateProjectInput,
  InviteMemberInput,
  KeyValidationResult,
  LiveModelsResponse,
  MemberRole,
  MemberView,
  ModelInfo,
  OverviewStats,
  Provider,
  ProjectView,
  ProviderKeyView,
  SaveKeyResponse,
} from "../generated/types.js";

/** BYO provider API keys. `sx.keys.*` */
export class KeysResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ProviderKeyView[]> {
    return (await this.http.request<{ keys: ProviderKeyView[] }>({ method: "GET", path: "/keys" }))
      .keys;
  }

  /** Validate a provider key without saving it. */
  async validate(provider: Provider, apiKey: string): Promise<KeyValidationResult> {
    return this.http.request<KeyValidationResult>({
      method: "POST",
      path: "/keys/validate",
      body: { provider, apiKey },
    });
  }

  async save(provider: Provider, apiKey: string, label?: string): Promise<SaveKeyResponse> {
    return this.http.request<SaveKeyResponse>({
      method: "POST",
      path: "/keys",
      body: { provider, apiKey, label },
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/keys/${id}` });
  }
}

/** Model catalog (static + live, key-scoped). `sx.models.*` */
export class ModelsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ModelInfo[]> {
    return (await this.http.request<{ models: ModelInfo[] }>({ method: "GET", path: "/models" }))
      .models;
  }

  /** Live, key-scoped model list for a provider (falls back to the registry). */
  async live(provider: Provider): Promise<LiveModelsResponse> {
    return this.http.request<LiveModelsResponse>({
      method: "GET",
      path: `/models/${provider}/live`,
    });
  }
}

/** Org members and projects. `sx.team.*` */
export class TeamResource {
  constructor(private readonly http: HttpClient) {}

  async listMembers(): Promise<{ members: MemberView[]; yourRole: MemberRole }> {
    return this.http.request({ method: "GET", path: "/team/members" });
  }

  async inviteMember(input: InviteMemberInput): Promise<{ ok: boolean }> {
    return this.http.request({ method: "POST", path: "/team/members/invite", body: input });
  }

  async updateMemberRole(userId: string, role: MemberRole): Promise<{ ok: boolean }> {
    return this.http.request({
      method: "PATCH",
      path: `/team/members/${userId}`,
      body: { role },
    });
  }

  async removeMember(userId: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/team/members/${userId}` });
  }

  async listProjects(): Promise<ProjectView[]> {
    return (
      await this.http.request<{ projects: ProjectView[] }>({ method: "GET", path: "/team/projects" })
    ).projects;
  }

  async createProject(input: CreateProjectInput): Promise<ProjectView> {
    return (
      await this.http.request<{ project: ProjectView }>({
        method: "POST",
        path: "/team/projects",
        body: input,
      })
    ).project;
  }

  async deleteProject(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/team/projects/${id}` });
  }
}

/** Org dashboard stats. `sx.overview.*` */
export class OverviewResource {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<OverviewStats> {
    return this.http.request<OverviewStats>({ method: "GET", path: "/overview" });
  }
}
