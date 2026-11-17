import { HttpClient, type ClientOptions } from "./core/http.js";
import { AgentsResource } from "./resources/agents.js";
import { RunsResource } from "./resources/runs.js";
import { TemplatesResource } from "./resources/templates.js";
import { ConnectorsResource } from "./resources/connectors.js";
import { MarketplaceResource } from "./resources/marketplace.js";
import { WalletResource } from "./resources/wallet.js";
import { SuitesResource } from "./resources/suites.js";
import { SecurityResource } from "./resources/security.js";
import { ProvingResource } from "./resources/proving.js";
import { FleetResource } from "./resources/fleet.js";
import { RoutingResource } from "./resources/routing.js";
import { StudioResource } from "./resources/studio.js";
import { WorkforceResource } from "./resources/workforce.js";
import { CertificationResource } from "./resources/certification.js";
import { EnterpriseResource } from "./resources/enterprise.js";
import { InsuranceResource } from "./resources/insurance.js";
import { BountiesResource } from "./resources/bounties.js";
import { BudgetsResource } from "./resources/budgets.js";
import { MeshResource } from "./resources/mesh.js";
import { BillingResource } from "./resources/billing.js";
import { SpendingResource } from "./resources/spending.js";
import { GatewayResource } from "./resources/gateway.js";
import { MeterResource } from "./resources/meter.js";
import {
  KeysResource,
  ModelsResource,
  OverviewResource,
  TeamResource,
} from "./resources/platform.js";

/**
 * The Silvanexum client.
 *
 * ```ts
 * import { Silvanexum } from "@silvanexum/sdk";
 *
 * const sx = new Silvanexum({ apiKey: process.env.SILVANEXUM_API_KEY });
 * const run = await sx.runs.create({ agentId, prompt: "Summarize this ticket." });
 * console.log(run.output, sx.runs.shareUrl(run.id));
 * ```
 */
export class Silvanexum {
  private readonly http: HttpClient;

  readonly agents: AgentsResource;
  readonly runs: RunsResource;
  readonly templates: TemplatesResource;
  readonly connectors: ConnectorsResource;
  readonly marketplace: MarketplaceResource;
  readonly wallet: WalletResource;
  readonly suites: SuitesResource;
  readonly keys: KeysResource;
  readonly models: ModelsResource;
  readonly team: TeamResource;
  readonly overview: OverviewResource;
  readonly security: SecurityResource;
  readonly proving: ProvingResource;
  readonly fleet: FleetResource;
  readonly routing: RoutingResource;
  readonly studio: StudioResource;
  readonly workforce: WorkforceResource;
  readonly certification: CertificationResource;
  readonly enterprise: EnterpriseResource;
  readonly insurance: InsuranceResource;
  readonly bounties: BountiesResource;
  /** Agent FinOps — budgets & spend governance. */
  readonly budgets: BudgetsResource;
  /** Agent FinOps — cost attribution (spend visibility). */
  readonly spending: SpendingResource;
  /** Agent FinOps — zero-code spend capture via the gateway. */
  readonly gateway: GatewayResource;
  /** Agent FinOps — SDK-only metering: report usage + budget pre-flight, no proxy in the path. */
  readonly meter: MeterResource;
  /** M03 A2A gateway — mesh grants, hires, discovery, hop ledger. */
  readonly mesh: MeshResource;
  /** R4 — plan & subscription (entitlements, upgrade to Team). */
  readonly billing: BillingResource;

  constructor(options: ClientOptions = {}) {
    this.http = new HttpClient(options);
    this.agents = new AgentsResource(this.http);
    this.runs = new RunsResource(this.http);
    this.templates = new TemplatesResource(this.http);
    this.connectors = new ConnectorsResource(this.http);
    this.marketplace = new MarketplaceResource(this.http);
    this.wallet = new WalletResource(this.http);
    this.suites = new SuitesResource(this.http);
    this.keys = new KeysResource(this.http);
    this.models = new ModelsResource(this.http);
    this.team = new TeamResource(this.http);
    this.overview = new OverviewResource(this.http);
    this.security = new SecurityResource(this.http);
    this.proving = new ProvingResource(this.http);
    this.fleet = new FleetResource(this.http);
    this.routing = new RoutingResource(this.http);
    this.studio = new StudioResource(this.http);
    this.workforce = new WorkforceResource(this.http);
    this.certification = new CertificationResource(this.http);
    this.enterprise = new EnterpriseResource(this.http);
    this.insurance = new InsuranceResource(this.http);
    this.bounties = new BountiesResource(this.http);
    this.budgets = new BudgetsResource(this.http);
    this.spending = new SpendingResource(this.http);
    this.gateway = new GatewayResource(this.http);
    this.meter = new MeterResource(this.http);
    this.mesh = new MeshResource(this.http);
    this.billing = new BillingResource(this.http);
  }

  /** The resolved API base URL. */
  get baseUrl(): string {
    return this.http.baseUrl;
  }
}
