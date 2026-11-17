"""
GENERATED — DO NOT EDIT BY HAND.

Emitted from the backend's src/shared/* Zod contracts by packages/codegen.
Regenerate with `pnpm generate`. Editing this file will be overwritten and
will fail `pnpm generate:check` in CI.
"""
# fmt: off
# ruff: noqa
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

AgentVisibility = Literal["private", "public"]
ApiKeyScope = Literal["read", "run", "manage", "pay"]
Confidence = Literal["none", "low", "medium", "high"]
ConnectorStatus = Literal["pending", "connected", "error"]
ExecutionStatus = Literal["success", "error"]
MemberRole = Literal["owner", "admin", "member"]
Plan = Literal["free", "team", "scale", "enterprise"]
Provider = Literal["anthropic", "openai", "google", "ollama"]
ProviderKeyStatus = Literal["valid", "invalid", "unchecked"]
RunVisibility = Literal["private", "public"]

class AddSuiteCaseInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fromExecutionId: Optional[str] = None
    prompt: Optional[str] = None

class AgentLineage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    currentId: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class AgentModelConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    model: str
    systemPrompt: Optional[str] = None
    maxTokens: Optional[int] = None

class AgentVersionView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    semver: str
    digest: str
    signature: str
    changelog: str
    createdAt: str
    channels: List[str]
    runs: Dict[str, Any]

class AgentView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    ownerId: str
    orgId: str
    name: str
    description: str
    avatarUrl: Union[str, None]
    specialties: List[str]
    config: Dict[str, Any]
    connectorIds: List[str]
    agentToolIds: List[str]
    visibility: Literal["private", "public"]
    forkedFromId: Optional[str]
    projectId: Optional[str]
    agentCardUrl: Union[str, None]
    externalName: Union[str, None]
    createdAt: str
    updatedAt: str
    reputation: Optional[Dict[str, Any]] = None

class AlertEventView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    ruleId: str
    agentId: Union[str, None]
    firedAt: str
    value: Union[str, None]
    baseline: Union[str, None]
    driftKind: Optional[Literal["alias", "shift"]]
    delivered: bool
    deliveryAttempts: int
    resolvedAt: Optional[str]

class AlertRuleView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    metric: Literal["p95_latency_ms", "error_rate", "cost_credits", "drift", "throughput"]
    agentId: Union[str, None]
    condition: Literal["gt", "lt", "change_pct"]
    threshold: str
    windowSeconds: int
    target: Dict[str, Any]
    enabled: bool
    createdAt: str
    updatedAt: str

class AlertTarget(BaseModel):
    model_config = ConfigDict(extra="ignore")

    webhook: Optional[str] = None
    email: Optional[str] = None
    slack: Optional[str] = None

class AlignedStep(BaseModel):
    model_config = ConfigDict(extra="ignore")

    op: Literal["unchanged", "changed", "added", "removed"]
    stepA: Optional[Dict[str, Any]]
    stepB: Optional[Dict[str, Any]]
    latencyDeltaMs: Union[float, None]
    tokenDelta: Union[float, None]
    statusDelta: Union[str, None]

class ApiKeyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    maskedHint: str
    scopes: List[Literal["read", "run", "manage", "pay"]]
    lastUsedAt: Optional[str]
    revokedAt: Optional[str]
    createdAt: str

class ApplyCertificationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    agentVersion: str
    seal: Literal["capability_verified", "security_audited", "enterprise_ready"]
    category: Optional[str] = None

class AssignmentView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    roleId: str
    projectId: Union[str, None]
    reportTo: Optional[Dict[str, Any]]
    schedule: Optional[Dict[str, Any]]
    status: Literal["active", "paused", "off_shift"]
    createdAt: str
    updatedAt: str

class AttachGuardrailInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    policyId: str

class AuditChainVerify(BaseModel):
    model_config = ConfigDict(extra="ignore")

    intact: bool
    length: int
    firstBrokenSeq: Optional[int]

class AuditEntryView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    seq: int
    actorType: Literal["user", "agent", "system", "service"]
    actorId: Union[str, None]
    action: str
    runId: Union[str, None]
    target: Optional[Dict[str, Any]]
    metadata: Dict[str, Any]
    prevHash: str
    entryHash: str
    createdAt: str

