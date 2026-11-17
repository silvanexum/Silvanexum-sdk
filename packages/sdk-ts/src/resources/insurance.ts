import type { HttpClient } from "../core/http.js";
import type {
  QuotePolicyInput,
  BindPolicyInput,
  PolicyQuoteView,
  PolicyView,
  SlaStanding,
  FileClaimInput,
  ClaimView,
  RiskScoreView,
} from "../generated/types.js";

type PolicyStatus = PolicyView["status"];
type ClaimStatus = ClaimView["status"];

/** Agent insurance, SLAs & claims underwritten from signed runs (M13). `sx.insurance.*` */
export class InsuranceResource {
  constructor(private readonly http: HttpClient) {}

  /** List policies, optionally filtered by status. */
  async listPolicies(
    opts: { status?: PolicyStatus; limit?: number; cursor?: string } = {},
  ): Promise<PolicyView[]> {
    return (
      await this.http.request<{ policies: PolicyView[]; nextCursor: string | null }>({
        method: "GET",
        path: "/policies",
        query: opts,
      })
    ).policies;
  }

  /** Quote a policy — prices a risk score from the agent's signed run history. */
  async quote(input: QuotePolicyInput): Promise<PolicyQuoteView> {
    return (
      await this.http.request<{ quote: PolicyQuoteView }>({
        method: "POST",
        path: "/policies",
        body: input,
      })
    ).quote;
  }

  /** Bind a previously-quoted policy (charges the premium via the M10 ledger). */
  async bind(input: BindPolicyInput): Promise<PolicyView> {
    return (
      await this.http.request<{ policy: PolicyView }>({
        method: "POST",
        path: "/policies",
        body: input,
      })
    ).policy;
  }

  /** Fetch one policy. */
  async getPolicy(id: string): Promise<PolicyView> {
    return (
      await this.http.request<{ policy: PolicyView }>({ method: "GET", path: `/policies/${id}` })
    ).policy;
  }

  /** Live SLA standing for each term over its measurement window. */
  async getPolicySla(id: string): Promise<SlaStanding[]> {
    return (
      await this.http.request<{ slaTerms: SlaStanding[] }>({
        method: "GET",
        path: `/policies/${id}/sla`,
      })
    ).slaTerms;
  }

  /** File a manual claim against a policy's SLA term. */
  async fileClaim(input: FileClaimInput): Promise<ClaimView> {
    return (
      await this.http.request<{ claim: ClaimView }>({
        method: "POST",
        path: "/claims",
        body: input,
      })
    ).claim;
  }

  /** List claims, optionally filtered by policy or status. */
  async listClaims(
    opts: { policyId?: string; status?: ClaimStatus; limit?: number } = {},
  ): Promise<ClaimView[]> {
    return (
      await this.http.request<{ claims: ClaimView[] }>({
        method: "GET",
        path: "/claims",
        query: opts,
      })
    ).claims;
  }

  /** Fetch one claim (with its replayable adjudication record). */
  async getClaim(id: string): Promise<ClaimView> {
    return (
      await this.http.request<{ claim: ClaimView }>({ method: "GET", path: `/claims/${id}` })
    ).claim;
  }

  /** The current risk score for an agent (re-priced from signed runs). */
  async getAgentRisk(agentId: string): Promise<RiskScoreView> {
    return (
      await this.http.request<{ riskScore: RiskScoreView }>({
        method: "GET",
        path: `/agents/${agentId}/risk`,
      })
    ).riskScore;
  }
}
