import type { HttpClient } from "../core/http.js";
import type {
  AgentView,
  CreateTemplateInput,
  DeployTemplateInput,
  TemplateCard,
  TemplateDetail,
} from "../generated/types.js";

/** 1-click vertical agent templates (M11). `sx.templates.*` */
export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}

  /** Browse the template gallery. */
  async list(
    filters: { vertical?: string; connector?: string; sort?: "deploys" | "recent" } = {},
  ): Promise<TemplateCard[]> {
    return (
      await this.http.request<{ templates: TemplateCard[] }>({
        method: "GET",
        path: "/templates",
        query: filters,
      })
    ).templates;
  }

  /** Template detail: parameter schema, required connectors, run-proof. */
  async get(id: string): Promise<TemplateDetail> {
    return (
      await this.http.request<{ template: TemplateDetail }>({
        method: "GET",
        path: `/templates/${id}`,
      })
    ).template;
  }

  /**
   * 1-click instantiate a template into a ready, signed agent. Pass an
   * `idempotencyKey` to make repeated deploys safe.
   */
  async deploy(
    id: string,
    input: DeployTemplateInput,
    opts: { idempotencyKey?: string } = {},
  ): Promise<AgentView> {
    return (
      await this.http.request<{ agent: AgentView }>({
        method: "POST",
        path: `/templates/${id}/deploy`,
        body: input,
        idempotencyKey: opts.idempotencyKey,
      })
    ).agent;
  }

  /** Publish a template from one of your agents. */
  async create(input: CreateTemplateInput): Promise<TemplateDetail> {
    return (
      await this.http.request<{ template: TemplateDetail }>({
        method: "POST",
        path: "/templates",
        body: input,
      })
    ).template;
  }
}
