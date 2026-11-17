/**
 * The contract registry — what the codegen emits, and from where.
 *
 * Two sources feed the generated type set:
 *
 *  1. ZOD_SCHEMAS — exports from the backend's `src/shared/*` that ARE Zod
 *     schemas. These are the single source of truth; we convert each to JSON
 *     Schema at generate-time. New request/response contracts should be added to
 *     `src/shared/*` as Zod and registered here.
 *
 *  2. SUPPLEMENTAL — JSON Schemas for the few types the backend does NOT (yet)
 *     express as Zod: response envelopes that have no single Zod schema, a couple
 *     of frontend-only DTOs (RecentExecution, OverviewStats), Nango-derived shapes
 *     (AvailableIntegrations), and the M11 template surface (`planned`, not built).
 *
 *     Entries marked `x-approximate` are hand-mirrors pending a backend Zod home.
 */

import type { JSONSchema } from "./jsonschema.js";

/** A backend Zod export to convert. `export` is the symbol name in src/shared. */
export interface ZodSchemaRef {
  export: string;
  /** Emitted type name (TS interface / Python class). */
  name: string;
}

/**
 * Explicit, deterministic selection. Order groups by source file for humans;
 * the codegen resolves refs by name, so order within the set doesn't matter.
 */
export const ZOD_SCHEMAS: ZodSchemaRef[] = [
  // providers.ts
  { export: "providerSchema", name: "Provider" },
  { export: "modelLimitTierSchema", name: "ModelLimitTier" },
  { export: "modelLimitsSchema", name: "ModelLimits" },
  { export: "modelInfoSchema", name: "ModelInfo" },
  { export: "liveModelsResponseSchema", name: "LiveModelsResponse" },
  // reputation.ts
  { export: "confidenceSchema", name: "Confidence" },
  { export: "reputationBreakdownSchema", name: "ReputationBreakdown" },
  { export: "reputationViewSchema", name: "ReputationView" },
  { export: "rateAgentSchema", name: "RateAgentInput" },
  // agents.ts
  { export: "agentVisibility", name: "AgentVisibility" },
  { export: "agentModelConfigSchema", name: "AgentModelConfig" },
  { export: "createAgentSchema", name: "CreateAgentInput" },
  { export: "updateAgentSchema", name: "UpdateAgentInput" },
  { export: "agentViewSchema", name: "AgentView" },
  { export: "bindIdentitySchema", name: "BindIdentityInput" },
  { export: "publishVersionSchema", name: "PublishVersionInput" },
  { export: "lineageNodeSchema", name: "LineageNode" },
  { export: "agentLineageSchema", name: "AgentLineage" },
  { export: "versionRunAggregateSchema", name: "VersionRunAggregate" },
  { export: "agentVersionViewSchema", name: "AgentVersionView" },
  // connectors.ts
  { export: "connectorStatus", name: "ConnectorStatus" },
  { export: "createConnectorSchema", name: "CreateConnectorInput" },
  { export: "connectorViewSchema", name: "ConnectorView" },
  // playground.ts
  { export: "playgroundRunSchema", name: "PlaygroundRunInput" },
  { export: "rerunSchema", name: "RerunInput" },
  { export: "executionStatus", name: "ExecutionStatus" },
  { export: "runVisibility", name: "RunVisibility" },
  { export: "setRunVisibilitySchema", name: "SetRunVisibilityInput" },
  { export: "traceStepSchema", name: "TraceStep" },
  { export: "executionViewSchema", name: "ExecutionView" },
  { export: "publicRunResponseSchema", name: "PublicRunResponse" },
  // marketplace.ts
  { export: "listingPricingInputSchema", name: "ListingPricingInput" },
  { export: "createListingSchema", name: "CreateListingInput" },
  { export: "marketplaceSearchSchema", name: "MarketplaceSearchInput" },
  { export: "tryListingSchema", name: "TryListingInput" },
  { export: "proofBlockSchema", name: "ProofBlock" },
  { export: "listingPricingViewSchema", name: "ListingPricingView" },
  { export: "listingCardSchema", name: "ListingCard" },
  { export: "installViewSchema", name: "InstallView" },
  { export: "purchaseResultSchema", name: "PurchaseResult" },
  // payments.ts
  { export: "buyCreditsSchema", name: "BuyCreditsInput" },
  { export: "createPayoutSchema", name: "CreatePayoutInput" },
  { export: "ledgerEntryViewSchema", name: "LedgerEntryView" },
  { export: "walletViewSchema", name: "WalletView" },
  { export: "payoutViewSchema", name: "PayoutView" },
  { export: "payoutAccountViewSchema", name: "PayoutAccountView" },
  { export: "buyCreditsResultSchema", name: "BuyCreditsResult" },
  // suites.ts
  { export: "suiteCaseResultSchema", name: "SuiteCaseResult" },
  { export: "createSuiteSchema", name: "CreateSuiteInput" },
  { export: "addSuiteCaseSchema", name: "AddSuiteCaseInput" },
  { export: "suiteCaseViewSchema", name: "SuiteCaseView" },
  { export: "suiteRunViewSchema", name: "SuiteRunView" },
  { export: "suiteViewSchema", name: "SuiteView" },
  { export: "suiteDetailSchema", name: "SuiteDetail" },
  // keys.ts
  { export: "saveProviderKeySchema", name: "SaveProviderKeyInput" },
  { export: "providerKeyStatus", name: "ProviderKeyStatus" },
  { export: "providerKeyViewSchema", name: "ProviderKeyView" },
  { export: "keyValidationResultSchema", name: "KeyValidationResult" },
  // apikeys.ts
  { export: "apiKeyScopeSchema", name: "ApiKeyScope" },
  { export: "createApiKeySchema", name: "CreateApiKeyInput" },
  { export: "apiKeyViewSchema", name: "ApiKeyView" },
  { export: "createApiKeyResultSchema", name: "CreateApiKeyResult" },
  // templates.ts (M11 — now live)
  { export: "templateParamSchema", name: "TemplateParam" },
  { export: "templateCardSchema", name: "TemplateCard" },
  { export: "templateDetailSchema", name: "TemplateDetail" },
  { export: "deployTemplateSchema", name: "DeployTemplateInput" },
  { export: "createTemplateSchema", name: "CreateTemplateInput" },
  { export: "templateSearchSchema", name: "TemplateSearchInput" },
  // team.ts
  { export: "memberRole", name: "MemberRole" },
  { export: "memberViewSchema", name: "MemberView" },
  { export: "inviteMemberSchema", name: "InviteMemberInput" },
  { export: "updateMemberSchema", name: "UpdateMemberInput" },
  { export: "projectViewSchema", name: "ProjectView" },
  { export: "createProjectSchema", name: "CreateProjectInput" },
  // security.ts (M06)
  { export: "auditTargetSchema", name: "AuditTarget" },
  { export: "scanFindingSchema", name: "ScanFinding" },
  { export: "guardrailRulesSchema", name: "GuardrailRules" },
  { export: "auditLogQuerySchema", name: "AuditLogQuery" },
  { export: "auditEntryViewSchema", name: "AuditEntryView" },
  { export: "auditChainVerifySchema", name: "AuditChainVerify" },
  { export: "scanResultViewSchema", name: "ScanResultView" },
  { export: "createGuardrailPolicySchema", name: "CreateGuardrailPolicyInput" },
  { export: "guardrailPolicyViewSchema", name: "GuardrailPolicyView" },
  { export: "attachGuardrailSchema", name: "AttachGuardrailInput" },
  { export: "guardrailAttachmentViewSchema", name: "GuardrailAttachmentView" },
  { export: "enforceInputSchema", name: "EnforceInput" },
  { export: "enforceResultSchema", name: "EnforceResult" },
  { export: "complianceBundleSchema", name: "ComplianceBundle" },
  { export: "complianceExportQuerySchema", name: "ComplianceExportQuery" },
  // proving.ts (M05)
  { export: "evalRubricSchema", name: "EvalRubric" },
  { export: "benchmarkScoringConfigSchema", name: "BenchmarkScoringConfig" },
  { export: "benchmarkCaseResultSchema", name: "BenchmarkCaseResult" },
  { export: "createEvalDatasetSchema", name: "CreateEvalDatasetInput" },
  { export: "evalDatasetViewSchema", name: "EvalDatasetView" },
  { export: "createBenchmarkSchema", name: "CreateBenchmarkInput" },
  { export: "benchmarkViewSchema", name: "BenchmarkView" },
  { export: "submitBenchmarkSchema", name: "SubmitBenchmarkInput" },
  { export: "benchmarkRunViewSchema", name: "BenchmarkRunView" },
  { export: "leaderboardEntryViewSchema", name: "LeaderboardEntryView" },
  { export: "benchmarkRunSummarySchema", name: "BenchmarkRunSummary" },
  { export: "benchmarkDetailSchema", name: "BenchmarkDetail" },
  // fleet.ts (M08)
  { export: "alertTargetSchema", name: "AlertTarget" },
  { export: "fleetMetricsQuerySchema", name: "FleetMetricsQuery" },
  { export: "fleetMetricPointSchema", name: "FleetMetricPoint" },
  { export: "fleetSeriesSchema", name: "FleetSeries" },
  { export: "fleetAgentRowSchema", name: "FleetAgentRow" },
  { export: "fleetCostQuerySchema", name: "FleetCostQuery" },
  { export: "fleetCostRowSchema", name: "FleetCostRow" },
  { export: "driftObservationSchema", name: "DriftObservation" },
  { export: "driftFlagSchema", name: "DriftFlag" },
  { export: "createAlertRuleSchema", name: "CreateAlertRuleInput" },
  { export: "updateAlertRuleSchema", name: "UpdateAlertRuleInput" },
  { export: "alertRuleViewSchema", name: "AlertRuleView" },
  { export: "alertEventViewSchema", name: "AlertEventView" },
  { export: "otelAttributeSchema", name: "OtelAttribute" },
  { export: "otelSpanSchema", name: "OtelSpan" },
  { export: "otelTraceExportSchema", name: "OtelTraceExport" },
  // routing.ts (M15)
  { export: "routingModelRefSchema", name: "RoutingModelRef" },
  { export: "routingWeightsSchema", name: "RoutingWeights" },
  { export: "routingCandidateSchema", name: "RoutingCandidate" },
  { export: "routingFailoverSchema", name: "RoutingFailover" },
  { export: "upsertRoutingPolicySchema", name: "UpsertRoutingPolicyInput" },
  { export: "routingPolicyViewSchema", name: "RoutingPolicyView" },
  { export: "routingPreviewSchema", name: "RoutingPreview" },
  { export: "routingDecisionsQuerySchema", name: "RoutingDecisionsQuery" },
  { export: "routingDecisionViewSchema", name: "RoutingDecisionView" },
  // studio.ts (M07)
  { export: "configDiffSchema", name: "ConfigDiff" },
  { export: "alignedStepSchema", name: "AlignedStep" },
  { export: "runDiffRollupsSchema", name: "RunDiffRollups" },
  { export: "runDiffResultSchema", name: "RunDiffResult" },
  { export: "createBranchSchema", name: "CreateBranchInput" },
  { export: "updateBranchSchema", name: "UpdateBranchInput" },
  { export: "branchViewSchema", name: "BranchView" },
  { export: "realtimeRoomSchema", name: "RealtimeRoom" },
  { export: "branchDetailSchema", name: "BranchDetail" },
  { export: "branchRerunSchema", name: "BranchRerunInput" },
  { export: "createRunDiffSchema", name: "CreateRunDiffInput" },
  { export: "runDiffViewSchema", name: "RunDiffView" },
  { export: "runDiffVisibilitySchema", name: "RunDiffVisibilityInput" },
  { export: "openPrSchema", name: "OpenPrInput" },
  { export: "prViewSchema", name: "PrView" },
  { export: "createPrReviewSchema", name: "CreatePrReviewInput" },
  { export: "prReviewViewSchema", name: "PrReviewView" },
  { export: "createCommentSchema", name: "CreateCommentInput" },
  { export: "commentViewSchema", name: "CommentView" },
  { export: "prDetailSchema", name: "PrDetail" },
  // workforce.ts (M09)
  { export: "reportTargetSchema", name: "ReportTarget" },
  { export: "escalationTriggerRuleSchema", name: "EscalationTriggerRule" },
  { export: "escalationRouteSchema", name: "EscalationRoute" },
  { export: "escalationPolicySchema", name: "EscalationPolicy" },
  { export: "shiftSchema", name: "Shift" },
  { export: "workforceScheduleSchema", name: "WorkforceSchedule" },
  { export: "createRoleSchema", name: "CreateRoleInput" },
  { export: "roleViewSchema", name: "RoleView" },
  { export: "createAssignmentSchema", name: "CreateAssignmentInput" },
  { export: "assignmentViewSchema", name: "AssignmentView" },
  { export: "orgChartNodeSchema", name: "OrgChartNode" },
  { export: "orgChartEdgeSchema", name: "OrgChartEdge" },
  { export: "orgChartViewSchema", name: "OrgChartView" },
  { export: "escalationsQuerySchema", name: "EscalationsQuery" },
  { export: "escalationViewSchema", name: "EscalationView" },
  { export: "resolveEscalationSchema", name: "ResolveEscalationInput" },
  { export: "hitlReviewViewSchema", name: "HitlReviewView" },
  { export: "reviewWindowQuerySchema", name: "ReviewWindowQuery" },
  { export: "performanceReviewSchema", name: "PerformanceReview" },
  // certification.ts (M16)
  { export: "operatedWindowSchema", name: "OperatedWindow" },
  { export: "operatorProofSchema", name: "OperatorProof" },
  { export: "reviewEligibilityViewSchema", name: "ReviewEligibilityView" },
  { export: "writeReviewSchema", name: "WriteReviewInput" },
  { export: "verifiedReviewViewSchema", name: "VerifiedReviewView" },
  { export: "applyCertificationSchema", name: "ApplyCertificationInput" },
  { export: "certAuditViewSchema", name: "CertAuditView" },
  { export: "certificationViewSchema", name: "CertificationView" },
  { export: "certificationDetailSchema", name: "CertificationDetail" },
  { export: "revokeCertificationSchema", name: "RevokeCertificationInput" },
  { export: "certVerifyViewSchema", name: "CertVerifyView" },
  // enterprise.ts (M12)
  { export: "createSsoConnectionSchema", name: "CreateSsoConnectionInput" },
  { export: "ssoConnectionViewSchema", name: "SsoConnectionView" },
  { export: "scimWebhookEventSchema", name: "ScimWebhookEvent" },
  { export: "scimUserViewSchema", name: "ScimUserView" },
  { export: "createRbacRoleSchema", name: "CreateRbacRoleInput" },
  { export: "rbacRoleViewSchema", name: "RbacRoleView" },
  { export: "createRbacBindingSchema", name: "CreateRbacBindingInput" },
  { export: "rbacBindingViewSchema", name: "RbacBindingView" },
  { export: "deploymentInfoViewSchema", name: "DeploymentInfoView" },
  // insurance.ts (M13)
  { export: "riskScoreInputsSchema", name: "RiskScoreInputs" },
  { export: "claimAdjudicationSchema", name: "ClaimAdjudication" },
  { export: "slaTermInputSchema", name: "SlaTermInput" },
  { export: "slaTermViewSchema", name: "SlaTermView" },
  { export: "slaStandingSchema", name: "SlaStanding" },
  { export: "riskScoreViewSchema", name: "RiskScoreView" },
  { export: "quotePolicySchema", name: "QuotePolicyInput" },
  { export: "bindPolicySchema", name: "BindPolicyInput" },
  { export: "policyQuoteViewSchema", name: "PolicyQuoteView" },
  { export: "policyViewSchema", name: "PolicyView" },
  { export: "policiesQuerySchema", name: "PoliciesQuery" },
  { export: "fileClaimSchema", name: "FileClaimInput" },
  { export: "claimViewSchema", name: "ClaimView" },
  { export: "claimsQuerySchema", name: "ClaimsQuery" },
  // bounties.ts (M14)
  { export: "evalRubricGateSchema", name: "EvalRubricGate" },
  { export: "evalRubricEnvelopeSchema", name: "EvalRubricEnvelope" },
  { export: "postBountySchema", name: "PostBountyInput" },
  { export: "bountyViewSchema", name: "BountyView" },
  { export: "bountiesQuerySchema", name: "BountiesQuery" },
  { export: "submitBountySchema", name: "SubmitBountyInput" },
  { export: "submissionViewSchema", name: "SubmissionView" },
  { export: "awardBountySchema", name: "AwardBountyInput" },
  { export: "bountyAwardViewSchema", name: "BountyAwardView" },
  { export: "bountyLeaderboardRowSchema", name: "BountyLeaderboardRow" },
  // budgets.ts (Agent FinOps — spend governance)
  { export: "createBudgetSchema", name: "CreateBudgetInput" },
  { export: "updateBudgetSchema", name: "UpdateBudgetInput" },
  { export: "budgetsQuerySchema", name: "BudgetsQuery" },
  { export: "budgetViewSchema", name: "BudgetView" },
  { export: "budgetStatusViewSchema", name: "BudgetStatusView" },
  // spending.ts (Agent FinOps — cost attribution)
  { export: "spendingSummaryQuerySchema", name: "SpendingSummaryQuery" },
  { export: "spendingRowSchema", name: "SpendingRow" },
  { export: "spendingTrendQuerySchema", name: "SpendingTrendQuery" },
  { export: "spendingTrendPointSchema", name: "SpendingTrendPoint" },
  { export: "meshHopViewSchema", name: "MeshHopView" },
  { export: "meshTraceViewSchema", name: "MeshTraceView" },
  // mesh.ts (M03 A2A gateway — grants, hires, discovery; testlab issue S4)
  { export: "createMeshGrantSchema", name: "CreateMeshGrantInput" },
  { export: "meshGrantViewSchema", name: "MeshGrantView" },
  { export: "meshCallSchema", name: "MeshCallInput" },
  { export: "meshCallViewSchema", name: "MeshCallView" },
  { export: "meshCallsQuerySchema", name: "MeshCallsQuery" },
  { export: "meshDiscoverQuerySchema", name: "MeshDiscoverQuery" },
  { export: "meshDiscoverHitSchema", name: "MeshDiscoverHit" },
  // plans.ts (R4 — subscriptions & entitlements)
  { export: "planSchema", name: "Plan" },
  { export: "billingViewSchema", name: "BillingView" },
  { export: "planSubscribeSchema", name: "PlanSubscribeInput" },
];

