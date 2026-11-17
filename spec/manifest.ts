/**
 * Silvanexum API operation manifest — the declarative route map.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The request/response *shapes* live in the backend's `src/shared/*` Zod
 * contracts (the single source of truth — see packages/codegen). But the HTTP
 * *routing* (method, path, which schema goes where, auth scope) is defined
 * imperatively across `src/modules/<m>/routes.ts` and is NOT machine-readable.
 *
 * This file is the missing piece: a declarative map from each public operation
 * to its endpoint + the Zod/interface type names for its body, query, and
 * response. The codegen joins this manifest with the JSON Schemas derived from
 * the Zod contracts to emit an OpenAPI 3.1 document and the typed SDK clients.
 *
 * Keep this in sync with `Silvanexum-Frontend/src/lib/server-api.ts` and the
 * backend route files. The contract-drift check (`pnpm generate:check`) fails
 * the release if a referenced type name no longer exists in the contracts.
 */

/** Auth scope an API key needs for an operation. Mirrors M11/M18 key scopes. */
export type Scope = "read" | "run" | "manage" | "pay";

export interface ParamSpec {
  name: string;
  /** JSON-schema-ish primitive for path/query params. */
  type: "string" | "number" | "integer" | "boolean";
  required?: boolean;
  description?: string;
  /** Allowed values, when the param is an enum. */
  enum?: string[];
}

export interface OperationSpec {
  /** Stable camelCase id; becomes the SDK method name. */
  id: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Path template with `{param}` placeholders. */
  path: string;
  summary: string;
  scope: Scope;
  pathParams?: ParamSpec[];
  query?: ParamSpec[];
  /**
   * Type name (as emitted by codegen, e.g. "CreateAgentInput") of the JSON
   * request body. The codegen resolves it against the generated schema set.
   */
  body?: string;
  /**
   * Response descriptor. `type` is the emitted type name. `envelope`, when set,
   * is the single JSON key the payload is wrapped in (the backend returns
   * `{ agent: AgentView }` etc.); the SDK unwraps it so callers get the inner
   * value directly. A bare `status` (201/204) means the caller gets no body back.
   */
  response: { type: string; envelope?: string } | { status: 201 | 204 };
  /** Headers the caller may/must send beyond auth (e.g. idempotency-key). */
  headers?: { name: string; required?: boolean; description?: string }[];
  /**
   * Lifecycle: "live" = endpoint exists today; "planned" = specced (M11 P0) but
   * not yet implemented in the backend. Emitted into OpenAPI as an extension and
   * surfaced in docs so we never imply something ships before it does.
   */
  status: "live" | "planned";
}

export interface ResourceSpec {
  /** Resource namespace on the client, e.g. `sx.agents.*`. */
  name: string;
  description: string;
  operations: OperationSpec[];
}