class AuditLogQuery(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    agentId: Optional[str] = None
    runId: Optional[str] = None
    action: Optional[str] = None
    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None
    verify: Optional[bool] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None

class AuditTarget(BaseModel):
    model_config = ConfigDict(extra="ignore")

    table: Optional[str] = None
    id: Optional[str] = None

class AvailableIntegration(BaseModel):
    model_config = ConfigDict(extra="ignore")

    providerConfigKey: str
    displayName: str
    logo: Optional[str] = None

class AvailableIntegrations(BaseModel):
    model_config = ConfigDict(extra="ignore")

    integrations: List[AvailableIntegration]

class AwardBountyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    autoList: Optional[bool] = None

class BenchmarkCaseResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    caseId: str
    prompt: str
    status: Literal["success", "error"]
    baselineStatus: Literal["success", "error"]
    similarity: int
    passed: bool
    reason: str
    executionId: str
    score: Optional[int] = None

class BenchmarkDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    datasetId: str
    name: str
    category: str
    passThreshold: int
    scoringConfig: Dict[str, Any]
    visibility: Literal["private", "public"]
    createdAt: str
    runs: List[Dict[str, Any]]

class BenchmarkRunSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentVersion: str
    status: Literal["queued", "running", "pass", "fail", "error"]
    score: Union[float, None]
    total: int
    passed: int
    failed: int
    createdAt: str
    completedAt: Optional[str]

class BenchmarkRunView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    benchmarkId: str
    agentId: str
    agentVersion: str
    status: Literal["queued", "running", "pass", "fail", "error"]
    score: Union[float, None]
    total: int
    passed: int
    failed: int
    p50LatencyMs: Optional[int]
    costCredits: Union[str, None]
    sandboxId: Union[str, None]
    results: List[Dict[str, Any]]
    createdAt: str
    completedAt: Optional[str]

class BenchmarkScoringConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: Literal["similarity", "exact", "json", "regex", "llm_judge"]
    similarityThreshold: Optional[int] = None
    jsonAsserts: Optional[List[str]] = None
    regexAsserts: Optional[List[str]] = None
    rubric: Optional[Dict[str, Any]] = None

class BenchmarkView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    datasetId: str
    name: str
    category: str
    passThreshold: int
    scoringConfig: Dict[str, Any]
    visibility: Literal["private", "public"]
    createdAt: str

class BillingView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    plan: Literal["free", "team", "scale", "enterprise"]
    subscriptionActive: bool
    seats: int
    currentPeriodEnd: Optional[str]
    complimentary: Optional[Dict[str, Any]]
    entitlements: Dict[str, Any]

class BindIdentityInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentCardUrl: str

class BindIdentityResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agent: AgentView
    ingested: Dict[str, Any]

class BindPolicyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    riskScoreId: str
    agentId: str
    agentVersion: Optional[str] = None
    slaTerms: List[Dict[str, Any]]
    coverageCapCredits: float
    premiumCredits: float
    term: Optional[str] = None

class BountiesQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    category: Optional[str] = None
    status: Optional[Literal["draft", "open", "judging", "awarded", "refunded", "expired"]] = None
    sort: Optional[Literal["budget", "deadline", "recent"]] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None

class BountyAwardView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    bountyId: str
    outcome: Literal["awarded", "refunded", "expired_no_submissions"]
    winningSubmissionId: Union[str, None]
    winningScore: Optional[int]
    runnerUpScore: Optional[int]
    awardCredits: Union[str, None]
    platformFeeCredits: Union[str, None]
    settlementTxnId: Union[str, None]
    listingId: Union[str, None]
    awardedAt: str

class BountyLeaderboardRow(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rank: int
    submissionId: str
    agentId: str
    agentVersion: str
    score: Union[float, None]
    passed: Union[bool, None]
    status: Literal["queued", "scoring", "scored", "error", "disqualified"]

class BountyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    requesterUserId: str
    title: str
    spec: str
    category: str
    tags: List[str]
    budgetCredits: str
    escrowTxnId: Union[str, None]
    evalRubric: Dict[str, Any]
    evalDatasetId: Union[str, None]
    minScore: Optional[int]
    maxSubmissionsPerOrg: int
    tieBreak: Literal["earliest_submit", "lowest_cost", "highest_confidence"]
    status: Literal["draft", "open", "judging", "awarded", "refunded", "expired"]
    deadline: str
    visibility: Literal["public", "private"]
    submissionCount: Optional[int] = None
    createdAt: str

class BranchDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    baseAgentId: str
    baseVersionId: Union[str, None]
    name: str
    config: Dict[str, Any]
    connectorIds: List[str]
    agentToolIds: List[str]
    originRunId: Union[str, None]
    status: Literal["open", "merged", "closed"]
    createdBy: str
    createdAt: str
    updatedAt: str
    room: Dict[str, Any]

class BranchRerunInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    input: Optional[str] = None

class BranchView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    baseAgentId: str
    baseVersionId: Union[str, None]
    name: str
    config: Dict[str, Any]
    connectorIds: List[str]
    agentToolIds: List[str]
    originRunId: Union[str, None]
    status: Literal["open", "merged", "closed"]
    createdBy: str
    createdAt: str
    updatedAt: str

class BudgetStatusView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    budget: Dict[str, Any]
    periodStart: str
    periodEnd: str
    spentCredits: str
    limitCredits: str
    remainingCredits: str
    usedPct: float
    state: Literal["ok", "warn", "exceeded"]

class BudgetView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    scopeType: Literal["org", "project", "agent"]
    scopeId: Union[str, None]
    periodType: Literal["daily", "weekly", "monthly", "rolling_30d", "custom"]
    limitCredits: str
    enforcement: Literal["off", "alert", "block"]
    alertThresholdPct: int
    periodStartAt: Optional[str]
    periodEndAt: Optional[str]
    createdAt: str
    updatedAt: str

class BudgetsQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    scopeType: Optional[Literal["org", "project", "agent"]] = None

class BuyCreditsInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    credits: int

class BuyCreditsResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    purchaseId: str
    checkoutUrl: str

class CertAuditView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    certificationId: str
    agentId: str
    scanResultId: Union[str, None]
    guardrailPolicyId: Union[str, None]
    auditLogSeq: Optional[int]
    verdict: Literal["pass", "fail"]
    findings: Dict[str, Any]
    auditor: Literal["automated", "human", "partner"]
    createdAt: str

class CertVerifyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    valid: bool
    certificationId: str
    seal: Literal["capability_verified", "security_audited", "enterprise_ready"]
    agentVersion: str
    status: Literal["pending", "active", "expired", "revoked"]
    reason: Union[str, None]

class CertificationDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentVersion: str
    seal: Literal["capability_verified", "security_audited", "enterprise_ready"]
    category: Union[str, None]
    status: Literal["pending", "active", "expired", "revoked"]
    benchmarkRunId: Union[str, None]
    certAuditId: Union[str, None]
    score: Union[str, None]
    signature: Union[str, None]
    issuedAt: Optional[str]
    expiresAt: Optional[str]
    revokedAt: Optional[str]
    revokeReason: Union[str, None]
    createdAt: str
    updatedAt: str
    certAudit: Optional[Dict[str, Any]]

class CertificationView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentVersion: str
    seal: Literal["capability_verified", "security_audited", "enterprise_ready"]
    category: Union[str, None]
    status: Literal["pending", "active", "expired", "revoked"]
    benchmarkRunId: Union[str, None]
    certAuditId: Union[str, None]
    score: Union[str, None]
    signature: Union[str, None]
    issuedAt: Optional[str]
    expiresAt: Optional[str]
    revokedAt: Optional[str]
    revokeReason: Union[str, None]
    createdAt: str
    updatedAt: str

class ClaimAdjudication(BaseModel):
    model_config = ConfigDict(extra="ignore")

    verifiedRuns: int
    failedVerify: int
    recomputedValue: float
    decision: Literal["approved", "denied", "excluded"]
    reason: str

class ClaimView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    policyId: str
    slaTermId: str
    status: Literal["detected", "adjudicating", "approved", "denied", "paid", "excluded"]
    openedBy: Literal["monitor", "manual"]
    windowStart: str
    windowEnd: str
    observedValue: float
    guaranteedValue: float
    sampleSize: int
    evidenceRunIds: List[str]
    adjudication: Optional[Dict[str, Any]]
    payoutCredits: Union[str, None]
    payoutLedgerTxId: Union[str, None]
    denialReason: Optional[Literal["error_budget_not_exhausted", "excluded", "insufficient_sample", "fraud"]]
    createdAt: str

class ClaimsQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    policyId: Optional[str] = None
    status: Optional[Literal["detected", "adjudicating", "approved", "denied", "paid", "excluded"]] = None
    limit: Optional[int] = None

class CommentView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    prId: Union[str, None]
    parentId: Union[str, None]
    anchorKind: Literal["config_path", "trace_step", "general"]
    anchorPath: Union[str, None]
    anchorRunId: Union[str, None]
    anchorStep: Optional[int]
    authorId: str
    body: str
    resolved: bool
    createdAt: str
    updatedAt: str

class ComplianceBundle(BaseModel):
    model_config = ConfigDict(extra="ignore")

    system: Dict[str, Any]
    runs: List[Dict[str, Any]]
    scans: List[Dict[str, Any]]
    guardrails: List[Dict[str, Any]]
    audit: Dict[str, Any]
    provenance: Dict[str, Any]

class ComplianceExportQuery(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    agentId: Optional[str] = None
    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None

class ConfigDiff(BaseModel):
    model_config = ConfigDict(extra="ignore")

    changed: Optional[List[Dict[str, Any]]] = None
    added: Optional[List[str]] = None
    removed: Optional[List[str]] = None

class ConfirmConnectorInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    connectionId: str

class ConnectorSessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    sessionToken: Optional[str] = None

class ConnectorView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    providerConfigKey: str
    displayName: str
    connectionId: Union[str, None]
    status: Literal["pending", "connected", "error"]
    createdAt: str

class CreateAgentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    description: Optional[str] = None
    avatarUrl: Optional[str] = None
    specialties: Optional[List[str]] = None
    config: Dict[str, Any]
    connectorIds: Optional[List[str]] = None
    agentToolIds: Optional[List[str]] = None
    projectId: Optional[str] = None

class CreateAlertRuleInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    metric: Literal["p95_latency_ms", "error_rate", "cost_credits", "drift", "throughput"]
    agentId: Optional[str] = None
    condition: Literal["gt", "lt", "change_pct"]
    threshold: float
    windowSeconds: Optional[int] = None
    target: Dict[str, Any]
    enabled: Optional[bool] = None

class CreateApiKeyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    scopes: List[Literal["read", "run", "manage", "pay"]]

class CreateApiKeyResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: Dict[str, Any]
    token: str

class CreateAssignmentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    roleId: str
    projectId: Optional[str] = None
    reportTo: Optional[Dict[str, Any]] = None
    schedule: Optional[Dict[str, Any]] = None
    status: Optional[Literal["active", "paused", "off_shift"]] = None

class CreateBenchmarkInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    datasetId: str
    name: str
    category: str
    passThreshold: Optional[int] = None
    scoringConfig: Dict[str, Any]
    visibility: Optional[Literal["private", "public"]] = None

class CreateBranchInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    fromRun: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    connectorIds: Optional[List[str]] = None
    agentToolIds: Optional[List[str]] = None

class CreateBudgetInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    scopeType: Literal["org", "project", "agent"]
    scopeId: Optional[str] = None
    periodType: Literal["daily", "weekly", "monthly", "rolling_30d", "custom"]
    limitCredits: float
    enforcement: Optional[Literal["off", "alert", "block"]] = None
    alertThresholdPct: Optional[int] = None
    periodStartAt: Optional[str] = None
    periodEndAt: Optional[str] = None

class CreateCommentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    body: str
    parentId: Optional[str] = None
    anchorKind: Optional[Literal["config_path", "trace_step", "general"]] = None
    anchorPath: Optional[str] = None
    anchorRunId: Optional[str] = None
    anchorStep: Optional[int] = None

class CreateConnectorInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    providerConfigKey: str
    displayName: str

class CreateEvalDatasetInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    category: str
    version: Optional[str] = None
    scoringKind: Optional[Literal["similarity", "exact", "json", "regex", "llm_judge"]] = None
    rubric: Optional[Dict[str, Any]] = None
    cases: Optional[List[Dict[str, Any]]] = None
    storageRef: Optional[str] = None

class CreateGuardrailPolicyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    scope: Optional[Literal["org", "agent"]] = None
    rules: Dict[str, Any]

class CreateListingInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    versionId: Optional[str] = None
    title: str
    summary: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    pricing: Dict[str, Any]

class CreateMeshGrantInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    grantorAgent: str
    granteeScope: Literal["agent", "org", "public"]
    granteeAgent: Optional[str] = None
    granteeOrg: Optional[str] = None
    allowed: Optional[bool] = None
    rate: Dict[str, Any]
    quota: Optional[Dict[str, Any]] = None
    minTrustScore: Optional[float] = None

class CreatePayoutInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    amountCredits: int

class CreatePrReviewInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    verdict: Literal["approve", "request_changes", "comment"]
    body: Optional[str] = None

class CreateProjectInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    description: Optional[str] = None

class CreateRbacBindingInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    roleId: str
    principalType: Literal["user", "scim_group"]
    principalId: str
    scopeType: Optional[Literal["org", "project"]] = None
    scopeId: Optional[str] = None

class CreateRbacRoleInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    permissions: List[Literal["agent:publish", "agent:run", "agent:read", "marketplace:list", "audit:read", "billing:read", "rbac:manage", "sso:manage", "scim:manage", "org:admin"]]

class CreateRoleInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str
    description: Optional[str] = None
    defaultReportTo: Optional[Dict[str, Any]] = None
    escalationPolicy: Optional[Dict[str, Any]] = None
    requiredMinTrust: Optional[float] = None
    requiredConfidence: Optional[Literal["low", "medium", "high"]] = None

class CreateRunDiffInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    runAId: str
    runBId: str
    persist: Optional[bool] = None

class CreateSsoConnectionInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["okta", "azure-ad", "google", "generic-saml", "oidc"]
    domain: str

class CreateSuiteInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    name: str
    description: Optional[str] = None
    similarityThreshold: Optional[int] = None

class CreateTemplateInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    slug: str
    displayName: str
    vertical: str
    description: Optional[str] = None
    sourceAgentId: str
    params: Optional[List[Dict[str, Any]]] = None
    requiredConnectors: Optional[List[str]] = None
    visibility: Optional[Literal["private", "public"]] = None

class DeployTemplateInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    params: Optional[Dict[str, str]] = None
    name: Optional[str] = None
    projectId: Optional[str] = None

class DeploymentInfoView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tier: Literal["managed", "dedicated", "self-host", "air-gapped"]
    airgapped: bool
    identityProvider: Literal["workos", "oidc", "saml"]
    economyMode: Literal["external", "showback"]
    modelProviders: List[str]
    ssoConfigured: bool

class DriftFlag(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    kind: Literal["alias", "shift"]
    baseline: Dict[str, Any]
    observed: Dict[str, Any]
    runIds: List[str]

class DriftObservation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    modelAlias: Union[str, None]
    p50LatencyMs: Optional[int]
    p50CostCredits: Union[str, None]
    successRate: Union[float, None]

class EnforceInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tool: Optional[str] = None
    egressHost: Optional[str] = None
    content: Optional[str] = None
    traceStepIdx: Optional[int] = None

class EnforceResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    allowed: bool
    verdict: Literal["allow", "flag", "block"]
    severity: Literal["none", "low", "medium", "high", "critical"]
    rule: Union[str, None]
    reason: Union[str, None]
    onBlock: Literal["fail", "escalate", "redact_and_continue"]
    findings: List[Dict[str, Any]]
    redactedContent: Union[str, None]

class EscalationPolicy(BaseModel):
    model_config = ConfigDict(extra="ignore")

    triggers: Optional[List[Dict[str, Any]]] = None
    route: Optional[Dict[str, Any]] = None
    onExhaustion: Optional[Literal["escalate_human", "fail"]] = None

class EscalationRoute(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: Literal["human"]
    assigneePool: str
    sla: Optional[str] = None

class EscalationTriggerRule(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: Literal["low_confidence", "guardrail", "cost_ceiling", "request_human", "reporting_line_exhausted"]
    below: Optional[float] = None
    policies: Optional[List[str]] = None
    credits: Optional[float] = None

class EscalationView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    runId: str
    agentId: str
    assignmentId: Union[str, None]
    trigger: Literal["low_confidence", "guardrail", "cost_ceiling", "request_human", "reporting_line_exhausted"]
    triggerDetail: Dict[str, Any]
    assigneeId: Union[str, None]
    status: Literal["pending", "assigned", "decided", "resumed", "aborted", "expired"]
    slaDueAt: Optional[str]
    createdAt: str
    assignedAt: Optional[str]
    decidedAt: Optional[str]

class EscalationsQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: Optional[Literal["pending", "assigned", "decided", "resumed", "aborted", "expired"]] = None
    pool: Optional[str] = None
    limit: Optional[int] = None

class EvalDatasetView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    category: str
    version: str
    caseCount: int
    scoringKind: Literal["similarity", "exact", "json", "regex", "llm_judge"]
    rubric: Optional[Dict[str, Any]]
    visibility: Literal["private", "public"]
    createdAt: str

class EvalRubric(BaseModel):
    model_config = ConfigDict(extra="ignore")

    criteria: Optional[List[str]] = None
    scaleMax: Optional[int] = None
    instructions: Optional[str] = None

class EvalRubricEnvelope(BaseModel):
    model_config = ConfigDict(extra="ignore")

    datasetRef: Optional[str] = None
    passThreshold: Optional[int] = None
    aggregate: Optional[Literal["mean_case_score", "pass_rate"]] = None
    scorers: List[Dict[str, Any]]
    gates: Optional[List[Dict[str, Any]]] = None
    tieBreak: Optional[Literal["earliest_submit", "lowest_cost", "highest_confidence"]] = None

class EvalRubricGate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    metric: Literal["p95_latency_ms", "p50_latency_ms", "error_rate"]
    max: float

class ExecutionView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    status: Literal["success", "error"]
    prompt: str
    output: str
    thinking: Optional[Union[str, None]] = None
    errorMessage: Union[str, None]
    inputTokens: int
    outputTokens: int
    latencyMs: int
    trace: Optional[List[Dict[str, Any]]] = None
    visibility: Literal["private", "public"]
    contentHash: Union[str, None]
    signature: Union[str, None]
    parentExecutionId: Union[str, None]
    createdAt: str

class FileClaimInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    policyId: str
    slaTermId: str

class FleetAgentRow(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    name: str
    runs: int
    p95LatencyMs: Optional[int]
    successRate: float
    costCredits: str
    modelAlias: Union[str, None]
    drift: Optional[Dict[str, Any]]

class FleetCostQuery(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None
    groupBy: Optional[Literal["provider", "model"]] = None

class FleetCostRow(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: str
    model: Union[str, None]
    costCredits: str
    runs: int

class FleetMetricPoint(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ts: str
    runs: int
    errorRate: float
    p50: Optional[int]
    p95: Optional[int]
    costCredits: str
    tokens: int

class FleetMetricsQuery(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None
    bucket: Optional[Literal["1m", "1h", "1d"]] = None
    agentId: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    groupBy: Optional[Literal["agent", "provider", "model", "project"]] = None

class FleetSeries(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: str
    points: List[Dict[str, Any]]

class GetAgentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agent: AgentView
    myRating: Optional[float]

class GuardrailAttachmentView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: Union[str, None]
    policyId: str
    policyName: str
    version: int
    attachedAt: str

class GuardrailPolicyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    version: int
    scope: Literal["org", "agent"]
    rules: Dict[str, Any]
    isActive: bool
    createdAt: str
    updatedAt: str

class GuardrailRules(BaseModel):
    model_config = ConfigDict(extra="ignore")

    allowedTools: Optional[List[str]] = None
    allowedEgress: Optional[Dict[str, Any]] = None
    dataHandling: Optional[Dict[str, Any]] = None
    onBlock: Optional[Literal["fail", "escalate", "redact_and_continue"]] = None
    audit: Optional[Literal["always", "on_block", "never"]] = None

class HitlReviewView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    escalationId: str
    reviewerId: str
    decision: Literal["approve", "edit", "reject", "abort"]
    editedPayload: Optional[Dict[str, Any]]
    comment: Union[str, None]
    latencyMs: int
    createdAt: str

class InstallView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    listingId: str
    agentId: str
    source: str
    active: bool
    grantedAt: str

class InviteMemberInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: str
    role: Optional[Literal["owner", "admin", "member"]] = None

class KeyValidationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    valid: bool
    message: Optional[str] = None

class LeaderboardEntryView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rank: int
    agentId: str
    agentVersion: str
    benchmarkRunId: str
    score: str
    p50LatencyMs: Optional[int]
    costCredits: Union[str, None]
    runCount: int
    publishedAt: str

class LedgerEntryView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    transactionId: str
    direction: Literal["debit", "credit"]
    amountCredits: str
    causeType: Literal["purchase", "mesh_call", "payout", "run", "refund", "dispute", "reconciliation_adjustment", "referral_reward"]
    causeId: str
    runId: Union[str, None]
    counterAccount: Optional[Literal["user_wallet", "org_wallet", "builder_earnings", "platform_revenue", "platform_float", "escrow"]]
    createdAt: str

class LedgerPage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    entries: List[LedgerEntryView]
    nextCursor: Optional[str]

class LineageNode(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    visible: bool
    trustScore: Union[float, None]
    isCurrent: bool

class ListMembersResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    members: List[MemberView]
    yourRole: MemberRole

class ListingCard(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    versionId: Union[str, None]
    title: str
    summary: str
    category: str
    tags: List[str]
    status: str
    pricing: Optional[Dict[str, Any]]
    proof: Dict[str, Any]
    proofScore: float
    placement: Dict[str, Any]
    createdAt: str

class ListingPricingInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model: Literal["free", "one_time", "usage_metered", "subscription", "revenue_share"]
    amountCredits: Optional[int] = None
    perRunCredits: Optional[int] = None
    interval: Optional[Literal["month", "year"]] = None
    takeRateBp: Optional[int] = None
    builderShareBp: Optional[int] = None

class ListingPricingView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model: Literal["free", "one_time", "usage_metered", "subscription", "revenue_share"]
    amountCredits: Union[float, None]
    perRunCredits: Union[float, None]
    interval: Union[str, None]
    takeRateBp: int
    builderShareBp: int

class LiveModelsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    source: Literal["registry", "live"]
    keyConfigured: bool
    models: List[Dict[str, Any]]
    warning: Optional[str] = None

class MarketplaceSearchInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    q: Optional[str] = None
    category: Optional[str] = None
    sort: Optional[Literal["proof", "recent", "price"]] = None
    limit: Optional[int] = None

class MemberView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    userId: str
    email: str
    name: Union[str, None]
    role: Literal["owner", "admin", "member"]
    isYou: bool
    joinedAt: str

class MeshCallInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    callerAgent: str
    calleeAgent: str
    input: str
    require: Optional[Dict[str, Any]] = None
    parentCallId: Optional[str] = None

class MeshCallView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    callerAgent: str
    calleeAgent: str
    runId: Union[str, None]
    parentCallId: Union[str, None]
    depth: int
    attribution: Dict[str, Any]
    grantId: Union[str, None]
    escrowCredits: str
    costCredits: Union[str, None]
    ledgerTxId: Union[str, None]
    status: Literal["authorized", "running", "settled", "failed", "released"]
    output: Union[str, None]
    createdAt: str
    settledAt: Optional[str]

class MeshCallsQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    direction: Optional[Literal["outgoing", "incoming"]] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None

class MeshDiscoverHit(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    agentName: str
    description: Union[str, None]
    specialties: List[str]
    grantId: str
    rateCredits: str
    rateUnit: Literal["per_call", "per_1k_tokens"]
    quotaCalls: Optional[int]
    quotaWindow: Optional[Literal["minute", "hour", "day"]]
    minTrustScore: Union[str, None]
    trustScore: Union[float, None]
    successRate: Union[float, None]
    totalRuns: int
    confidence: str
    rankScore: float

class MeshDiscoverQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    q: Optional[str] = None
    minTrustScore: Optional[float] = None
    minSuccessRate: Optional[float] = None
    minTotalRuns: Optional[int] = None
    maxRateCredits: Optional[float] = None
    limit: Optional[int] = None

class MeshGrantView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    grantorAgent: str
    granteeScope: Literal["agent", "org", "public"]
    granteeAgent: Union[str, None]
    granteeOrg: Union[str, None]
    allowed: bool
    rateCredits: str
    rateUnit: Literal["per_call", "per_1k_tokens"]
    quotaCalls: Optional[int]
    quotaWindow: Optional[Literal["minute", "hour", "day"]]
    minTrustScore: Union[str, None]
    createdAt: str

class MeshHopView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    callId: str
    callerAgentId: str
    calleeAgentId: str
    depth: int
    costCredits: Union[str, None]
    status: str
    createdAt: str

class MeshTraceView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rootRunId: str
    totalCredits: str
    hops: List[Dict[str, Any]]

class ModelInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    id: str
    label: str
    contextWindow: int
    maxOutputTokens: int
    source: Optional[Literal["registry", "live"]] = None
    usableForGeneration: Optional[bool] = None
    limits: Optional[Dict[str, Any]] = None

class ModelLimitTier(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tier: str
    requestsPerMinute: Union[float, None]
    tokensPerMinute: Union[float, None]
    requestsPerDay: Union[float, None]

class ModelLimits(BaseModel):
    model_config = ConfigDict(extra="ignore")

    approximate: Literal[True]
    source: str
    tiers: List[Dict[str, Any]]
    note: Optional[str] = None

class OkResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ok: bool

class OpenPrInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str
    body: Optional[str] = None
    runDiffId: Optional[str] = None

class OperatedWindow(BaseModel):
    model_config = ConfigDict(extra="ignore")

    firstRunAt: Optional[str]
    lastRunAt: Optional[str]
    distinctDays: int

class OperatorProof(BaseModel):
    model_config = ConfigDict(extra="ignore")

    eligible: bool
    runsObserved: int
    operatedWindow: Dict[str, Any]
    operatorSuccessRate: float
    evidenceRunIds: List[str]

class OrgChartEdge(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fromAgentId: str
    to: Dict[str, Any]

class OrgChartNode(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    roleId: Union[str, None]
    roleName: Union[str, None]
    status: Optional[Literal["active", "paused", "off_shift"]]
    trustScore: Union[float, None]

class OrgChartView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class OtelAttribute(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: str
    value: Dict[str, Any]

class OtelSpan(BaseModel):
    model_config = ConfigDict(extra="ignore")

    traceId: str
    spanId: str
    parentSpanId: Optional[str] = None
    name: str
    kind: int
    startTimeUnixNano: str
    endTimeUnixNano: str
    status: Dict[str, Any]
    attributes: List[Dict[str, Any]]

class OtelTraceExport(BaseModel):
    model_config = ConfigDict(extra="ignore")

    resourceSpans: List[Dict[str, Any]]

class OverviewStats(BaseModel):
    """Approximate mirror of the frontend OverviewStats DTO."""
    model_config = ConfigDict(extra="ignore")

    totalAgents: int
    totalRuns: int
    successRate: Optional[float]
    totalConnectors: int

class PayoutAccountResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    account: Optional[PayoutAccountView]

class PayoutAccountView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    stripeConnectId: str
    kycStatus: Literal["pending", "verified", "restricted"]
    payoutsEnabled: bool
    onboardingUrl: Optional[str] = None

class PayoutView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    credits: str
    amountFiatCents: int
    status: Literal["requested", "held", "paid", "failed", "reversed"]
    holdReason: Union[str, None]
    stripeTransferId: Union[str, None]
    createdAt: str

class PerformanceReview(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    window: str
    reputation: Dict[str, Any]
    reliability: Dict[str, Any]
    cost: Dict[str, Any]
    escalations: Dict[str, Any]
    handoffs: Dict[str, Any]
    drilldown: Dict[str, Any]

class PlanSubscribeInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    plan: Optional[Literal["team", "scale"]] = None

class PlaygroundRunInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    prompt: str

class PoliciesQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: Optional[Literal["quoted", "bound", "active", "lapsed", "cancelled", "expired"]] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None

class PolicyQuoteView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    riskScoreId: str
    insurable: bool
    reason: Union[str, None]
    agentId: str
    agentVersion: Union[str, None]
    coverageCapCredits: str
    premiumCredits: str
    term: str
    riskScore: Dict[str, Any]
    slaTerms: List[Dict[str, Any]]

class PolicyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentVersion: Union[str, None]
    builderOrgId: Union[str, None]
    status: Literal["quoted", "bound", "active", "lapsed", "cancelled", "expired"]
    coverageCapCredits: str
    premiumCredits: str
    premiumLedgerTxId: Union[str, None]
    reserveEscrowAccountId: Union[str, None]
    carrierRef: Union[str, None]
    riskScore: Dict[str, Any]
    slaTerms: List[Dict[str, Any]]
    termStart: str
    termEnd: str
    createdAt: str

class PostBountyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str
    spec: str
    category: str
    tags: Optional[List[str]] = None
    budgetCredits: float
    evalRubric: Dict[str, Any]
    evalDatasetId: Optional[str] = None
    minScore: Optional[int] = None
    maxSubmissionsPerOrg: Optional[int] = None
    tieBreak: Optional[Literal["earliest_submit", "lowest_cost", "highest_confidence"]] = None
    deadline: str
    visibility: Optional[Literal["public", "private"]] = None

class PrDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    branchId: str
    baseAgentId: str
    title: str
    body: str
    configDiff: Dict[str, Any]
    runDiffId: Union[str, None]
    status: Literal["open", "approved", "changes_requested", "merged", "closed"]
    mergedVersionId: Union[str, None]
    openedBy: str
    createdAt: str
    updatedAt: str
    mergedAt: Optional[str]
    runDiff: Optional[Dict[str, Any]]
    reviews: List[Dict[str, Any]]
    comments: List[Dict[str, Any]]

class PrReviewView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    prId: str
    reviewerId: str
    verdict: Literal["approve", "request_changes", "comment"]
    body: str
    createdAt: str

class PrView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    branchId: str
    baseAgentId: str
    title: str
    body: str
    configDiff: Dict[str, Any]
    runDiffId: Union[str, None]
    status: Literal["open", "approved", "changes_requested", "merged", "closed"]
    mergedVersionId: Union[str, None]
    openedBy: str
    createdAt: str
    updatedAt: str
    mergedAt: Optional[str]

class ProjectView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    description: str
    agentCount: int
    createdAt: str

class PromoteVersionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    promoted: str
    channels: List[Dict[str, Any]]

class ProofBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    totalRuns: int
    successRate: Union[float, None]
    errorRate: Union[float, None]
    p50LatencyMs: Optional[int]
    p95LatencyMs: Optional[int]
    trustScore: Union[float, None]
    confidence: str
    lastRunAt: Union[str, None]
    replayableSampleRunId: Union[str, None]

class ProviderKeyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    provider: Literal["anthropic", "openai", "google", "ollama"]
    label: Union[str, None]
    maskedHint: str
    status: Literal["valid", "invalid", "unchecked"]
    lastValidatedAt: Optional[str]
    createdAt: str

class PublicRunResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    run: Dict[str, Any]
    redactions: int
    agent: Dict[str, Any]

class PublishVersionInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    semver: str
    changelog: Optional[str] = None

class PurchaseResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    purchaseId: str
    grossCredits: str
    builderCredits: str
    takeRateCredits: str
    ledgerTxnId: Union[str, None]
    install: Dict[str, Any]

class QuotePolicyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    agentVersion: Optional[str] = None
    slaTerms: List[Dict[str, Any]]
    coverageCapCredits: float
    term: Optional[str] = None

class RateAgentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rating: int

class RateAgentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reputation: ReputationView
    myRating: float

class RbacBindingView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    roleId: str
    principalType: Literal["user", "scim_group"]
    principalId: str
    scopeType: Literal["org", "project"]
    scopeId: Union[str, None]
    grantedBy: Union[str, None]
    createdAt: str

class RbacRoleView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    orgId: Union[str, None]
    name: str
    permissions: List[Literal["agent:publish", "agent:run", "agent:read", "marketplace:list", "audit:read", "billing:read", "rbac:manage", "sso:manage", "scim:manage", "org:admin"]]
    isSystem: bool
    createdAt: str

class RealtimeRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")

    roomId: str
    enabled: bool
    wsUrl: Union[str, None]
    token: Union[str, None]

class RecentExecution(BaseModel):
    """Approximate mirror of the frontend RecentExecution DTO."""
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentName: str
    status: ExecutionStatus
    latencyMs: int
    createdAt: str

class ReportTarget(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: Literal["agent", "human"]
    id: str

class ReputationBreakdown(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reliability: Union[float, None]
    satisfaction: Union[float, None]
    speed: Union[float, None]
    retryDiscipline: Optional[Union[float, None]] = None
    regression: Optional[Union[float, None]] = None
    costEfficiency: Optional[Union[float, None]] = None
    counterparty: Optional[Union[float, None]] = None
    weights: Dict[str, Any]

class ReputationView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    successCount: int
    failureCount: int
    totalRuns: int
    successRate: Union[float, None]
    avgLatencyMs: int
    avgRating: Union[float, None]
    ratingCount: int
    trustScore: Union[float, None]
    confidence: Literal["none", "low", "medium", "high"]
    breakdown: Dict[str, Any]

class RerunInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    executionId: str
    agentId: Optional[str] = None
    prompt: Optional[str] = None

class ResolveEscalationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    decision: Literal["approve", "edit", "reject", "abort"]
    editedPayload: Optional[Dict[str, Any]] = None
    comment: Optional[str] = None

class ReviewEligibilityView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    eligible: bool
    runsObserved: int
    operatedWindow: Dict[str, Any]
    operatorSuccessRate: float
    need: Union[str, None]

class ReviewWindowQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    window: Optional[str] = None

class RevokeCertificationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reason: str

class RiskScoreInputs(BaseModel):
    model_config = ConfigDict(extra="ignore")

    repTrust: Union[float, None]
    repConfidence: Literal["none", "low", "medium", "high"]
    successRate: Union[float, None]
    latencyP50Ms: Union[float, None]
    latencyP95Ms: Union[float, None]
    latencyP99Ms: Union[float, None]
    evalPercentile: Union[float, None]
    regressionStability: Union[float, None]
    runVolume: int
    windowDays: int

class RiskScoreView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentVersion: Union[str, None]
    riskScore: float
    premiumRate: float
    insurable: bool
    reason: Optional[Union[str, None]] = None
    inputs: Dict[str, Any]
    modelVersion: str
    computedAt: str

class RoleView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    description: str
    defaultReportTo: Optional[Dict[str, Any]]
    escalationPolicy: Dict[str, Any]
    requiredMinTrust: Union[str, None]
    requiredConfidence: Optional[Literal["low", "medium", "high"]]
    createdAt: str
    updatedAt: str

class RoutingCandidate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    id: str
    score: float
    obsCostCredits: Union[float, None]
    p50LatencyMs: Optional[int]
    successRate: Union[float, None]
    evalPassRate: Union[float, None]
    eligible: bool
    reason: str
    lowConfidence: Optional[bool] = None

class RoutingDecisionView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    executionId: Union[str, None]
    policyId: Union[str, None]
    objective: Literal["min_cost", "min_latency", "max_quality", "balanced"]
    chosenProvider: str
    chosenModel: str
    candidates: List[Dict[str, Any]]
    suiteRunId: Union[str, None]
    failoverFrom: Optional[Dict[str, Any]]
    reason: str
    createdAt: str

class RoutingDecisionsQuery(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: Optional[str] = None
    objective: Optional[Literal["min_cost", "min_latency", "max_quality", "balanced"]] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None

class RoutingFailover(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    id: str
    error: str

class RoutingModelRef(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    id: str

class RoutingPolicyView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    enabled: bool
    objective: Literal["min_cost", "min_latency", "max_quality", "balanced"]
    allowedProviders: List[Literal["anthropic", "openai", "google", "ollama"]]
    allowedModels: Optional[List[Dict[str, Any]]]
    fallbackChain: List[Dict[str, Any]]
    mustPassSuiteId: Union[str, None]
    minPassRate: int
    respectRateLimits: bool
    maxCostPerRunCredits: Optional[int]
    weights: Optional[Dict[str, Any]]
    createdAt: str
    updatedAt: str

class RoutingPreview(BaseModel):
    model_config = ConfigDict(extra="ignore")

    objective: Literal["min_cost", "min_latency", "max_quality", "balanced"]
    chosen: Optional[Dict[str, Any]]
    fallbackChain: List[Dict[str, Any]]
    candidates: List[Dict[str, Any]]

class RoutingWeights(BaseModel):
    model_config = ConfigDict(extra="ignore")

    cost: float
    latency: float
    quality: float

class RunDiffResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    steps: List[Dict[str, Any]]
    outputDiff: str
    rollups: Dict[str, Any]
    regressions: Optional[List[str]] = None
    lowConfidenceAlignment: Optional[bool] = None

class RunDiffRollups(BaseModel):
    model_config = ConfigDict(extra="ignore")

    costDelta: float
    latencyDeltaMs: float
    tokenDelta: float
    steps: Dict[str, Any]

class RunDiffView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: Union[str, None]
    runAId: str
    runBId: str
    result: Dict[str, Any]
    visibility: Literal["private", "public"]
    createdAt: Optional[str]

class RunDiffVisibilityInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    visibility: Literal["private", "public"]

class SaveKeyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: ProviderKeyView
    validation: KeyValidationResult

class SaveProviderKeyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Literal["anthropic", "openai", "google", "ollama"]
    apiKey: str
    label: Optional[str] = None

class ScanFinding(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ruleId: str
    span: Optional[List[Any]] = None
    label: str
    confidence: float
    traceStepIdx: Optional[int] = None

class ScanResultView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    runId: str
    scanType: Literal["injection", "exfiltration", "pii"]
    verdict: Literal["allow", "flag", "block"]
    severity: Literal["none", "low", "medium", "high", "critical"]
    findings: List[Dict[str, Any]]
    detectorVer: str
    createdAt: str

class ScimUserView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    userId: Union[str, None]
    externalId: str
    email: str
    scimGroups: List[str]
    active: bool
    createdAt: str

class ScimWebhookEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    event: str
    data: Dict[str, Any]

class SetRunVisibilityInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    visibility: Literal["private", "public"]

class Shift(BaseModel):
    model_config = ConfigDict(extra="ignore")

    day: str
    start: str
    end: str
    tz: Optional[str] = None

class SlaStanding(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    metric: Literal["success_rate", "latency_p50_ms", "latency_p95_ms", "uptime"]
    comparator: Literal["gte", "lte"]
    threshold: str
    measurementWindow: str
    minSample: int
    payoutCredits: str
    errorBudget: Union[str, None]
    observed: Union[float, None]
    status: Literal["on_track", "at_risk", "breached", "insufficient_sample"]

class SlaTermInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    metric: Literal["success_rate", "latency_p50_ms", "latency_p95_ms", "uptime"]
    comparator: Literal["gte", "lte"]
    threshold: float
    window: Optional[str] = None
    minSample: Optional[int] = None
    payoutCredits: float
    errorBudget: Optional[float] = None

class SlaTermView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    metric: Literal["success_rate", "latency_p50_ms", "latency_p95_ms", "uptime"]
    comparator: Literal["gte", "lte"]
    threshold: str
    measurementWindow: str
    minSample: int
    payoutCredits: str
    errorBudget: Union[str, None]

class SpendingRow(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: str
    label: str
    costCredits: str
    runs: int

class SpendingSummaryQuery(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None
    groupBy: Optional[Literal["agent", "project", "model", "provider"]] = None

class SpendingTrendPoint(BaseModel):
    model_config = ConfigDict(extra="ignore")

    ts: str
    costCredits: str
    runs: int

class SpendingTrendQuery(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None
    bucket: Optional[Literal["1h", "1d"]] = None

class SsoConnectionView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    provider: Literal["okta", "azure-ad", "google", "generic-saml", "oidc"]
    workosConnId: Union[str, None]
    domain: str
    status: Literal["pending", "active", "inactive"]
    setupUrl: Optional[Union[str, None]] = None
    createdAt: str

class SubmissionView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    bountyId: str
    agentId: str
    agentVersion: str
    benchmarkRunId: Union[str, None]
    score: Union[float, None]
    passed: Union[bool, None]
    p50LatencyMs: Optional[int]
    costCredits: Union[str, None]
    runCount: int
    status: Literal["queued", "scoring", "scored", "error", "disqualified"]
    disqualifiedReason: Union[str, None]
    rank: Optional[int] = None
    results: Optional[List[Dict[str, Any]]] = None
    createdAt: str
    scoredAt: Optional[str]

class SubmitBenchmarkInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    agentVersion: str

class SubmitBountyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agentId: str
    agentVersion: str

class SuiteCaseResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    caseId: str
    prompt: str
    status: Literal["success", "error"]
    baselineStatus: Literal["success", "error"]
    similarity: int
    passed: bool
    reason: str
    executionId: str

class SuiteCaseView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    prompt: str
    baselineOutput: str
    baselineStatus: Literal["success", "error"]
    createdAt: str

class SuiteDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    name: str
    description: str
    similarityThreshold: int
    webhookToken: str
    caseCount: int
    lastRun: Optional[Dict[str, Any]]
    createdAt: str
    cases: List[Dict[str, Any]]
    runs: List[Dict[str, Any]]

class SuiteRunView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    status: Literal["pass", "fail"]
    total: int
    passed: int
    failed: int
    triggeredBy: str
    results: List[Dict[str, Any]]
    createdAt: str

class SuiteView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    name: str
    description: str
    similarityThreshold: int
    webhookToken: str
    caseCount: int
    lastRun: Optional[Dict[str, Any]]
    createdAt: str

class TemplateCard(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    displayName: str
    vertical: str
    description: str
    requiredConnectors: List[str]
    deployCount: int
    createdAt: str

class TemplateDetail(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    slug: str
    displayName: str
    vertical: str
    description: str
    requiredConnectors: List[str]
    deployCount: int
    createdAt: str
    config: Dict[str, Any]
    params: List[Dict[str, Any]]
    visibility: Literal["private", "public"]

class TemplateParam(BaseModel):
    model_config = ConfigDict(extra="ignore")

    key: str
    label: str
    description: Optional[str] = None
    required: Optional[bool] = None
    default: Optional[str] = None

class TemplateSearchInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    vertical: Optional[str] = None
    connector: Optional[str] = None
    sort: Optional[Literal["deploys", "recent"]] = None
    limit: Optional[int] = None

class TraceStep(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: Literal["model", "tool", "agent"]
    name: str
    status: Literal["ok", "error"]
    startMs: int
    durationMs: int
    inputTokens: Optional[int] = None
    outputTokens: Optional[int] = None
    detail: Optional[str] = None
    error: Optional[str] = None
    reasoning: Optional[str] = None

class TryListingInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    input: str

class TryListingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    runId: str
    status: str
    shareUrl: str

class UpdateAgentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    description: Optional[str] = None
    avatarUrl: Optional[str] = None
    specialties: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None
    connectorIds: Optional[List[str]] = None
    agentToolIds: Optional[List[str]] = None
    projectId: Optional[str] = None

class UpdateAlertRuleInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    metric: Optional[Literal["p95_latency_ms", "error_rate", "cost_credits", "drift", "throughput"]] = None
    agentId: Optional[str] = None
    condition: Optional[Literal["gt", "lt", "change_pct"]] = None
    threshold: Optional[float] = None
    windowSeconds: Optional[int] = None
    target: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None

class UpdateBranchInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    connectorIds: Optional[List[str]] = None
    agentToolIds: Optional[List[str]] = None

class UpdateBudgetInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    periodType: Optional[Literal["daily", "weekly", "monthly", "rolling_30d", "custom"]] = None
    limitCredits: Optional[float] = None
    enforcement: Optional[Literal["off", "alert", "block"]] = None
    alertThresholdPct: Optional[int] = None
    periodStartAt: Optional[str] = None
    periodEndAt: Optional[str] = None

class UpdateMemberInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: Literal["owner", "admin", "member"]

class UpsertRoutingPolicyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: Optional[bool] = None
    objective: Optional[Literal["min_cost", "min_latency", "max_quality", "balanced"]] = None
    allowedProviders: Optional[List[Literal["anthropic", "openai", "google", "ollama"]]] = None
    allowedModels: Optional[List[Dict[str, Any]]] = None
    fallbackChain: Optional[List[Dict[str, Any]]] = None
    mustPassSuiteId: Optional[str] = None
    minPassRate: Optional[int] = None
    respectRateLimits: Optional[bool] = None
    maxCostPerRunCredits: Optional[int] = None
    weights: Optional[Dict[str, Any]] = None

class ValidateKeyInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: Provider
    apiKey: str

class VerifiedReviewView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    agentId: str
    agentVersion: Union[str, None]
    userId: str
    rating: int
    body: str
    verifiedOperator: bool
    runsObserved: int
    operatedWindow: Optional[Dict[str, Any]]
    operatorSuccessRate: Union[str, None]
    evidenceRunIds: List[str]
    status: Literal["active", "edited", "removed"]
    createdAt: str
    updatedAt: str

class VerifyVersionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    valid: bool
    digest: str
    recomputedDigest: str

class VersionRunAggregate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    totalRuns: int
    successRate: Union[float, None]
    errorRate: Union[float, None]
    p50LatencyMs: Optional[int]
    p95LatencyMs: Optional[int]
    lastRunAt: Union[str, None]

class WalletView(BaseModel):
    model_config = ConfigDict(extra="ignore")

    walletId: str
    balanceCredits: str
    pendingEarningsCredits: str
    creditValueUsd: float
    recent: List[Dict[str, Any]]

class WorkforceSchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")

    shifts: Optional[List[Dict[str, Any]]] = None
    onCall: Optional[bool] = None

class WriteReviewInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rating: int
    body: Optional[str] = None
    agentVersion: Optional[str] = None

# Resolve forward references across all generated models.
for _m in list(globals().values()):
    if isinstance(_m, type) and issubclass(_m, BaseModel) and _m is not BaseModel:
        _m.model_rebuild()

__all__ = [
    "AddSuiteCaseInput",
    "AgentLineage",
    "AgentModelConfig",
    "AgentVersionView",
    "AgentView",
    "AgentVisibility",
    "AlertEventView",
    "AlertRuleView",
    "AlertTarget",
    "AlignedStep",
    "ApiKeyScope",
    "ApiKeyView",
    "ApplyCertificationInput",
    "AssignmentView",
    "AttachGuardrailInput",
    "AuditChainVerify",
    "AuditEntryView",
    "AuditLogQuery",
    "AuditTarget",
    "AvailableIntegration",
    "AvailableIntegrations",
    "AwardBountyInput",
    "BenchmarkCaseResult",
    "BenchmarkDetail",
    "BenchmarkRunSummary",
    "BenchmarkRunView",
    "BenchmarkScoringConfig",
    "BenchmarkView",
    "BillingView",
    "BindIdentityInput",
    "BindIdentityResponse",
    "BindPolicyInput",
    "BountiesQuery",
    "BountyAwardView",
    "BountyLeaderboardRow",
    "BountyView",
    "BranchDetail",
    "BranchRerunInput",
    "BranchView",
    "BudgetStatusView",
    "BudgetView",
    "BudgetsQuery",
    "BuyCreditsInput",
    "BuyCreditsResult",
    "CertAuditView",
    "CertVerifyView",
    "CertificationDetail",
    "CertificationView",
    "ClaimAdjudication",
    "ClaimView",
    "ClaimsQuery",
    "CommentView",
    "ComplianceBundle",
    "ComplianceExportQuery",
    "Confidence",
    "ConfigDiff",
    "ConfirmConnectorInput",
    "ConnectorSessionResponse",
    "ConnectorStatus",
    "ConnectorView",
    "CreateAgentInput",
    "CreateAlertRuleInput",
    "CreateApiKeyInput",
    "CreateApiKeyResult",
    "CreateAssignmentInput",
    "CreateBenchmarkInput",
    "CreateBranchInput",
    "CreateBudgetInput",
    "CreateCommentInput",
    "CreateConnectorInput",
    "CreateEvalDatasetInput",
    "CreateGuardrailPolicyInput",
    "CreateListingInput",
    "CreateMeshGrantInput",
    "CreatePayoutInput",
    "CreatePrReviewInput",
    "CreateProjectInput",
    "CreateRbacBindingInput",
    "CreateRbacRoleInput",
    "CreateRoleInput",
    "CreateRunDiffInput",
    "CreateSsoConnectionInput",
    "CreateSuiteInput",
    "CreateTemplateInput",
    "DeployTemplateInput",
    "DeploymentInfoView",
    "DriftFlag",
    "DriftObservation",
    "EnforceInput",
    "EnforceResult",
    "EscalationPolicy",
    "EscalationRoute",
    "EscalationTriggerRule",
    "EscalationView",
    "EscalationsQuery",
    "EvalDatasetView",
    "EvalRubric",
    "EvalRubricEnvelope",
    "EvalRubricGate",
    "ExecutionStatus",
    "ExecutionView",
    "FileClaimInput",
    "FleetAgentRow",
    "FleetCostQuery",
    "FleetCostRow",
    "FleetMetricPoint",
    "FleetMetricsQuery",
    "FleetSeries",
    "GetAgentResponse",
    "GuardrailAttachmentView",
    "GuardrailPolicyView",
    "GuardrailRules",
    "HitlReviewView",
    "InstallView",
    "InviteMemberInput",
    "KeyValidationResult",
    "LeaderboardEntryView",
    "LedgerEntryView",
    "LedgerPage",
    "LineageNode",
    "ListMembersResponse",
    "ListingCard",
    "ListingPricingInput",
    "ListingPricingView",
    "LiveModelsResponse",
    "MarketplaceSearchInput",
    "MemberRole",
    "MemberView",
    "MeshCallInput",
    "MeshCallView",
    "MeshCallsQuery",
    "MeshDiscoverHit",
    "MeshDiscoverQuery",
    "MeshGrantView",
    "MeshHopView",
    "MeshTraceView",
    "ModelInfo",
    "ModelLimitTier",
    "ModelLimits",
    "OkResponse",
    "OpenPrInput",
    "OperatedWindow",
    "OperatorProof",
    "OrgChartEdge",
    "OrgChartNode",
    "OrgChartView",
    "OtelAttribute",
    "OtelSpan",
    "OtelTraceExport",
    "OverviewStats",
    "PayoutAccountResponse",
    "PayoutAccountView",
    "PayoutView",
    "PerformanceReview",
    "Plan",
    "PlanSubscribeInput",
    "PlaygroundRunInput",
    "PoliciesQuery",
    "PolicyQuoteView",
    "PolicyView",
    "PostBountyInput",
    "PrDetail",
    "PrReviewView",
    "PrView",
    "ProjectView",
    "PromoteVersionResponse",
    "ProofBlock",
    "Provider",
    "ProviderKeyStatus",
    "ProviderKeyView",
    "PublicRunResponse",
    "PublishVersionInput",
    "PurchaseResult",
    "QuotePolicyInput",
    "RateAgentInput",
    "RateAgentResponse",
    "RbacBindingView",
    "RbacRoleView",
    "RealtimeRoom",
    "RecentExecution",
    "ReportTarget",
    "ReputationBreakdown",
    "ReputationView",
    "RerunInput",
    "ResolveEscalationInput",
    "ReviewEligibilityView",
    "ReviewWindowQuery",
    "RevokeCertificationInput",
    "RiskScoreInputs",
    "RiskScoreView",
    "RoleView",
    "RoutingCandidate",
    "RoutingDecisionView",
    "RoutingDecisionsQuery",
    "RoutingFailover",
    "RoutingModelRef",
    "RoutingPolicyView",
    "RoutingPreview",
    "RoutingWeights",
    "RunDiffResult",
    "RunDiffRollups",
    "RunDiffView",
    "RunDiffVisibilityInput",
    "RunVisibility",
    "SaveKeyResponse",
    "SaveProviderKeyInput",
    "ScanFinding",
    "ScanResultView",
    "ScimUserView",
    "ScimWebhookEvent",
    "SetRunVisibilityInput",
    "Shift",
    "SlaStanding",
    "SlaTermInput",
    "SlaTermView",
    "SpendingRow",
    "SpendingSummaryQuery",
    "SpendingTrendPoint",
    "SpendingTrendQuery",
    "SsoConnectionView",
    "SubmissionView",
    "SubmitBenchmarkInput",
    "SubmitBountyInput",
    "SuiteCaseResult",
    "SuiteCaseView",
    "SuiteDetail",
    "SuiteRunView",
    "SuiteView",
    "TemplateCard",
    "TemplateDetail",
    "TemplateParam",
    "TemplateSearchInput",
    "TraceStep",
    "TryListingInput",
    "TryListingResponse",
    "UpdateAgentInput",
    "UpdateAlertRuleInput",
    "UpdateBranchInput",
    "UpdateBudgetInput",
    "UpdateMemberInput",
    "UpsertRoutingPolicyInput",
    "ValidateKeyInput",
    "VerifiedReviewView",
    "VerifyVersionResponse",
    "VersionRunAggregate",
    "WalletView",
    "WorkforceSchedule",
    "WriteReviewInput",
]