const ref = (name: string): JSONSchema => ({ $ref: `#/components/schemas/${name}` });
const str = (extra: Partial<JSONSchema> = {}): JSONSchema => ({ type: "string", ...extra });
const num = (): JSONSchema => ({ type: "number" });
const int = (): JSONSchema => ({ type: "integer" });
const bool = (): JSONSchema => ({ type: "boolean" });
const nullable = (s: JSONSchema): JSONSchema => ({ anyOf: [s, { type: "null" }] });
const arr = (items: JSONSchema): JSONSchema => ({ type: "array", items });
const obj = (
  properties: Record<string, JSONSchema>,
  required: string[] = Object.keys(properties),
  extra: Partial<JSONSchema> = {},
): JSONSchema => ({ type: "object", properties, required, additionalProperties: false, ...extra });

/** `x-approximate: true` = a type without a backend Zod home yet. */
const approx = (s: JSONSchema): JSONSchema => ({ ...s, "x-approximate": true });

export const SUPPLEMENTAL: Record<string, JSONSchema> = {
  // ── generic envelopes ──────────────────────────────────────────────────────
  OkResponse: obj({ ok: bool() }),

  // ── agents (response envelopes / composites) ─────────────────────────────────
  GetAgentResponse: obj({ agent: ref("AgentView"), myRating: nullable(num()) }),
  RateAgentResponse: obj({ reputation: ref("ReputationView"), myRating: num() }),
  BindIdentityResponse: obj({
    agent: ref("AgentView"),
    ingested: obj({ name: str(), url: str() }),
  }),
  PromoteVersionResponse: obj({
    promoted: str(),
    channels: arr(obj({ channel: str(), semver: str() })),
  }),
  VerifyVersionResponse: obj({ valid: bool(), digest: str(), recomputedDigest: str() }),

  // ── runs (frontend-only aggregate DTO) ────────────────────────────────────────
  RecentExecution: approx(
    obj(
      {
        id: str({ format: "uuid" }),
        agentId: str({ format: "uuid" }),
        agentName: str(),
        status: ref("ExecutionStatus"),
        latencyMs: int(),
        createdAt: str({ format: "date-time" }),
      },
      ["id", "agentId", "agentName", "status", "latencyMs", "createdAt"],
      { description: "Approximate mirror of the frontend RecentExecution DTO." },
    ),
  ),

  // ── connectors (envelopes + Nango-derived) ────────────────────────────────────
  ConfirmConnectorInput: obj({ connectionId: str() }),
  ConnectorSessionResponse: obj({ sessionToken: str() }, []),
  AvailableIntegration: approx(
    obj({ providerConfigKey: str(), displayName: str(), logo: nullable(str()) }, [
      "providerConfigKey",
      "displayName",
    ]),
  ),
  AvailableIntegrations: approx(obj({ integrations: arr(ref("AvailableIntegration")) })),

  // ── marketplace (response composite) ──────────────────────────────────────────
  TryListingResponse: obj({ runId: str(), status: str(), shareUrl: str() }),

  // ── wallet (response composites over the now-Zod views) ───────────────────────
  LedgerPage: obj({ entries: arr(ref("LedgerEntryView")), nextCursor: nullable(str()) }),
  PayoutAccountResponse: obj({ account: nullable(ref("PayoutAccountView")) }),

  // ── keys (envelopes) ──────────────────────────────────────────────────────────
  ValidateKeyInput: obj({ provider: ref("Provider"), apiKey: str() }),
  SaveKeyResponse: obj({ key: ref("ProviderKeyView"), validation: ref("KeyValidationResult") }),

  // ── team (envelope) ───────────────────────────────────────────────────────────
  ListMembersResponse: obj({ members: arr(ref("MemberView")), yourRole: ref("MemberRole") }),

  // ── overview (frontend-only aggregate DTO) ────────────────────────────────────
  OverviewStats: approx(
    obj(
      {
        totalAgents: int(),
        totalRuns: int(),
        successRate: nullable(num()),
        totalConnectors: int(),
      },
      ["totalAgents", "totalRuns", "successRate", "totalConnectors"],
      { description: "Approximate mirror of the frontend OverviewStats DTO." },
    ),
  ),
};
