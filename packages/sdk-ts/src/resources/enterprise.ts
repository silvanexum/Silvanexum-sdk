import type { HttpClient } from "../core/http.js";
import type {
  CreateSsoConnectionInput,
  SsoConnectionView,
  ScimWebhookEvent,
  ScimUserView,
  CreateRbacRoleInput,
  RbacRoleView,
  CreateRbacBindingInput,
  RbacBindingView,
  DeploymentInfoView,
} from "../generated/types.js";

/** Enterprise private hub — SSO / SCIM / RBAC / deployment (M12). `sx.enterprise.*` */
export class EnterpriseResource {
  constructor(private readonly http: HttpClient) {}

  /** List the org's SSO connections. */
  async listSsoConnections(): Promise<SsoConnectionView[]> {
    return (
      await this.http.request<{ connections: SsoConnectionView[] }>({
        method: "GET",
        path: "/admin/sso/connections",
      })
    ).connections;
  }

  /** Provision an SSO connection (returns a WorkOS setup link when configured). */
  async createSsoConnection(input: CreateSsoConnectionInput): Promise<SsoConnectionView> {
    return (
      await this.http.request<{ connection: SsoConnectionView }>({
        method: "POST",
        path: "/admin/sso/connections",
        body: input,
      })
    ).connection;
  }

  /** Ingest a WorkOS SCIM provision/deprovision webhook (idempotent). */
  async scimWebhook(input: ScimWebhookEvent): Promise<{ ok: boolean }> {
    return this.http.request<{ ok: boolean }>({
      method: "POST",
      path: "/admin/scim/webhook",
      body: input,
    });
  }

  /** List SCIM-provisioned users. */
  async listScimUsers(): Promise<ScimUserView[]> {
    return (
      await this.http.request<{ users: ScimUserView[] }>({
        method: "GET",
        path: "/admin/scim/users",
      })
    ).users;
  }

  /** List RBAC roles (system + custom). */
  async listRbacRoles(): Promise<RbacRoleView[]> {
    return (
      await this.http.request<{ roles: RbacRoleView[] }>({
        method: "GET",
        path: "/admin/rbac/roles",
      })
    ).roles;
  }

  /** Define a custom fine-grained role. */
  async createRbacRole(input: CreateRbacRoleInput): Promise<RbacRoleView> {
    return (
      await this.http.request<{ role: RbacRoleView }>({
        method: "POST",
        path: "/admin/rbac/roles",
        body: input,
      })
    ).role;
  }

  /** Bind a role to a principal (user / SCIM group) at an org or project scope. */
  async createRbacBinding(input: CreateRbacBindingInput): Promise<RbacBindingView> {
    return (
      await this.http.request<{ binding: RbacBindingView }>({
        method: "POST",
        path: "/admin/rbac/bindings",
        body: input,
      })
    ).binding;
  }

  /** Revoke a role binding. */
  async deleteRbacBinding(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/admin/rbac/bindings/${id}` });
  }

  /** Introspect the deployment tier, identity provider, and economy mode. */
  async deployment(): Promise<DeploymentInfoView> {
    return this.http.request<DeploymentInfoView>({ method: "GET", path: "/admin/deployment" });
  }
}
