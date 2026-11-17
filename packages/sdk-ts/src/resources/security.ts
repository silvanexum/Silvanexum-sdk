import type { HttpClient } from "../core/http.js";
import type {
  AuditChainVerify,
  AuditEntryView,
  ComplianceBundle,
  CreateGuardrailPolicyInput,
  EnforceInput,
  EnforceResult,
  GuardrailAttachmentView,
  GuardrailPolicyView,
  ScanResultView,
} from "../generated/types.js";

/** Hash-chained audit log, scan verdicts & guardrail policies (M06). `sx.security.*` */
export class SecurityResource {
  constructor(private readonly http: HttpClient) {}

  /** Page the tamper-evident, append-only audit log. */
  async auditLog(
    opts: {
      agentId?: string;
      runId?: string;
      action?: string;
      from?: string;
      to?: string;
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<{ entries: AuditEntryView[]; nextCursor: string | null }> {
    return this.http.request({ method: "GET", path: "/audit/log", query: opts });
  }

  /** Walk + verify the audit chain instead of paging entries. */
  async verifyAuditChain(
    opts: { agentId?: string; runId?: string; action?: string; from?: string; to?: string } = {},
  ): Promise<AuditChainVerify> {
    return this.http.request({ method: "GET", path: "/audit/log", query: { ...opts, verify: true } });
  }

  /** Create a versioned guardrail policy. */
  async createPolicy(input: CreateGuardrailPolicyInput): Promise<GuardrailPolicyView> {
    return (
      await this.http.request<{ policy: GuardrailPolicyView }>({
        method: "POST",
        path: "/guardrails/policies",
        body: input,
      })
    ).policy;
  }

  /** Fetch one guardrail policy. */
  async getPolicy(id: string): Promise<GuardrailPolicyView> {
    return (
      await this.http.request<{ policy: GuardrailPolicyView }>({
        method: "GET",
        path: `/guardrails/policies/${id}`,
      })
    ).policy;
  }

  /** Attach a guardrail policy to an agent. */
  async attachGuardrail(agentId: string, policyId: string): Promise<GuardrailAttachmentView> {
    return (
      await this.http.request<{ attachment: GuardrailAttachmentView }>({
        method: "POST",
        path: `/agents/${agentId}/guardrail`,
        body: { policyId },
      })
    ).attachment;
  }

  /** Read the guardrail attached to an agent (or null). */
  async getGuardrail(agentId: string): Promise<GuardrailAttachmentView | null> {
    return (
      await this.http.request<{ attachment: GuardrailAttachmentView | null }>({
        method: "GET",
        path: `/agents/${agentId}/guardrail`,
      })
    ).attachment;
  }

  /** Evaluate an enforcement gate (pre-tool / pre-egress / post-output). */
  async enforce(agentId: string, input: EnforceInput): Promise<EnforceResult> {
    return this.http.request<EnforceResult>({
      method: "POST",
      path: `/agents/${agentId}/guardrail/enforce`,
      body: input,
    });
  }

  /** Scan verdicts recorded against a run. */
  async listScans(runId: string): Promise<ScanResultView[]> {
    return (
      await this.http.request<{ scans: ScanResultView[] }>({
        method: "GET",
        path: "/scans",
        query: { runId },
      })
    ).scans;
  }

  /** Export a self-verifying compliance provenance bundle. */
  async complianceExport(
    opts: { agentId?: string; from?: string; to?: string } = {},
  ): Promise<ComplianceBundle> {
    return this.http.request<ComplianceBundle>({
      method: "GET",
      path: "/compliance/export",
      query: opts,
    });
  }
}
