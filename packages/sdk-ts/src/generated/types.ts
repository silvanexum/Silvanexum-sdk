/**
 * GENERATED — DO NOT EDIT BY HAND.
 *
 * Emitted from the backend's src/shared/* Zod contracts by packages/codegen.
 * Regenerate with `pnpm generate`. Editing this file will be overwritten and
 * will fail `pnpm generate:check` in CI.
 */
/* eslint-disable */

export interface AddSuiteCaseInput {
  fromExecutionId?: string;
  prompt?: string;
}

export interface AgentLineage {
  currentId: string;
  nodes: Array<{
  id: string;
  name: string;
  visible: boolean;
  trustScore: number | null;
  isCurrent: boolean;
}>;
  edges: Array<{
  parentId: string;
  childId: string;
}>;
}

export interface AgentModelConfig {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export interface AgentVersionView {
  id: string;
  agentId: string;
  semver: string;
  digest: string;
  signature: string;
  changelog: string;
  createdAt: string;
  channels: Array<string>;
  runs: {
  totalRuns: number;
  successRate: number | null;
  errorRate: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  lastRunAt: string | null;
};
}

export interface AgentView {
  id: string;
  ownerId: string;
  orgId: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  specialties: Array<string>;
  config: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds: Array<string>;
  agentToolIds: Array<string>;
  visibility: "private" | "public";
  forkedFromId: string | null;
  projectId: string | null;
  agentCardUrl: string | null;
  externalName: string | null;
  createdAt: string;
  updatedAt: string;
  reputation?: {
  successCount: number;
  failureCount: number;
  totalRuns: number;
  successRate: number | null;
  avgLatencyMs: number;
  avgRating: number | null;
  ratingCount: number;
  trustScore: number | null;
  confidence: "none" | "low" | "medium" | "high";
  breakdown: {
  reliability: number | null;
  satisfaction: number | null;
  speed: number | null;
  retryDiscipline?: number | null;
  regression?: number | null;
  costEfficiency?: number | null;
  counterparty?: number | null;
  weights: {
  reliability: number;
  satisfaction: number;
  speed: number;
  retryDiscipline?: number;
  regression?: number;
  costEfficiency?: number;
  counterparty?: number;
};
};
};
}

export type AgentVisibility = "private" | "public";

export interface AlertEventView {
  id: string;
  ruleId: string;
  agentId: string | null;
  firedAt: string;
  value: string | null;
  baseline: string | null;
  driftKind: "alias" | "shift" | null;
  delivered: boolean;
  deliveryAttempts: number;
  resolvedAt: string | null;
}

export interface AlertRuleView {
  id: string;
  name: string;
  metric: "p95_latency_ms" | "error_rate" | "cost_credits" | "drift" | "throughput";
  agentId: string | null;
  condition: "gt" | "lt" | "change_pct";
  threshold: string;
  windowSeconds: number;
  target: {
  webhook?: string;
  email?: string;
  slack?: string;
};
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertTarget {
  webhook?: string;
  email?: string;
  slack?: string;
}

export interface AlignedStep {
  op: "unchanged" | "changed" | "added" | "removed";
  stepA: { [key: string]: unknown } | null;
  stepB: { [key: string]: unknown } | null;
  latencyDeltaMs: number | null;
  tokenDelta: number | null;
  statusDelta: string | null;
}

export type ApiKeyScope = "read" | "run" | "manage" | "pay";

export interface ApiKeyView {
  id: string;
  name: string;
  maskedHint: string;
  scopes: Array<"read" | "run" | "manage" | "pay">;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface ApplyCertificationInput {
  agentId: string;
  agentVersion: string;
  seal: "capability_verified" | "security_audited" | "enterprise_ready";
  category?: string;
}

export interface AssignmentView {
  id: string;
  agentId: string;
  roleId: string;
  projectId: string | null;
  reportTo: {
  kind: "agent" | "human";
  id: string;
} | null;
  schedule: {
  shifts?: Array<{
  day: string;
  start: string;
  end: string;
  tz?: string;
}>;
  onCall?: boolean;
} | null;
  status: "active" | "paused" | "off_shift";
  createdAt: string;
  updatedAt: string;
}

export interface AttachGuardrailInput {
  policyId: string;
}

export interface AuditChainVerify {
  intact: boolean;
  length: number;
  firstBrokenSeq: number | null;
}

export interface AuditEntryView {
  id: string;
  seq: number;
  actorType: "user" | "agent" | "system" | "service";
  actorId: string | null;
  action: string;
  runId: string | null;
  target: {
  table?: string;
  id?: string;
  [key: string]: unknown;
} | null;
  metadata: { [key: string]: unknown };
  prevHash: string;
  entryHash: string;
  createdAt: string;
}

export interface AuditLogQuery {
  agentId?: string;
  runId?: string;
  action?: string;
  from?: string;
  to?: string;
  verify?: boolean;
  limit?: number;
  cursor?: string;
}

export interface AuditTarget {
  table?: string;
  id?: string;
  [key: string]: unknown;
}

export interface AvailableIntegration {
  providerConfigKey: string;
  displayName: string;
  logo?: string | null;
}

export interface AvailableIntegrations {
  integrations: Array<AvailableIntegration>;
}

export interface AwardBountyInput {
  autoList?: boolean;
}

export interface BenchmarkCaseResult {
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
  score?: number;
}

export interface BenchmarkDetail {
  id: string;
  datasetId: string;
  name: string;
  category: string;
  passThreshold: number;
  scoringConfig: {
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
};
  visibility: "private" | "public";
  createdAt: string;
  runs: Array<{
  id: string;
  agentId: string;
  agentVersion: string;
  status: "queued" | "running" | "pass" | "fail" | "error";
  score: number | null;
  total: number;
  passed: number;
  failed: number;
  createdAt: string;
  completedAt: string | null;
}>;
}

export interface BenchmarkRunSummary {
  id: string;
  agentId: string;
  agentVersion: string;
  status: "queued" | "running" | "pass" | "fail" | "error";
  score: number | null;
  total: number;
  passed: number;
  failed: number;
  createdAt: string;
  completedAt: string | null;
}

export interface BenchmarkRunView {
  id: string;
  benchmarkId: string;
  agentId: string;
  agentVersion: string;
  status: "queued" | "running" | "pass" | "fail" | "error";
  score: number | null;
  total: number;
  passed: number;
  failed: number;
  p50LatencyMs: number | null;
  costCredits: string | null;
  sandboxId: string | null;
  results: Array<{
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
  score?: number;
}>;
  createdAt: string;
  completedAt: string | null;
}

export interface BenchmarkScoringConfig {
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
}

export interface BenchmarkView {
  id: string;
  datasetId: string;
  name: string;
  category: string;
  passThreshold: number;
  scoringConfig: {
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
};
  visibility: "private" | "public";
  createdAt: string;
}

export interface BillingView {
  plan: "free" | "team" | "scale" | "enterprise";
  subscriptionActive: boolean;
  seats: number;
  currentPeriodEnd: string | null;
  complimentary: {
  plan: "free" | "team" | "scale" | "enterprise";
  expiresAt: string;
} | null;
  entitlements: {
  blockBudgets: boolean;
  meshDelegation: boolean;
  spendExports: boolean;
  maxPrivateAgents: number;
  enterpriseControls: boolean;
  maxConnectors: number;
  historyDays: number;
  governedSpendUsdMonthly: number;
};
}

export interface BindIdentityInput {
  agentCardUrl: string;
}

export interface BindIdentityResponse {
  agent: AgentView;
  ingested: {
  name: string;
  url: string;
};
}

export interface BindPolicyInput {
  riskScoreId: string;
  agentId: string;
  agentVersion?: string;
  slaTerms: Array<{
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: number;
  window?: string;
  minSample?: number;
  payoutCredits: number;
  errorBudget?: number;
}>;
  coverageCapCredits: number;
  premiumCredits: number;
  term?: string;
}

export interface BountiesQuery {
  category?: string;
  status?: "draft" | "open" | "judging" | "awarded" | "refunded" | "expired";
  sort?: "budget" | "deadline" | "recent";
  limit?: number;
  cursor?: string;
}

export interface BountyAwardView {
  id: string;
  bountyId: string;
  outcome: "awarded" | "refunded" | "expired_no_submissions";
  winningSubmissionId: string | null;
  winningScore: number | null;
  runnerUpScore: number | null;
  awardCredits: string | null;
  platformFeeCredits: string | null;
  settlementTxnId: string | null;
  listingId: string | null;
  awardedAt: string;
}

export interface BountyLeaderboardRow {
  rank: number;
  submissionId: string;
  agentId: string;
  agentVersion: string;
  score: number | null;
  passed: boolean | null;
  status: "queued" | "scoring" | "scored" | "error" | "disqualified";
}

export interface BountyView {
  id: string;
  requesterUserId: string;
  title: string;
  spec: string;
  category: string;
  tags: Array<string>;
  budgetCredits: string;
  escrowTxnId: string | null;
  evalRubric: {
  datasetRef?: string;
  passThreshold?: number;
  aggregate?: "mean_case_score" | "pass_rate";
  scorers: Array<{
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
  weight?: number;
}>;
  gates?: Array<{
  metric: "p95_latency_ms" | "p50_latency_ms" | "error_rate";
  max: number;
}>;
  tieBreak?: "earliest_submit" | "lowest_cost" | "highest_confidence";
};
  evalDatasetId: string | null;
  minScore: number | null;
  maxSubmissionsPerOrg: number;
  tieBreak: "earliest_submit" | "lowest_cost" | "highest_confidence";
  status: "draft" | "open" | "judging" | "awarded" | "refunded" | "expired";
  deadline: string;
  visibility: "public" | "private";
  submissionCount?: number;
  createdAt: string;
}

export interface BranchDetail {
  id: string;
  baseAgentId: string;
  baseVersionId: string | null;
  name: string;
  config: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds: Array<string>;
  agentToolIds: Array<string>;
  originRunId: string | null;
  status: "open" | "merged" | "closed";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  room: {
  roomId: string;
  enabled: boolean;
  wsUrl: string | null;
  token: string | null;
};
}

export interface BranchRerunInput {
  input?: string;
}

export interface BranchView {
  id: string;
  baseAgentId: string;
  baseVersionId: string | null;
  name: string;
  config: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds: Array<string>;
  agentToolIds: Array<string>;
  originRunId: string | null;
  status: "open" | "merged" | "closed";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatusView {
  budget: {
  id: string;
  name: string;
  scopeType: "org" | "project" | "agent";
  scopeId: string | null;
  periodType: "daily" | "weekly" | "monthly" | "rolling_30d" | "custom";
  limitCredits: string;
  enforcement: "off" | "alert" | "block";
  alertThresholdPct: number;
  periodStartAt: string | null;
  periodEndAt: string | null;
  createdAt: string;
  updatedAt: string;
};
  periodStart: string;
  periodEnd: string;
  spentCredits: string;
  limitCredits: string;
  remainingCredits: string;
  usedPct: number;
  state: "ok" | "warn" | "exceeded";
}

export interface BudgetView {
  id: string;
  name: string;
  scopeType: "org" | "project" | "agent";
  scopeId: string | null;
  periodType: "daily" | "weekly" | "monthly" | "rolling_30d" | "custom";
  limitCredits: string;
  enforcement: "off" | "alert" | "block";
  alertThresholdPct: number;
  periodStartAt: string | null;
  periodEndAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetsQuery {
  scopeType?: "org" | "project" | "agent";
}

export interface BuyCreditsInput {
  credits: number;
}

export interface BuyCreditsResult {
  purchaseId: string;
  checkoutUrl: string;
}

export interface CertAuditView {
  id: string;
  certificationId: string;
  agentId: string;
  scanResultId: string | null;
  guardrailPolicyId: string | null;
  auditLogSeq: number | null;
  verdict: "pass" | "fail";
  findings: { [key: string]: unknown };
  auditor: "automated" | "human" | "partner";
  createdAt: string;
}

export interface CertVerifyView {
  valid: boolean;
  certificationId: string;
  seal: "capability_verified" | "security_audited" | "enterprise_ready";
  agentVersion: string;
  status: "pending" | "active" | "expired" | "revoked";
  reason: string | null;
}

export interface CertificationDetail {
  id: string;
  agentId: string;
  agentVersion: string;
  seal: "capability_verified" | "security_audited" | "enterprise_ready";
  category: string | null;
  status: "pending" | "active" | "expired" | "revoked";
  benchmarkRunId: string | null;
  certAuditId: string | null;
  score: string | null;
  signature: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
  certAudit: {
  id: string;
  certificationId: string;
  agentId: string;
  scanResultId: string | null;
  guardrailPolicyId: string | null;
  auditLogSeq: number | null;
  verdict: "pass" | "fail";
  findings: { [key: string]: unknown };
  auditor: "automated" | "human" | "partner";
  createdAt: string;
} | null;
}

export interface CertificationView {
  id: string;
  agentId: string;
  agentVersion: string;
  seal: "capability_verified" | "security_audited" | "enterprise_ready";
  category: string | null;
  status: "pending" | "active" | "expired" | "revoked";
  benchmarkRunId: string | null;
  certAuditId: string | null;
  score: string | null;
  signature: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimAdjudication {
  verifiedRuns: number;
  failedVerify: number;
  recomputedValue: number;
  decision: "approved" | "denied" | "excluded";
  reason: string;
}

export interface ClaimView {
  id: string;
  policyId: string;
  slaTermId: string;
  status: "detected" | "adjudicating" | "approved" | "denied" | "paid" | "excluded";
  openedBy: "monitor" | "manual";
  windowStart: string;
  windowEnd: string;
  observedValue: number;
  guaranteedValue: number;
  sampleSize: number;
  evidenceRunIds: Array<string>;
  adjudication: {
  verifiedRuns: number;
  failedVerify: number;
  recomputedValue: number;
  decision: "approved" | "denied" | "excluded";
  reason: string;
} | null;
  payoutCredits: string | null;
  payoutLedgerTxId: string | null;
  denialReason: "error_budget_not_exhausted" | "excluded" | "insufficient_sample" | "fraud" | null;
  createdAt: string;
}

export interface ClaimsQuery {
  policyId?: string;
  status?: "detected" | "adjudicating" | "approved" | "denied" | "paid" | "excluded";
  limit?: number;
}

export interface CommentView {
  id: string;
  prId: string | null;
  parentId: string | null;
  anchorKind: "config_path" | "trace_step" | "general";
  anchorPath: string | null;
  anchorRunId: string | null;
  anchorStep: number | null;
  authorId: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceBundle {
  system: {
  orgId: string;
  agentId: string | null;
  agentName: string | null;
  generatedAt: string;
  window: {
  from: string | null;
  to: string | null;
};
};
  runs: Array<{
  runId: string;
  agentId: string;
  status: string;
  contentHash: string | null;
  signature: string | null;
  createdAt: string;
}>;
  scans: Array<{
  id: string;
  runId: string;
  scanType: "injection" | "exfiltration" | "pii";
  verdict: "allow" | "flag" | "block";
  severity: "none" | "low" | "medium" | "high" | "critical";
  findings: Array<{
  ruleId: string;
  span?: Array<unknown>;
  label: string;
  confidence: number;
  traceStepIdx?: number | null;
}>;
  detectorVer: string;
  createdAt: string;
}>;
  guardrails: Array<{
  id: string;
  name: string;
  version: number;
  scope: "org" | "agent";
  rules: {
  allowedTools?: Array<string>;
  allowedEgress?: {
  mode?: "allowlist" | "denyall";
  hosts?: Array<string>;
  blockRawIp?: boolean;
  blockPrivateRanges?: boolean;
};
  dataHandling?: {
  pii?: "off" | "flag" | "redact" | "block";
  secrets?: "off" | "flag" | "redact" | "block";
  maxOutputBytes?: number;
};
  onBlock?: "fail" | "escalate" | "redact_and_continue";
  audit?: "always" | "on_block" | "never";
};
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}>;
  audit: {
  entries: Array<{
  id: string;
  seq: number;
  actorType: "user" | "agent" | "system" | "service";
  actorId: string | null;
  action: string;
  runId: string | null;
  target: {
  table?: string;
  id?: string;
  [key: string]: unknown;
} | null;
  metadata: { [key: string]: unknown };
  prevHash: string;
  entryHash: string;
  createdAt: string;
}>;
  verification: {
  intact: boolean;
  length: number;
  firstBrokenSeq: number | null;
};
};
  provenance: {
  bundleHash: string;
  signature: string;
};
}

export interface ComplianceExportQuery {
  agentId?: string;
  from?: string;
  to?: string;
}

export type Confidence = "none" | "low" | "medium" | "high";

export interface ConfigDiff {
  changed?: Array<{
  path: string;
  before?: unknown | null;
  after?: unknown | null;
}>;
  added?: Array<string>;
  removed?: Array<string>;
}

export interface ConfirmConnectorInput {
  connectionId: string;
}

export interface ConnectorSessionResponse {
  sessionToken?: string;
}

export type ConnectorStatus = "pending" | "connected" | "error";

export interface ConnectorView {
  id: string;
  providerConfigKey: string;
  displayName: string;
  connectionId: string | null;
  status: "pending" | "connected" | "error";
  createdAt: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  avatarUrl?: string;
  specialties?: Array<string>;
  config: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds?: Array<string>;
  agentToolIds?: Array<string>;
  projectId?: string | null;
}

export interface CreateAlertRuleInput {
  name: string;
  metric: "p95_latency_ms" | "error_rate" | "cost_credits" | "drift" | "throughput";
  agentId?: string;
  condition: "gt" | "lt" | "change_pct";
  threshold: number;
  windowSeconds?: number;
  target: {
  webhook?: string;
  email?: string;
  slack?: string;
};
  enabled?: boolean;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: Array<"read" | "run" | "manage" | "pay">;
}

export interface CreateApiKeyResult {
  key: {
  id: string;
  name: string;
  maskedHint: string;
  scopes: Array<"read" | "run" | "manage" | "pay">;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};
  token: string;
}

export interface CreateAssignmentInput {
  agentId: string;
  roleId: string;
  projectId?: string;
  reportTo?: {
  kind: "agent" | "human";
  id: string;
};
  schedule?: {
  shifts?: Array<{
  day: string;
  start: string;
  end: string;
  tz?: string;
}>;
  onCall?: boolean;
};
  status?: "active" | "paused" | "off_shift";
}

export interface CreateBenchmarkInput {
  datasetId: string;
  name: string;
  category: string;
  passThreshold?: number;
  scoringConfig: {
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
};
  visibility?: "private" | "public";
}

export interface CreateBranchInput {
  name: string;
  fromRun?: string;
  config?: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds?: Array<string>;
  agentToolIds?: Array<string>;
}

export interface CreateBudgetInput {
  name: string;
  scopeType: "org" | "project" | "agent";
  scopeId?: string | null;
  periodType: "daily" | "weekly" | "monthly" | "rolling_30d" | "custom";
  limitCredits: number;
  enforcement?: "off" | "alert" | "block";
  alertThresholdPct?: number;
  periodStartAt?: string;
  periodEndAt?: string;
}

export interface CreateCommentInput {
  body: string;
  parentId?: string;
  anchorKind?: "config_path" | "trace_step" | "general";
  anchorPath?: string;
  anchorRunId?: string;
  anchorStep?: number;
}

export interface CreateConnectorInput {
  providerConfigKey: string;
  displayName: string;
}

export interface CreateEvalDatasetInput {
  name: string;
  category: string;
  version?: string;
  scoringKind?: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
  cases?: Array<{
  input: string;
  expected?: string;
}>;
  storageRef?: string;
}

export interface CreateGuardrailPolicyInput {
  name: string;
  scope?: "org" | "agent";
  rules: {
  allowedTools?: Array<string>;
  allowedEgress?: {
  mode?: "allowlist" | "denyall";
  hosts?: Array<string>;
  blockRawIp?: boolean;
  blockPrivateRanges?: boolean;
};
  dataHandling?: {
  pii?: "off" | "flag" | "redact" | "block";
  secrets?: "off" | "flag" | "redact" | "block";
  maxOutputBytes?: number;
};
  onBlock?: "fail" | "escalate" | "redact_and_continue";
  audit?: "always" | "on_block" | "never";
};
}

export interface CreateListingInput {
  agentId: string;
  versionId?: string;
  title: string;
  summary?: string;
  category?: string;
  tags?: Array<string>;
  pricing: {
  model: "free" | "one_time" | "usage_metered" | "subscription" | "revenue_share";
  amountCredits?: number;
  perRunCredits?: number;
  interval?: "month" | "year";
  takeRateBp?: number;
  builderShareBp?: number;
};
}

export interface CreateMeshGrantInput {
  grantorAgent: string;
  granteeScope: "agent" | "org" | "public";
  granteeAgent?: string;
  granteeOrg?: string;
  allowed?: boolean;
  rate: {
  credits: number;
  unit?: "per_call" | "per_1k_tokens";
};
  quota?: {
  calls: number;
  window: "minute" | "hour" | "day";
};
  minTrustScore?: number;
}

export interface CreatePayoutInput {
  amountCredits: number;
}

export interface CreatePrReviewInput {
  verdict: "approve" | "request_changes" | "comment";
  body?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface CreateRbacBindingInput {
  roleId: string;
  principalType: "user" | "scim_group";
  principalId: string;
  scopeType?: "org" | "project";
  scopeId?: string;
}

export interface CreateRbacRoleInput {
  name: string;
  permissions: Array<"agent:publish" | "agent:run" | "agent:read" | "marketplace:list" | "audit:read" | "billing:read" | "rbac:manage" | "sso:manage" | "scim:manage" | "org:admin">;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  defaultReportTo?: {
  kind: "agent" | "human";
  id: string;
};
  escalationPolicy?: {
  triggers?: Array<{
  kind: "low_confidence" | "guardrail" | "cost_ceiling" | "request_human" | "reporting_line_exhausted";
  below?: number;
  policies?: Array<string>;
  credits?: number;
}>;
  route?: {
  kind: "human";
  assigneePool: string;
  sla?: string;
};
  onExhaustion?: "escalate_human" | "fail";
};
  requiredMinTrust?: number;
  requiredConfidence?: "low" | "medium" | "high";
}

export interface CreateRunDiffInput {
  runAId: string;
  runBId: string;
  persist?: boolean;
}

export interface CreateSsoConnectionInput {
  provider: "okta" | "azure-ad" | "google" | "generic-saml" | "oidc";
  domain: string;
}

export interface CreateSuiteInput {
  agentId: string;
  name: string;
  description?: string;
  similarityThreshold?: number;
}

export interface CreateTemplateInput {
  slug: string;
  displayName: string;
  vertical: string;
  description?: string;
  sourceAgentId: string;
  params?: Array<{
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  default?: string;
}>;
  requiredConnectors?: Array<string>;
  visibility?: "private" | "public";
}

export interface DeployTemplateInput {
  params?: { [key: string]: string };
  name?: string;
  projectId?: string | null;
}

export interface DeploymentInfoView {
  tier: "managed" | "dedicated" | "self-host" | "air-gapped";
  airgapped: boolean;
  identityProvider: "workos" | "oidc" | "saml";
  economyMode: "external" | "showback";
  modelProviders: Array<string>;
  ssoConfigured: boolean;
}

export interface DriftFlag {
  agentId: string;
  kind: "alias" | "shift";
  baseline: {
  modelAlias: string | null;
  p50LatencyMs: number | null;
  p50CostCredits: string | null;
  successRate: number | null;
};
  observed: {
  modelAlias: string | null;
  p50LatencyMs: number | null;
  p50CostCredits: string | null;
  successRate: number | null;
};
  runIds: Array<string>;
}

export interface DriftObservation {
  modelAlias: string | null;
  p50LatencyMs: number | null;
  p50CostCredits: string | null;
  successRate: number | null;
}

export interface EnforceInput {
  tool?: string;
  egressHost?: string;
  content?: string;
  traceStepIdx?: number | null;
}

export interface EnforceResult {
  allowed: boolean;
  verdict: "allow" | "flag" | "block";
  severity: "none" | "low" | "medium" | "high" | "critical";
  rule: string | null;
  reason: string | null;
  onBlock: "fail" | "escalate" | "redact_and_continue";
  findings: Array<{
  ruleId: string;
  span?: Array<unknown>;
  label: string;
  confidence: number;
  traceStepIdx?: number | null;
}>;
  redactedContent: string | null;
}

export interface EscalationPolicy {
  triggers?: Array<{
  kind: "low_confidence" | "guardrail" | "cost_ceiling" | "request_human" | "reporting_line_exhausted";
  below?: number;
  policies?: Array<string>;
  credits?: number;
}>;
  route?: {
  kind: "human";
  assigneePool: string;
  sla?: string;
};
  onExhaustion?: "escalate_human" | "fail";
}

export interface EscalationRoute {
  kind: "human";
  assigneePool: string;
  sla?: string;
}

export interface EscalationTriggerRule {
  kind: "low_confidence" | "guardrail" | "cost_ceiling" | "request_human" | "reporting_line_exhausted";
  below?: number;
  policies?: Array<string>;
  credits?: number;
}

export interface EscalationView {
  id: string;
  runId: string;
  agentId: string;
  assignmentId: string | null;
  trigger: "low_confidence" | "guardrail" | "cost_ceiling" | "request_human" | "reporting_line_exhausted";
  triggerDetail: { [key: string]: unknown };
  assigneeId: string | null;
  status: "pending" | "assigned" | "decided" | "resumed" | "aborted" | "expired";
  slaDueAt: string | null;
  createdAt: string;
  assignedAt: string | null;
  decidedAt: string | null;
}

export interface EscalationsQuery {
  status?: "pending" | "assigned" | "decided" | "resumed" | "aborted" | "expired";
  pool?: string;
  limit?: number;
}

export interface EvalDatasetView {
  id: string;
  name: string;
  category: string;
  version: string;
  caseCount: number;
  scoringKind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  rubric: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
} | null;
  visibility: "private" | "public";
  createdAt: string;
}

export interface EvalRubric {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
}

export interface EvalRubricEnvelope {
  datasetRef?: string;
  passThreshold?: number;
  aggregate?: "mean_case_score" | "pass_rate";
  scorers: Array<{
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
  weight?: number;
}>;
  gates?: Array<{
  metric: "p95_latency_ms" | "p50_latency_ms" | "error_rate";
  max: number;
}>;
  tieBreak?: "earliest_submit" | "lowest_cost" | "highest_confidence";
}

export interface EvalRubricGate {
  metric: "p95_latency_ms" | "p50_latency_ms" | "error_rate";
  max: number;
}

export type ExecutionStatus = "success" | "error";

export interface ExecutionView {
  id: string;
  agentId: string;
  status: "success" | "error";
  prompt: string;
  output: string;
  thinking?: string | null;
  errorMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  trace?: Array<{
  kind: "model" | "tool" | "agent";
  name: string;
  status: "ok" | "error";
  startMs: number;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  detail?: string;
  error?: string;
  reasoning?: string;
}>;
  visibility: "private" | "public";
  contentHash: string | null;
  signature: string | null;
  parentExecutionId: string | null;
  createdAt: string;
}

export interface FileClaimInput {
  policyId: string;
  slaTermId: string;
}

export interface FleetAgentRow {
  agentId: string;
  name: string;
  runs: number;
  p95LatencyMs: number | null;
  successRate: number;
  costCredits: string;
  modelAlias: string | null;
  drift: {
  kind: "alias" | "shift";
  runIds: Array<string>;
} | null;
}

export interface FleetCostQuery {
  from?: string;
  to?: string;
  groupBy?: "provider" | "model";
}

export interface FleetCostRow {
  provider: string;
  model: string | null;
  costCredits: string;
  runs: number;
}

export interface FleetMetricPoint {
  ts: string;
  runs: number;
  errorRate: number;
  p50: number | null;
  p95: number | null;
  costCredits: string;
  tokens: number;
}

export interface FleetMetricsQuery {
  from?: string;
  to?: string;
  bucket?: "1m" | "1h" | "1d";
  agentId?: string;
  provider?: string;
  model?: string;
  groupBy?: "agent" | "provider" | "model" | "project";
}

export interface FleetSeries {
  key: string;
  points: Array<{
  ts: string;
  runs: number;
  errorRate: number;
  p50: number | null;
  p95: number | null;
  costCredits: string;
  tokens: number;
}>;
}

export interface GetAgentResponse {
  agent: AgentView;
  myRating: number | null;
}

export interface GuardrailAttachmentView {
  agentId: string | null;
  policyId: string;
  policyName: string;
  version: number;
  attachedAt: string;
}

export interface GuardrailPolicyView {
  id: string;
  name: string;
  version: number;
  scope: "org" | "agent";
  rules: {
  allowedTools?: Array<string>;
  allowedEgress?: {
  mode?: "allowlist" | "denyall";
  hosts?: Array<string>;
  blockRawIp?: boolean;
  blockPrivateRanges?: boolean;
};
  dataHandling?: {
  pii?: "off" | "flag" | "redact" | "block";
  secrets?: "off" | "flag" | "redact" | "block";
  maxOutputBytes?: number;
};
  onBlock?: "fail" | "escalate" | "redact_and_continue";
  audit?: "always" | "on_block" | "never";
};
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuardrailRules {
  allowedTools?: Array<string>;
  allowedEgress?: {
  mode?: "allowlist" | "denyall";
  hosts?: Array<string>;
  blockRawIp?: boolean;
  blockPrivateRanges?: boolean;
};
  dataHandling?: {
  pii?: "off" | "flag" | "redact" | "block";
  secrets?: "off" | "flag" | "redact" | "block";
  maxOutputBytes?: number;
};
  onBlock?: "fail" | "escalate" | "redact_and_continue";
  audit?: "always" | "on_block" | "never";
}

export interface HitlReviewView {
  id: string;
  escalationId: string;
  reviewerId: string;
  decision: "approve" | "edit" | "reject" | "abort";
  editedPayload: { [key: string]: unknown } | null;
  comment: string | null;
  latencyMs: number;
  createdAt: string;
}

export interface InstallView {
  id: string;
  listingId: string;
  agentId: string;
  source: string;
  active: boolean;
  grantedAt: string;
}

export interface InviteMemberInput {
  email: string;
  role?: "owner" | "admin" | "member";
}

export interface KeyValidationResult {
  valid: boolean;
  message?: string;
}

export interface LeaderboardEntryView {
  rank: number;
  agentId: string;
  agentVersion: string;
  benchmarkRunId: string;
  score: string;
  p50LatencyMs: number | null;
  costCredits: string | null;
  runCount: number;
  publishedAt: string;
}

export interface LedgerEntryView {
  id: string;
  transactionId: string;
  direction: "debit" | "credit";
  amountCredits: string;
  causeType: "purchase" | "mesh_call" | "payout" | "run" | "refund" | "dispute" | "reconciliation_adjustment" | "referral_reward";
  causeId: string;
  runId: string | null;
  counterAccount: "user_wallet" | "org_wallet" | "builder_earnings" | "platform_revenue" | "platform_float" | "escrow" | null;
  createdAt: string;
}

export interface LedgerPage {
  entries: Array<LedgerEntryView>;
  nextCursor: string | null;
}

export interface LineageNode {
  id: string;
  name: string;
  visible: boolean;
  trustScore: number | null;
  isCurrent: boolean;
}

export interface ListMembersResponse {
  members: Array<MemberView>;
  yourRole: MemberRole;
}

export interface ListingCard {
  id: string;
  agentId: string;
  versionId: string | null;
  title: string;
  summary: string;
  category: string;
  tags: Array<string>;
  status: string;
  pricing: {
  model: "free" | "one_time" | "usage_metered" | "subscription" | "revenue_share";
  amountCredits: number | null;
  perRunCredits: number | null;
  interval: string | null;
  takeRateBp: number;
  builderShareBp: number;
} | null;
  proof: {
  totalRuns: number;
  successRate: number | null;
  errorRate: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  trustScore: number | null;
  confidence: string;
  lastRunAt: string | null;
  replayableSampleRunId: string | null;
};
  proofScore: number;
  placement: {
  featured: boolean;
  featuredUntil: string | null;
};
  createdAt: string;
}

export interface ListingPricingInput {
  model: "free" | "one_time" | "usage_metered" | "subscription" | "revenue_share";
  amountCredits?: number;
  perRunCredits?: number;
  interval?: "month" | "year";
  takeRateBp?: number;
  builderShareBp?: number;
}

export interface ListingPricingView {
  model: "free" | "one_time" | "usage_metered" | "subscription" | "revenue_share";
  amountCredits: number | null;
  perRunCredits: number | null;
  interval: string | null;
  takeRateBp: number;
  builderShareBp: number;
}

export interface LiveModelsResponse {
  provider: "anthropic" | "openai" | "google" | "ollama";
  source: "registry" | "live";
  keyConfigured: boolean;
  models: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  label: string;
  contextWindow: number;
  maxOutputTokens: number;
  source?: "registry" | "live";
  usableForGeneration?: boolean;
  limits?: {
  approximate: true;
  source: string;
  tiers: Array<{
  tier: string;
  requestsPerMinute: number | null;
  tokensPerMinute: number | null;
  requestsPerDay: number | null;
}>;
  note?: string;
};
}>;
  warning?: string;
}

export interface MarketplaceSearchInput {
  q?: string;
  category?: string;
  sort?: "proof" | "recent" | "price";
  limit?: number;
}

export type MemberRole = "owner" | "admin" | "member";

export interface MemberView {
  userId: string;
  email: string;
  name: string | null;
  role: "owner" | "admin" | "member";
  isYou: boolean;
  joinedAt: string;
}

export interface MeshCallInput {
  callerAgent: string;
  calleeAgent: string;
  input: string;
  require?: {
  minTrustScore?: number;
  minSuccessRate?: number;
  minTotalRuns?: number;
};
  parentCallId?: string;
}

export interface MeshCallView {
  id: string;
  callerAgent: string;
  calleeAgent: string;
  runId: string | null;
  parentCallId: string | null;
  depth: number;
  attribution: {
  path: Array<string>;
  rootRunId: string | null;
  depth: number;
};
  grantId: string | null;
  escrowCredits: string;
  costCredits: string | null;
  ledgerTxId: string | null;
  status: "authorized" | "running" | "settled" | "failed" | "released";
  output: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface MeshCallsQuery {
  direction?: "outgoing" | "incoming";
  limit?: number;
  cursor?: string;
}

export interface MeshDiscoverHit {
  agentId: string;
  agentName: string;
  description: string | null;
  specialties: Array<string>;
  grantId: string;
  rateCredits: string;
  rateUnit: "per_call" | "per_1k_tokens";
  quotaCalls: number | null;
  quotaWindow: "minute" | "hour" | "day" | null;
  minTrustScore: string | null;
  trustScore: number | null;
  successRate: number | null;
  totalRuns: number;
  confidence: string;
  rankScore: number;
}

export interface MeshDiscoverQuery {
  q?: string;
  minTrustScore?: number;
  minSuccessRate?: number;
  minTotalRuns?: number;
  maxRateCredits?: number;
  limit?: number;
}

export interface MeshGrantView {
  id: string;
  grantorAgent: string;
  granteeScope: "agent" | "org" | "public";
  granteeAgent: string | null;
  granteeOrg: string | null;
  allowed: boolean;
  rateCredits: string;
  rateUnit: "per_call" | "per_1k_tokens";
  quotaCalls: number | null;
  quotaWindow: "minute" | "hour" | "day" | null;
  minTrustScore: string | null;
  createdAt: string;
}

export interface MeshHopView {
  callId: string;
  callerAgentId: string;
  calleeAgentId: string;
  depth: number;
  costCredits: string | null;
  status: string;
  createdAt: string;
}

export interface MeshTraceView {
  rootRunId: string;
  totalCredits: string;
  hops: Array<{
  callId: string;
  callerAgentId: string;
  calleeAgentId: string;
  depth: number;
  costCredits: string | null;
  status: string;
  createdAt: string;
}>;
}

export interface ModelInfo {
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  label: string;
  contextWindow: number;
  maxOutputTokens: number;
  source?: "registry" | "live";
  usableForGeneration?: boolean;
  limits?: {
  approximate: true;
  source: string;
  tiers: Array<{
  tier: string;
  requestsPerMinute: number | null;
  tokensPerMinute: number | null;
  requestsPerDay: number | null;
}>;
  note?: string;
};
}

export interface ModelLimitTier {
  tier: string;
  requestsPerMinute: number | null;
  tokensPerMinute: number | null;
  requestsPerDay: number | null;
}

export interface ModelLimits {
  approximate: true;
  source: string;
  tiers: Array<{
  tier: string;
  requestsPerMinute: number | null;
  tokensPerMinute: number | null;
  requestsPerDay: number | null;
}>;
  note?: string;
}

export interface OkResponse {
  ok: boolean;
}

export interface OpenPrInput {
  title: string;
  body?: string;
  runDiffId?: string;
}

export interface OperatedWindow {
  firstRunAt: string | null;
  lastRunAt: string | null;
  distinctDays: number;
}

export interface OperatorProof {
  eligible: boolean;
  runsObserved: number;
  operatedWindow: {
  firstRunAt: string | null;
  lastRunAt: string | null;
  distinctDays: number;
};
  operatorSuccessRate: number;
  evidenceRunIds: Array<string>;
}

export interface OrgChartEdge {
  fromAgentId: string;
  to: {
  kind: "agent" | "human";
  id: string;
};
}

export interface OrgChartNode {
  agentId: string;
  roleId: string | null;
  roleName: string | null;
  status: "active" | "paused" | "off_shift" | null;
  trustScore: number | null;
}

export interface OrgChartView {
  nodes: Array<{
  agentId: string;
  roleId: string | null;
  roleName: string | null;
  status: "active" | "paused" | "off_shift" | null;
  trustScore: number | null;
}>;
  edges: Array<{
  fromAgentId: string;
  to: {
  kind: "agent" | "human";
  id: string;
};
}>;
}

export interface OtelAttribute {
  key: string;
  value: {
  stringValue?: string;
  intValue?: string;
  boolValue?: boolean;
};
}

export interface OtelSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  status: {
  code: number;
};
  attributes: Array<{
  key: string;
  value: {
  stringValue?: string;
  intValue?: string;
  boolValue?: boolean;
};
}>;
}

export interface OtelTraceExport {
  resourceSpans: Array<{
  resource: {
  attributes: Array<{
  key: string;
  value: {
  stringValue?: string;
  intValue?: string;
  boolValue?: boolean;
};
}>;
};
  scopeSpans: Array<{
  scope: {
  name: string;
  version?: string;
};
  spans: Array<{
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  status: {
  code: number;
};
  attributes: Array<{
  key: string;
  value: {
  stringValue?: string;
  intValue?: string;
  boolValue?: boolean;
};
}>;
}>;
}>;
}>;
}

/** Approximate mirror of the frontend OverviewStats DTO. */
export interface OverviewStats {
  totalAgents: number;
  totalRuns: number;
  successRate: number | null;
  totalConnectors: number;
}

export interface PayoutAccountResponse {
  account: PayoutAccountView | null;
}

export interface PayoutAccountView {
  id: string;
  stripeConnectId: string;
  kycStatus: "pending" | "verified" | "restricted";
  payoutsEnabled: boolean;
  onboardingUrl?: string;
}

export interface PayoutView {
  id: string;
  credits: string;
  amountFiatCents: number;
  status: "requested" | "held" | "paid" | "failed" | "reversed";
  holdReason: string | null;
  stripeTransferId: string | null;
  createdAt: string;
}

export interface PerformanceReview {
  agentId: string;
  window: string;
  reputation: {
  trustScore: number | null;
  successRate: number | null;
  confidence: "low" | "medium" | "high" | null;
};
  reliability: {
  successRate: number | null;
  totalRuns: number;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
};
  cost: {
  credits: string;
};
  escalations: {
  count: number;
  rate: number;
  avgLatencyMs: number | null;
  decisionMix: { [key: string]: number };
};
  handoffs: {
  initiated: number;
  received: number;
  settledCostCredits: string;
  abortRate: number;
};
  drilldown: {
  contributingRunIds: Array<string>;
};
}

export type Plan = "free" | "team" | "scale" | "enterprise";

export interface PlanSubscribeInput {
  plan?: "team" | "scale";
}

export interface PlaygroundRunInput {
  agentId: string;
  prompt: string;
}

export interface PoliciesQuery {
  status?: "quoted" | "bound" | "active" | "lapsed" | "cancelled" | "expired";
  limit?: number;
  cursor?: string;
}

export interface PolicyQuoteView {
  riskScoreId: string;
  insurable: boolean;
  reason: string | null;
  agentId: string;
  agentVersion: string | null;
  coverageCapCredits: string;
  premiumCredits: string;
  term: string;
  riskScore: {
  id: string;
  agentId: string;
  agentVersion: string | null;
  riskScore: number;
  premiumRate: number;
  insurable: boolean;
  reason?: string | null;
  inputs: {
  repTrust: number | null;
  repConfidence: "none" | "low" | "medium" | "high";
  successRate: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  latencyP99Ms: number | null;
  evalPercentile: number | null;
  regressionStability: number | null;
  runVolume: number;
  windowDays: number;
};
  modelVersion: string;
  computedAt: string;
};
  slaTerms: Array<{
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: number;
  window?: string;
  minSample?: number;
  payoutCredits: number;
  errorBudget?: number;
}>;
}

export interface PolicyView {
  id: string;
  agentId: string;
  agentVersion: string | null;
  builderOrgId: string | null;
  status: "quoted" | "bound" | "active" | "lapsed" | "cancelled" | "expired";
  coverageCapCredits: string;
  premiumCredits: string;
  premiumLedgerTxId: string | null;
  reserveEscrowAccountId: string | null;
  carrierRef: string | null;
  riskScore: {
  id: string;
  agentId: string;
  agentVersion: string | null;
  riskScore: number;
  premiumRate: number;
  insurable: boolean;
  reason?: string | null;
  inputs: {
  repTrust: number | null;
  repConfidence: "none" | "low" | "medium" | "high";
  successRate: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  latencyP99Ms: number | null;
  evalPercentile: number | null;
  regressionStability: number | null;
  runVolume: number;
  windowDays: number;
};
  modelVersion: string;
  computedAt: string;
};
  slaTerms: Array<{
  id: string;
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: string;
  measurementWindow: string;
  minSample: number;
  payoutCredits: string;
  errorBudget: string | null;
  observed: number | null;
  status: "on_track" | "at_risk" | "breached" | "insufficient_sample";
}>;
  termStart: string;
  termEnd: string;
  createdAt: string;
}

export interface PostBountyInput {
  title: string;
  spec: string;
  category: string;
  tags?: Array<string>;
  budgetCredits: number;
  evalRubric: {
  datasetRef?: string;
  passThreshold?: number;
  aggregate?: "mean_case_score" | "pass_rate";
  scorers: Array<{
  kind: "similarity" | "exact" | "json" | "regex" | "llm_judge";
  similarityThreshold?: number;
  jsonAsserts?: Array<string>;
  regexAsserts?: Array<string>;
  rubric?: {
  criteria?: Array<string>;
  scaleMax?: number;
  instructions?: string;
};
  weight?: number;
}>;
  gates?: Array<{
  metric: "p95_latency_ms" | "p50_latency_ms" | "error_rate";
  max: number;
}>;
  tieBreak?: "earliest_submit" | "lowest_cost" | "highest_confidence";
};
  evalDatasetId?: string;
  minScore?: number;
  maxSubmissionsPerOrg?: number;
  tieBreak?: "earliest_submit" | "lowest_cost" | "highest_confidence";
  deadline: string;
  visibility?: "public" | "private";
}

export interface PrDetail {
  id: string;
  branchId: string;
  baseAgentId: string;
  title: string;
  body: string;
  configDiff: {
  changed?: Array<{
  path: string;
  before?: unknown | null;
  after?: unknown | null;
}>;
  added?: Array<string>;
  removed?: Array<string>;
};
  runDiffId: string | null;
  status: "open" | "approved" | "changes_requested" | "merged" | "closed";
  mergedVersionId: string | null;
  openedBy: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  runDiff: {
  id: string | null;
  runAId: string;
  runBId: string;
  result: {
  steps: Array<{
  op: "unchanged" | "changed" | "added" | "removed";
  stepA: { [key: string]: unknown } | null;
  stepB: { [key: string]: unknown } | null;
  latencyDeltaMs: number | null;
  tokenDelta: number | null;
  statusDelta: string | null;
}>;
  outputDiff: string;
  rollups: {
  costDelta: number;
  latencyDeltaMs: number;
  tokenDelta: number;
  steps: {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
};
};
  regressions?: Array<string>;
  lowConfidenceAlignment?: boolean;
};
  visibility: "private" | "public";
  createdAt: string | null;
} | null;
  reviews: Array<{
  id: string;
  prId: string;
  reviewerId: string;
  verdict: "approve" | "request_changes" | "comment";
  body: string;
  createdAt: string;
}>;
  comments: Array<{
  id: string;
  prId: string | null;
  parentId: string | null;
  anchorKind: "config_path" | "trace_step" | "general";
  anchorPath: string | null;
  anchorRunId: string | null;
  anchorStep: number | null;
  authorId: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}>;
}

export interface PrReviewView {
  id: string;
  prId: string;
  reviewerId: string;
  verdict: "approve" | "request_changes" | "comment";
  body: string;
  createdAt: string;
}

export interface PrView {
  id: string;
  branchId: string;
  baseAgentId: string;
  title: string;
  body: string;
  configDiff: {
  changed?: Array<{
  path: string;
  before?: unknown | null;
  after?: unknown | null;
}>;
  added?: Array<string>;
  removed?: Array<string>;
};
  runDiffId: string | null;
  status: "open" | "approved" | "changes_requested" | "merged" | "closed";
  mergedVersionId: string | null;
  openedBy: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
}

export interface ProjectView {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  createdAt: string;
}

export interface PromoteVersionResponse {
  promoted: string;
  channels: Array<{
  channel: string;
  semver: string;
}>;
}

export interface ProofBlock {
  totalRuns: number;
  successRate: number | null;
  errorRate: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  trustScore: number | null;
  confidence: string;
  lastRunAt: string | null;
  replayableSampleRunId: string | null;
}

export type Provider = "anthropic" | "openai" | "google" | "ollama";

export type ProviderKeyStatus = "valid" | "invalid" | "unchecked";

export interface ProviderKeyView {
  id: string;
  provider: "anthropic" | "openai" | "google" | "ollama";
  label: string | null;
  maskedHint: string;
  status: "valid" | "invalid" | "unchecked";
  lastValidatedAt: string | null;
  createdAt: string;
}

export interface PublicRunResponse {
  run: {
  id: string;
  agentId: string;
  status: "success" | "error";
  prompt: string;
  output: string;
  thinking?: string | null;
  errorMessage: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  trace?: Array<{
  kind: "model" | "tool" | "agent";
  name: string;
  status: "ok" | "error";
  startMs: number;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  detail?: string;
  error?: string;
  reasoning?: string;
}>;
  visibility: "private" | "public";
  contentHash: string | null;
  signature: string | null;
  parentExecutionId: string | null;
  createdAt: string;
};
  redactions: number;
  agent: {
  id: string;
  name: string;
  avatarUrl: string | null;
  description: string;
  provider: string;
  model: string;
  visibility: "private" | "public";
  reputation: {
  successCount: number;
  failureCount: number;
  totalRuns: number;
  successRate: number | null;
  avgLatencyMs: number;
  avgRating: number | null;
  ratingCount: number;
  trustScore: number | null;
  confidence: "none" | "low" | "medium" | "high";
  breakdown: {
  reliability: number | null;
  satisfaction: number | null;
  speed: number | null;
  retryDiscipline?: number | null;
  regression?: number | null;
  costEfficiency?: number | null;
  counterparty?: number | null;
  weights: {
  reliability: number;
  satisfaction: number;
  speed: number;
  retryDiscipline?: number;
  regression?: number;
  costEfficiency?: number;
  counterparty?: number;
};
};
};
};
}

export interface PublishVersionInput {
  semver: string;
  changelog?: string;
}

export interface PurchaseResult {
  purchaseId: string;
  grossCredits: string;
  builderCredits: string;
  takeRateCredits: string;
  ledgerTxnId: string | null;
  install: {
  id: string;
  listingId: string;
  agentId: string;
  source: string;
  active: boolean;
  grantedAt: string;
};
}

export interface QuotePolicyInput {
  agentId: string;
  agentVersion?: string;
  slaTerms: Array<{
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: number;
  window?: string;
  minSample?: number;
  payoutCredits: number;
  errorBudget?: number;
}>;
  coverageCapCredits: number;
  term?: string;
}

export interface RateAgentInput {
  rating: number;
}

export interface RateAgentResponse {
  reputation: ReputationView;
  myRating: number;
}

export interface RbacBindingView {
  id: string;
  roleId: string;
  principalType: "user" | "scim_group";
  principalId: string;
  scopeType: "org" | "project";
  scopeId: string | null;
  grantedBy: string | null;
  createdAt: string;
}

export interface RbacRoleView {
  id: string;
  orgId: string | null;
  name: string;
  permissions: Array<"agent:publish" | "agent:run" | "agent:read" | "marketplace:list" | "audit:read" | "billing:read" | "rbac:manage" | "sso:manage" | "scim:manage" | "org:admin">;
  isSystem: boolean;
  createdAt: string;
}

export interface RealtimeRoom {
  roomId: string;
  enabled: boolean;
  wsUrl: string | null;
  token: string | null;
}

/** Approximate mirror of the frontend RecentExecution DTO. */
export interface RecentExecution {
  id: string;
  agentId: string;
  agentName: string;
  status: ExecutionStatus;
  latencyMs: number;
  createdAt: string;
}

export interface ReportTarget {
  kind: "agent" | "human";
  id: string;
}

export interface ReputationBreakdown {
  reliability: number | null;
  satisfaction: number | null;
  speed: number | null;
  retryDiscipline?: number | null;
  regression?: number | null;
  costEfficiency?: number | null;
  counterparty?: number | null;
  weights: {
  reliability: number;
  satisfaction: number;
  speed: number;
  retryDiscipline?: number;
  regression?: number;
  costEfficiency?: number;
  counterparty?: number;
};
}

export interface ReputationView {
  successCount: number;
  failureCount: number;
  totalRuns: number;
  successRate: number | null;
  avgLatencyMs: number;
  avgRating: number | null;
  ratingCount: number;
  trustScore: number | null;
  confidence: "none" | "low" | "medium" | "high";
  breakdown: {
  reliability: number | null;
  satisfaction: number | null;
  speed: number | null;
  retryDiscipline?: number | null;
  regression?: number | null;
  costEfficiency?: number | null;
  counterparty?: number | null;
  weights: {
  reliability: number;
  satisfaction: number;
  speed: number;
  retryDiscipline?: number;
  regression?: number;
  costEfficiency?: number;
  counterparty?: number;
};
};
}

export interface RerunInput {
  executionId: string;
  agentId?: string;
  prompt?: string;
}

export interface ResolveEscalationInput {
  decision: "approve" | "edit" | "reject" | "abort";
  editedPayload?: { [key: string]: unknown };
  comment?: string;
}

export interface ReviewEligibilityView {
  eligible: boolean;
  runsObserved: number;
  operatedWindow: {
  firstRunAt: string | null;
  lastRunAt: string | null;
  distinctDays: number;
};
  operatorSuccessRate: number;
  need: string | null;
}

export interface ReviewWindowQuery {
  window?: string;
}

export interface RevokeCertificationInput {
  reason: string;
}

export interface RiskScoreInputs {
  repTrust: number | null;
  repConfidence: "none" | "low" | "medium" | "high";
  successRate: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  latencyP99Ms: number | null;
  evalPercentile: number | null;
  regressionStability: number | null;
  runVolume: number;
  windowDays: number;
}

export interface RiskScoreView {
  id: string;
  agentId: string;
  agentVersion: string | null;
  riskScore: number;
  premiumRate: number;
  insurable: boolean;
  reason?: string | null;
  inputs: {
  repTrust: number | null;
  repConfidence: "none" | "low" | "medium" | "high";
  successRate: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  latencyP99Ms: number | null;
  evalPercentile: number | null;
  regressionStability: number | null;
  runVolume: number;
  windowDays: number;
};
  modelVersion: string;
  computedAt: string;
}

export interface RoleView {
  id: string;
  name: string;
  description: string;
  defaultReportTo: {
  kind: "agent" | "human";
  id: string;
} | null;
  escalationPolicy: {
  triggers?: Array<{
  kind: "low_confidence" | "guardrail" | "cost_ceiling" | "request_human" | "reporting_line_exhausted";
  below?: number;
  policies?: Array<string>;
  credits?: number;
}>;
  route?: {
  kind: "human";
  assigneePool: string;
  sla?: string;
};
  onExhaustion?: "escalate_human" | "fail";
};
  requiredMinTrust: string | null;
  requiredConfidence: "low" | "medium" | "high" | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingCandidate {
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  score: number;
  obsCostCredits: number | null;
  p50LatencyMs: number | null;
  successRate: number | null;
  evalPassRate: number | null;
  eligible: boolean;
  reason: string;
  lowConfidence?: boolean;
}

export interface RoutingDecisionView {
  id: string;
  agentId: string;
  executionId: string | null;
  policyId: string | null;
  objective: "min_cost" | "min_latency" | "max_quality" | "balanced";
  chosenProvider: string;
  chosenModel: string;
  candidates: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  score: number;
  obsCostCredits: number | null;
  p50LatencyMs: number | null;
  successRate: number | null;
  evalPassRate: number | null;
  eligible: boolean;
  reason: string;
  lowConfidence?: boolean;
}>;
  suiteRunId: string | null;
  failoverFrom: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  error: string;
} | null;
  reason: string;
  createdAt: string;
}

export interface RoutingDecisionsQuery {
  agentId?: string;
  objective?: "min_cost" | "min_latency" | "max_quality" | "balanced";
  limit?: number;
  cursor?: string;
}

export interface RoutingFailover {
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  error: string;
}

export interface RoutingModelRef {
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
}

export interface RoutingPolicyView {
  id: string;
  agentId: string;
  enabled: boolean;
  objective: "min_cost" | "min_latency" | "max_quality" | "balanced";
  allowedProviders: Array<"anthropic" | "openai" | "google" | "ollama">;
  allowedModels: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
}> | null;
  fallbackChain: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
}>;
  mustPassSuiteId: string | null;
  minPassRate: number;
  respectRateLimits: boolean;
  maxCostPerRunCredits: number | null;
  weights: {
  cost: number;
  latency: number;
  quality: number;
} | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingPreview {
  objective: "min_cost" | "min_latency" | "max_quality" | "balanced";
  chosen: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
} | null;
  fallbackChain: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
}>;
  candidates: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
  score: number;
  obsCostCredits: number | null;
  p50LatencyMs: number | null;
  successRate: number | null;
  evalPassRate: number | null;
  eligible: boolean;
  reason: string;
  lowConfidence?: boolean;
}>;
}

export interface RoutingWeights {
  cost: number;
  latency: number;
  quality: number;
}

export interface RunDiffResult {
  steps: Array<{
  op: "unchanged" | "changed" | "added" | "removed";
  stepA: { [key: string]: unknown } | null;
  stepB: { [key: string]: unknown } | null;
  latencyDeltaMs: number | null;
  tokenDelta: number | null;
  statusDelta: string | null;
}>;
  outputDiff: string;
  rollups: {
  costDelta: number;
  latencyDeltaMs: number;
  tokenDelta: number;
  steps: {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
};
};
  regressions?: Array<string>;
  lowConfidenceAlignment?: boolean;
}

export interface RunDiffRollups {
  costDelta: number;
  latencyDeltaMs: number;
  tokenDelta: number;
  steps: {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
};
}

export interface RunDiffView {
  id: string | null;
  runAId: string;
  runBId: string;
  result: {
  steps: Array<{
  op: "unchanged" | "changed" | "added" | "removed";
  stepA: { [key: string]: unknown } | null;
  stepB: { [key: string]: unknown } | null;
  latencyDeltaMs: number | null;
  tokenDelta: number | null;
  statusDelta: string | null;
}>;
  outputDiff: string;
  rollups: {
  costDelta: number;
  latencyDeltaMs: number;
  tokenDelta: number;
  steps: {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
};
};
  regressions?: Array<string>;
  lowConfidenceAlignment?: boolean;
};
  visibility: "private" | "public";
  createdAt: string | null;
}

export interface RunDiffVisibilityInput {
  visibility: "private" | "public";
}

export type RunVisibility = "private" | "public";

export interface SaveKeyResponse {
  key: ProviderKeyView;
  validation: KeyValidationResult;
}

export interface SaveProviderKeyInput {
  provider: "anthropic" | "openai" | "google" | "ollama";
  apiKey: string;
  label?: string;
}

export interface ScanFinding {
  ruleId: string;
  span?: Array<unknown>;
  label: string;
  confidence: number;
  traceStepIdx?: number | null;
}

export interface ScanResultView {
  id: string;
  runId: string;
  scanType: "injection" | "exfiltration" | "pii";
  verdict: "allow" | "flag" | "block";
  severity: "none" | "low" | "medium" | "high" | "critical";
  findings: Array<{
  ruleId: string;
  span?: Array<unknown>;
  label: string;
  confidence: number;
  traceStepIdx?: number | null;
}>;
  detectorVer: string;
  createdAt: string;
}

export interface ScimUserView {
  id: string;
  userId: string | null;
  externalId: string;
  email: string;
  scimGroups: Array<string>;
  active: boolean;
  createdAt: string;
}

export interface ScimWebhookEvent {
  id: string;
  event: string;
  data: { [key: string]: unknown };
}

export interface SetRunVisibilityInput {
  visibility: "private" | "public";
}

export interface Shift {
  day: string;
  start: string;
  end: string;
  tz?: string;
}

export interface SlaStanding {
  id: string;
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: string;
  measurementWindow: string;
  minSample: number;
  payoutCredits: string;
  errorBudget: string | null;
  observed: number | null;
  status: "on_track" | "at_risk" | "breached" | "insufficient_sample";
}

export interface SlaTermInput {
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: number;
  window?: string;
  minSample?: number;
  payoutCredits: number;
  errorBudget?: number;
}

export interface SlaTermView {
  id: string;
  metric: "success_rate" | "latency_p50_ms" | "latency_p95_ms" | "uptime";
  comparator: "gte" | "lte";
  threshold: string;
  measurementWindow: string;
  minSample: number;
  payoutCredits: string;
  errorBudget: string | null;
}

export interface SpendingRow {
  key: string;
  label: string;
  costCredits: string;
  runs: number;
}

export interface SpendingSummaryQuery {
  from?: string;
  to?: string;
  groupBy?: "agent" | "project" | "model" | "provider";
}

export interface SpendingTrendPoint {
  ts: string;
  costCredits: string;
  runs: number;
}

export interface SpendingTrendQuery {
  from?: string;
  to?: string;
  bucket?: "1h" | "1d";
}

export interface SsoConnectionView {
  id: string;
  provider: "okta" | "azure-ad" | "google" | "generic-saml" | "oidc";
  workosConnId: string | null;
  domain: string;
  status: "pending" | "active" | "inactive";
  setupUrl?: string | null;
  createdAt: string;
}

export interface SubmissionView {
  id: string;
  bountyId: string;
  agentId: string;
  agentVersion: string;
  benchmarkRunId: string | null;
  score: number | null;
  passed: boolean | null;
  p50LatencyMs: number | null;
  costCredits: string | null;
  runCount: number;
  status: "queued" | "scoring" | "scored" | "error" | "disqualified";
  disqualifiedReason: string | null;
  rank?: number | null;
  results?: Array<{
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
  score?: number;
}>;
  createdAt: string;
  scoredAt: string | null;
}

export interface SubmitBenchmarkInput {
  agentId: string;
  agentVersion: string;
}

export interface SubmitBountyInput {
  agentId: string;
  agentVersion: string;
}

export interface SuiteCaseResult {
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
}

export interface SuiteCaseView {
  id: string;
  prompt: string;
  baselineOutput: string;
  baselineStatus: "success" | "error";
  createdAt: string;
}

export interface SuiteDetail {
  id: string;
  agentId: string;
  name: string;
  description: string;
  similarityThreshold: number;
  webhookToken: string;
  caseCount: number;
  lastRun: {
  id: string;
  status: "pass" | "fail";
  total: number;
  passed: number;
  failed: number;
  triggeredBy: string;
  results: Array<{
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
}>;
  createdAt: string;
} | null;
  createdAt: string;
  cases: Array<{
  id: string;
  prompt: string;
  baselineOutput: string;
  baselineStatus: "success" | "error";
  createdAt: string;
}>;
  runs: Array<{
  id: string;
  status: "pass" | "fail";
  total: number;
  passed: number;
  failed: number;
  triggeredBy: string;
  results: Array<{
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
}>;
  createdAt: string;
}>;
}

export interface SuiteRunView {
  id: string;
  status: "pass" | "fail";
  total: number;
  passed: number;
  failed: number;
  triggeredBy: string;
  results: Array<{
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
}>;
  createdAt: string;
}

export interface SuiteView {
  id: string;
  agentId: string;
  name: string;
  description: string;
  similarityThreshold: number;
  webhookToken: string;
  caseCount: number;
  lastRun: {
  id: string;
  status: "pass" | "fail";
  total: number;
  passed: number;
  failed: number;
  triggeredBy: string;
  results: Array<{
  caseId: string;
  prompt: string;
  status: "success" | "error";
  baselineStatus: "success" | "error";
  similarity: number;
  passed: boolean;
  reason: string;
  executionId: string;
}>;
  createdAt: string;
} | null;
  createdAt: string;
}

export interface TemplateCard {
  id: string;
  slug: string;
  displayName: string;
  vertical: string;
  description: string;
  requiredConnectors: Array<string>;
  deployCount: number;
  createdAt: string;
}

export interface TemplateDetail {
  id: string;
  slug: string;
  displayName: string;
  vertical: string;
  description: string;
  requiredConnectors: Array<string>;
  deployCount: number;
  createdAt: string;
  config: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  params: Array<{
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  default?: string;
}>;
  visibility: "private" | "public";
}

export interface TemplateParam {
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  default?: string;
}

export interface TemplateSearchInput {
  vertical?: string;
  connector?: string;
  sort?: "deploys" | "recent";
  limit?: number;
}

export interface TraceStep {
  kind: "model" | "tool" | "agent";
  name: string;
  status: "ok" | "error";
  startMs: number;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  detail?: string;
  error?: string;
  reasoning?: string;
}

export interface TryListingInput {
  input: string;
}

export interface TryListingResponse {
  runId: string;
  status: string;
  shareUrl: string;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  specialties?: Array<string>;
  config?: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds?: Array<string>;
  agentToolIds?: Array<string>;
  projectId?: string | null;
}

export interface UpdateAlertRuleInput {
  name?: string;
  metric?: "p95_latency_ms" | "error_rate" | "cost_credits" | "drift" | "throughput";
  agentId?: string;
  condition?: "gt" | "lt" | "change_pct";
  threshold?: number;
  windowSeconds?: number;
  target?: {
  webhook?: string;
  email?: string;
  slack?: string;
};
  enabled?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  config?: {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
};
  connectorIds?: Array<string>;
  agentToolIds?: Array<string>;
}

export interface UpdateBudgetInput {
  name?: string;
  periodType?: "daily" | "weekly" | "monthly" | "rolling_30d" | "custom";
  limitCredits?: number;
  enforcement?: "off" | "alert" | "block";
  alertThresholdPct?: number;
  periodStartAt?: string;
  periodEndAt?: string;
}

export interface UpdateMemberInput {
  role: "owner" | "admin" | "member";
}

export interface UpsertRoutingPolicyInput {
  enabled?: boolean;
  objective?: "min_cost" | "min_latency" | "max_quality" | "balanced";
  allowedProviders?: Array<"anthropic" | "openai" | "google" | "ollama">;
  allowedModels?: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
}> | null;
  fallbackChain?: Array<{
  provider: "anthropic" | "openai" | "google" | "ollama";
  id: string;
}>;
  mustPassSuiteId?: string | null;
  minPassRate?: number;
  respectRateLimits?: boolean;
  maxCostPerRunCredits?: number | null;
  weights?: {
  cost: number;
  latency: number;
  quality: number;
} | null;
}

export interface ValidateKeyInput {
  provider: Provider;
  apiKey: string;
}

export interface VerifiedReviewView {
  id: string;
  agentId: string;
  agentVersion: string | null;
  userId: string;
  rating: number;
  body: string;
  verifiedOperator: boolean;
  runsObserved: number;
  operatedWindow: {
  firstRunAt: string | null;
  lastRunAt: string | null;
  distinctDays: number;
} | null;
  operatorSuccessRate: string | null;
  evidenceRunIds: Array<string>;
  status: "active" | "edited" | "removed";
  createdAt: string;
  updatedAt: string;
}

export interface VerifyVersionResponse {
  valid: boolean;
  digest: string;
  recomputedDigest: string;
}

export interface VersionRunAggregate {
  totalRuns: number;
  successRate: number | null;
  errorRate: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  lastRunAt: string | null;
}

export interface WalletView {
  walletId: string;
  balanceCredits: string;
  pendingEarningsCredits: string;
  creditValueUsd: number;
  recent: Array<{
  id: string;
  transactionId: string;
  direction: "debit" | "credit";
  amountCredits: string;
  causeType: "purchase" | "mesh_call" | "payout" | "run" | "refund" | "dispute" | "reconciliation_adjustment" | "referral_reward";
  causeId: string;
  runId: string | null;
  counterAccount: "user_wallet" | "org_wallet" | "builder_earnings" | "platform_revenue" | "platform_float" | "escrow" | null;
  createdAt: string;
}>;
}

export interface WorkforceSchedule {
  shifts?: Array<{
  day: string;
  start: string;
  end: string;
  tz?: string;
}>;
  onCall?: boolean;
}

export interface WriteReviewInput {
  rating: number;
  body?: string;
  agentVersion?: string;
}
