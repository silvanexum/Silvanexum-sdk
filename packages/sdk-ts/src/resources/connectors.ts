import type { HttpClient } from "../core/http.js";
import type {
  AvailableIntegrations,
  ConnectorView,
  CreateConnectorInput,
} from "../generated/types.js";

/** Authenticated third-party tools (via Nango) an agent can call. `sx.connectors.*` */
export class ConnectorsResource {
  constructor(private readonly http: HttpClient) {}

  /** List your org's connectors. */
  async list(): Promise<ConnectorView[]> {
    return (
      await this.http.request<{ connectors: ConnectorView[] }>({
        method: "GET",
        path: "/connectors",
      })
    ).connectors;
  }

  /** Nango integrations available to connect. */
  async available(): Promise<AvailableIntegrations> {
    return this.http.request<AvailableIntegrations>({
      method: "GET",
      path: "/connectors/available",
    });
  }

  /** Create a connector (pre-authorization). */
  async create(input: CreateConnectorInput): Promise<ConnectorView> {
    return (
      await this.http.request<{ connector: ConnectorView }>({
        method: "POST",
        path: "/connectors",
        body: input,
      })
    ).connector;
  }

  /** Mint a Nango Connect session token to run the OAuth flow. */
  async session(id: string): Promise<{ sessionToken?: string }> {
    return this.http.request<{ sessionToken?: string }>({
      method: "POST",
      path: `/connectors/${id}/session`,
    });
  }

  /** Confirm the connectionId after the user completes Connect. */
  async confirm(id: string, connectionId: string): Promise<ConnectorView> {
    return (
      await this.http.request<{ connector: ConnectorView }>({
        method: "POST",
        path: `/connectors/${id}/confirm`,
        body: { connectionId },
      })
    ).connector;
  }

  /** Revoke a connector. */
  async delete(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/connectors/${id}` });
  }
}