export const RESOURCES: ResourceSpec[] = [
  {
    name: "agents",
    description: "Create, configure, version, and publish agents.",
    operations: [
      { id: "list", method: "GET", path: "/agents", summary: "List agents in your org.", scope: "read", response: { type: "AgentView", envelope: "agents" }, status: "live" },
      { id: "listPublic", method: "GET", path: "/agents/public", summary: "List public agents.", scope: "read", response: { type: "AgentView", envelope: "agents" }, status: "live" },
      { id: "get", method: "GET", path: "/agents/{id}", summary: "Fetch one agent (with your rating).", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "GetAgentResponse" }, status: "live" },
      { id: "create", method: "POST", path: "/agents", summary: "Create an agent.", scope: "manage", body: "CreateAgentInput", response: { type: "AgentView", envelope: "agent" }, status: "live" },
      { id: "update", method: "PATCH", path: "/agents/{id}", summary: "Update an agent.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "UpdateAgentInput", response: { type: "AgentView", envelope: "agent" }, status: "live" },
      { id: "delete", method: "DELETE", path: "/agents/{id}", summary: "Delete an agent.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
      { id: "publish", method: "POST", path: "/agents/{id}/publish", summary: "Make an agent public.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "AgentView", envelope: "agent" }, status: "live" },
      { id: "fork", method: "POST", path: "/agents/{id}/fork", summary: "Fork an agent into your org.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "AgentView", envelope: "agent" }, status: "live" },
      { id: "rate", method: "POST", path: "/agents/{id}/rate", summary: "Rate an agent 1–5.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "RateAgentInput", response: { type: "RateAgentResponse" }, status: "live" },
      { id: "lineage", method: "GET", path: "/agents/{id}/lineage", summary: "Fork-lineage graph for an agent.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "AgentLineage" }, status: "live" },
      { id: "bindIdentity", method: "POST", path: "/agents/{id}/identity", summary: "Bind an external A2A AgentCard identity.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "BindIdentityInput", response: { type: "BindIdentityResponse" }, status: "live" },
      { id: "unbindIdentity", method: "DELETE", path: "/agents/{id}/identity", summary: "Unbind external identity.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "AgentView", envelope: "agent" }, status: "live" },
    ],
  },
  {
    name: "versions",
    description: "Signed, content-addressed agent versions (M01).",
    operations: [
      { id: "list", method: "GET", path: "/agents/{agentId}/versions", summary: "List signed versions of an agent.", scope: "read", pathParams: [{ name: "agentId", type: "string", required: true }], response: { type: "AgentVersionView", envelope: "versions" }, status: "live" },
      { id: "publish", method: "POST", path: "/agents/{agentId}/versions", summary: "Publish a signed version.", scope: "manage", pathParams: [{ name: "agentId", type: "string", required: true }], body: "PublishVersionInput", response: { type: "AgentVersionView", envelope: "version" }, status: "live" },
      { id: "promote", method: "POST", path: "/agents/{agentId}/versions/{semver}/promote", summary: "Promote a version to a channel.", scope: "manage", pathParams: [{ name: "agentId", type: "string", required: true }, { name: "semver", type: "string", required: true }], response: { type: "PromoteVersionResponse" }, status: "live" },
      { id: "verify", method: "GET", path: "/agents/{agentId}/versions/{semver}/verify", summary: "Verify a version's signature/digest.", scope: "read", pathParams: [{ name: "agentId", type: "string", required: true }, { name: "semver", type: "string", required: true }], response: { type: "VerifyVersionResponse" }, status: "live" },
    ],
  },
  {
    name: "runs",
    description: "Execute agents and read signed, replayable traces.",
    operations: [
      { id: "create", method: "POST", path: "/playground/run", summary: "Run an agent on a prompt (captured + signed).", scope: "run", body: "PlaygroundRunInput", response: { type: "ExecutionView", envelope: "execution" }, status: "live" },
      { id: "rerun", method: "POST", path: "/playground/rerun", summary: "Re-run a recorded run (optionally swap agent/prompt).", scope: "run", body: "RerunInput", response: { type: "ExecutionView", envelope: "execution" }, status: "live" },
      { id: "list", method: "GET", path: "/executions", summary: "List runs for an agent.", scope: "read", query: [{ name: "agentId", type: "string", required: true }], response: { type: "ExecutionView", envelope: "executions" }, status: "live" },
      { id: "recent", method: "GET", path: "/executions/recent", summary: "Most recent runs across your org.", scope: "read", query: [{ name: "limit", type: "integer" }], response: { type: "RecentExecution", envelope: "executions" }, status: "live" },
      { id: "get", method: "GET", path: "/executions/{id}", summary: "Fetch one run's full signed trace.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "ExecutionView", envelope: "execution" }, status: "live" },
      { id: "setVisibility", method: "POST", path: "/executions/{id}/visibility", summary: "Make a run public or private.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "SetRunVisibilityInput", response: { type: "ExecutionView", envelope: "execution" }, status: "live" },
      { id: "getPublic", method: "GET", path: "/executions/public/{id}", summary: "Public (scrubbed) view of a shared run — no auth.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "PublicRunResponse" }, status: "live" },
    ],
  },
  {
    name: "templates",
    description: "1-click vertical agent templates (M11).",
    operations: [
      { id: "list", method: "GET", path: "/templates", summary: "Browse the template gallery.", scope: "read", query: [{ name: "vertical", type: "string" }, { name: "connector", type: "string" }, { name: "sort", type: "string", enum: ["deploys", "recent"] }], response: { type: "TemplateCard", envelope: "templates" }, status: "live" },
      { id: "get", method: "GET", path: "/templates/{id}", summary: "Template detail: params, connectors, config.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "TemplateDetail", envelope: "template" }, status: "live" },
      { id: "deploy", method: "POST", path: "/templates/{id}/deploy", summary: "1-click instantiate a template into a ready, signed agent.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "DeployTemplateInput", response: { type: "AgentView", envelope: "agent" }, headers: [{ name: "idempotency-key", description: "Make the deploy idempotent." }], status: "live" },
      { id: "create", method: "POST", path: "/templates", summary: "Publish a template from one of your agents.", scope: "manage", body: "CreateTemplateInput", response: { type: "TemplateDetail", envelope: "template" }, status: "live" },
    ],
  },
  {
    name: "connectors",
    description: "Authenticated third-party tools (via Nango) an agent can call.",
    operations: [
      { id: "list", method: "GET", path: "/connectors", summary: "List your org's connectors.", scope: "read", response: { type: "ConnectorView", envelope: "connectors" }, status: "live" },
      { id: "available", method: "GET", path: "/connectors/available", summary: "Nango integrations available to connect.", scope: "read", response: { type: "AvailableIntegrations" }, status: "live" },
      { id: "create", method: "POST", path: "/connectors", summary: "Create a connector (pre-auth).", scope: "manage", body: "CreateConnectorInput", response: { type: "ConnectorView", envelope: "connector" }, status: "live" },
      { id: "session", method: "POST", path: "/connectors/{id}/session", summary: "Mint a Nango Connect session token.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "ConnectorSessionResponse" }, status: "live" },
      { id: "confirm", method: "POST", path: "/connectors/{id}/confirm", summary: "Confirm the connectionId after Connect.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "ConfirmConnectorInput", response: { type: "ConnectorView", envelope: "connector" }, status: "live" },
      { id: "delete", method: "DELETE", path: "/connectors/{id}", summary: "Revoke a connector.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
    ],
  },
  {
    name: "marketplace",
    description: "Proof-ranked agent marketplace (M02).",
    operations: [
      { id: "search", method: "GET", path: "/marketplace/search", summary: "Search listings, ranked by proven outcomes.", scope: "read", query: [{ name: "q", type: "string" }, { name: "sort", type: "string", enum: ["proof", "recent", "price"] }, { name: "category", type: "string" }], response: { type: "ListingCard", envelope: "results" }, status: "live" },
      { id: "getListing", method: "GET", path: "/listings/{id}", summary: "Fetch one listing.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "ListingCard", envelope: "listing" }, status: "live" },
      { id: "createListing", method: "POST", path: "/listings", summary: "List an agent on the marketplace.", scope: "manage", body: "CreateListingInput", response: { type: "ListingCard", envelope: "listing" }, status: "live" },
      { id: "tryListing", method: "POST", path: "/listings/{id}/try", summary: "Try a listing on sample input.", scope: "run", pathParams: [{ name: "id", type: "string", required: true }], body: "TryListingInput", response: { type: "TryListingResponse" }, status: "live" },
      { id: "purchase", method: "POST", path: "/listings/{id}/purchase", summary: "Purchase/install a listing (settles on credits).", scope: "pay", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "PurchaseResult" }, headers: [{ name: "idempotency-key", required: true, description: "Required — makes the purchase exactly-once." }], status: "live" },
      { id: "myInstalls", method: "GET", path: "/me/installs", summary: "Listings installed by your org.", scope: "read", response: { type: "InstallView", envelope: "installs" }, status: "live" },
    ],
  },
  {
    name: "wallet",
    description: "Credits, ledger, and payouts (M10).",
    operations: [
      { id: "get", method: "GET", path: "/wallet", summary: "Wallet balance + recent ledger.", scope: "read", response: { type: "WalletView" }, status: "live" },
      { id: "ledger", method: "GET", path: "/wallet/ledger", summary: "Paged ledger entries.", scope: "read", query: [{ name: "limit", type: "integer" }, { name: "cursor", type: "string" }], response: { type: "LedgerPage" }, status: "live" },
      { id: "buyCredits", method: "POST", path: "/wallet/credits/purchase", summary: "Buy credits (returns a Stripe Checkout URL).", scope: "pay", body: "BuyCreditsInput", response: { type: "BuyCreditsResult" }, status: "live" },
      { id: "getPayoutAccount", method: "GET", path: "/payout-accounts", summary: "Your Stripe Connect payout account.", scope: "read", response: { type: "PayoutAccountResponse" }, status: "live" },
      { id: "startPayoutOnboarding", method: "POST", path: "/payout-accounts", summary: "Begin Stripe Connect onboarding.", scope: "pay", response: { type: "PayoutAccountView", envelope: "account" }, status: "live" },
      { id: "listPayouts", method: "GET", path: "/payouts", summary: "List payouts.", scope: "read", response: { type: "PayoutView", envelope: "payouts" }, status: "live" },
      { id: "createPayout", method: "POST", path: "/payouts", summary: "Request a payout.", scope: "pay", body: "CreatePayoutInput", response: { type: "PayoutView", envelope: "payout" }, headers: [{ name: "idempotency-key", required: true }], status: "live" },
    ],
  },
  {
    name: "suites",
    description: "Regression eval suites — the CI gate (M04).",
    operations: [
      { id: "list", method: "GET", path: "/suites", summary: "List suites.", scope: "read", response: { type: "SuiteView", envelope: "suites" }, status: "live" },
      { id: "get", method: "GET", path: "/suites/{id}", summary: "Suite detail with cases + runs.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "SuiteDetail", envelope: "suite" }, status: "live" },
      { id: "create", method: "POST", path: "/suites", summary: "Create a suite.", scope: "manage", body: "CreateSuiteInput", response: { type: "SuiteView", envelope: "suite" }, status: "live" },
      { id: "addCase", method: "POST", path: "/suites/{id}/cases", summary: "Add a baseline case.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "AddSuiteCaseInput", response: { type: "SuiteCaseView", envelope: "case" }, status: "live" },
      { id: "deleteCase", method: "DELETE", path: "/suites/{id}/cases/{caseId}", summary: "Delete a case.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }, { name: "caseId", type: "string", required: true }], response: { status: 204 }, status: "live" },
      { id: "run", method: "POST", path: "/suites/{id}/run", summary: "Run the suite (pass/fail gate).", scope: "run", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "SuiteRunView", envelope: "run" }, status: "live" },
      { id: "delete", method: "DELETE", path: "/suites/{id}", summary: "Delete a suite.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
    ],
  },
  {
    name: "keys",
    description: "BYO provider API keys.",
    operations: [
      { id: "list", method: "GET", path: "/keys", summary: "List saved provider keys (never the secret).", scope: "read", response: { type: "ProviderKeyView", envelope: "keys" }, status: "live" },
      { id: "validate", method: "POST", path: "/keys/validate", summary: "Validate a provider key without saving it.", scope: "manage", body: "ValidateKeyInput", response: { type: "KeyValidationResult" }, status: "live" },
      { id: "save", method: "POST", path: "/keys", summary: "Save a provider key.", scope: "manage", body: "SaveProviderKeyInput", response: { type: "SaveKeyResponse" }, status: "live" },
      { id: "delete", method: "DELETE", path: "/keys/{id}", summary: "Delete a provider key.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
    ],
  },
  {
    name: "models",
    description: "Model catalog (static + live, key-scoped).",
    operations: [
      { id: "list", method: "GET", path: "/models", summary: "Static model catalog.", scope: "read", response: { type: "ModelInfo", envelope: "models" }, status: "live" },
      { id: "live", method: "GET", path: "/models/{provider}/live", summary: "Live, key-scoped model list for a provider.", scope: "read", pathParams: [{ name: "provider", type: "string", required: true, enum: ["anthropic", "openai", "google", "ollama"] }], response: { type: "LiveModelsResponse" }, status: "live" },
    ],
  },
  {
    name: "team",
    description: "Org members and projects.",
    operations: [
      { id: "listMembers", method: "GET", path: "/team/members", summary: "List org members + your role.", scope: "read", response: { type: "ListMembersResponse" }, status: "live" },
      { id: "inviteMember", method: "POST", path: "/team/members/invite", summary: "Invite a member.", scope: "manage", body: "InviteMemberInput", response: { type: "OkResponse" }, status: "live" },
      { id: "updateMemberRole", method: "PATCH", path: "/team/members/{userId}", summary: "Change a member's role.", scope: "manage", pathParams: [{ name: "userId", type: "string", required: true }], body: "UpdateMemberInput", response: { type: "OkResponse" }, status: "live" },
      { id: "removeMember", method: "DELETE", path: "/team/members/{userId}", summary: "Remove a member.", scope: "manage", pathParams: [{ name: "userId", type: "string", required: true }], response: { status: 204 }, status: "live" },
      { id: "listProjects", method: "GET", path: "/team/projects", summary: "List projects.", scope: "read", response: { type: "ProjectView", envelope: "projects" }, status: "live" },
      { id: "createProject", method: "POST", path: "/team/projects", summary: "Create a project.", scope: "manage", body: "CreateProjectInput", response: { type: "ProjectView", envelope: "project" }, status: "live" },
      { id: "deleteProject", method: "DELETE", path: "/team/projects/{id}", summary: "Delete a project.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
    ],
  },
  {
    name: "overview",
    description: "Org dashboard stats.",
    operations: [
      { id: "get", method: "GET", path: "/overview", summary: "Headline org stats.", scope: "read", response: { type: "OverviewStats" }, status: "live" },
    ],
  },
  {
    name: "budgets",
    description: "Agent FinOps — spend caps over org/project/agent scopes, with block enforcement.",
    operations: [
      { id: "list", method: "GET", path: "/budgets", summary: "List budgets, each with live spend.", scope: "read", query: [{ name: "scopeType", type: "string" }], response: { type: "BudgetStatusView", envelope: "budgets" }, status: "live" },
      { id: "create", method: "POST", path: "/budgets", summary: "Create a spend cap.", scope: "manage", body: "CreateBudgetInput", response: { type: "BudgetView", envelope: "budget" }, status: "live" },
      { id: "get", method: "GET", path: "/budgets/{id}", summary: "A budget + current-period status.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "BudgetStatusView", envelope: "status" }, status: "live" },
      { id: "update", method: "PATCH", path: "/budgets/{id}", summary: "Update a budget.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], body: "UpdateBudgetInput", response: { type: "BudgetView", envelope: "budget" }, status: "live" },
      { id: "delete", method: "DELETE", path: "/budgets/{id}", summary: "Delete a budget.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
      { id: "status", method: "GET", path: "/budgets/{id}/status", summary: "Live status only (cheap poll).", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "BudgetStatusView", envelope: "status" }, status: "live" },
    ],
  },
  {
    name: "spending",
    description: "Agent FinOps — cost attribution rollups over real run telemetry + the mesh ledger.",
    operations: [
      { id: "summary", method: "GET", path: "/spending/summary", summary: "Spend attributed by agent/project/model/provider.", scope: "read", query: [{ name: "from", type: "string" }, { name: "to", type: "string" }, { name: "groupBy", type: "string" }], response: { type: "SpendingRow", envelope: "rows" }, status: "live" },
      { id: "trends", method: "GET", path: "/spending/trends", summary: "Spend over time (hour/day buckets).", scope: "read", query: [{ name: "from", type: "string" }, { name: "to", type: "string" }, { name: "bucket", type: "string" }], response: { type: "SpendingTrendPoint", envelope: "points" }, status: "live" },
      { id: "meshTrace", method: "GET", path: "/spending/mesh-trace/{rootRunId}", summary: "Multi-hop cost rolled up across an agent→agent trace.", scope: "read", pathParams: [{ name: "rootRunId", type: "string", required: true }], response: { type: "MeshTraceView", envelope: "trace" }, status: "live" },
    ],
  },
  {
    name: "mesh",
    description: "M03 A2A gateway — grants (the callee's hire contract), billed hops, proof-ranked discovery, and the hop ledger.",
    operations: [
      { id: "listGrants", method: "GET", path: "/mesh/grants", summary: "Grants issued by my org + grants targeting me.", scope: "read", response: { type: "MeshGrantView", envelope: "issued" }, status: "live" },
      { id: "createGrant", method: "POST", path: "/mesh/grants", summary: "Publish a hire grant for one of my agents.", scope: "manage", body: "CreateMeshGrantInput", response: { type: "MeshGrantView", envelope: "grant" }, status: "live" },
      { id: "revokeGrant", method: "DELETE", path: "/mesh/grants/{id}", summary: "Revoke a grant.", scope: "manage", pathParams: [{ name: "id", type: "string", required: true }], response: { status: 204 }, status: "live" },
      { id: "call", method: "POST", path: "/mesh/call", summary: "Hire a callee agent through the gateway (one billed hop).", scope: "run", body: "MeshCallInput", response: { type: "MeshCallView", envelope: "hop" }, status: "live" },
      { id: "discover", method: "GET", path: "/mesh/discover", summary: "Proof-ranked discovery of hireable callees.", scope: "read", query: [{ name: "q", type: "string" }, { name: "minTrustScore", type: "number" }, { name: "minSuccessRate", type: "number" }, { name: "minTotalRuns", type: "number" }, { name: "maxRateCredits", type: "number" }, { name: "limit", type: "number" }], response: { type: "MeshDiscoverHit", envelope: "results" }, status: "live" },
      { id: "listCalls", method: "GET", path: "/mesh/calls", summary: "The hop ledger (who hired whom, what it cost).", scope: "read", query: [{ name: "direction", type: "string" }, { name: "limit", type: "number" }, { name: "cursor", type: "string" }], response: { type: "MeshCallView", envelope: "calls" }, status: "live" },
      { id: "getCall", method: "GET", path: "/mesh/calls/{id}", summary: "One hop + its signed callee run.", scope: "read", pathParams: [{ name: "id", type: "string", required: true }], response: { type: "MeshCallView", envelope: "hop" }, status: "live" },
    ],
  },
  {
    name: "billing",
    description: "R4 — plan & subscription. Read the org's plan + entitlements; start a Stripe Checkout to upgrade to Team.",
    operations: [
      { id: "get", method: "GET", path: "/billing", summary: "The org's current plan + resolved entitlements.", scope: "read", response: { type: "BillingView" }, status: "live" },
      { id: "subscribe", method: "POST", path: "/billing/subscribe", summary: "Start a Stripe Checkout for the Team seat subscription.", scope: "pay", body: "PlanSubscribeInput", response: { status: 201 }, status: "live" },
    ],
  },
];

/** Flattened operation list with the owning resource attached. */
export const ALL_OPERATIONS = RESOURCES.flatMap((r) =>
  r.operations.map((op) => ({ ...op, resource: r.name })),
);
