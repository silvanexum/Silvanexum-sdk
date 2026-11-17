import type { HttpClient } from "../core/http.js";
import type {
  WriteReviewInput,
  VerifiedReviewView,
  ReviewEligibilityView,
  ApplyCertificationInput,
  CertificationView,
  CertificationDetail,
  CertVerifyView,
  RevokeCertificationInput,
} from "../generated/types.js";

/**
 * Certification & Verified Reviews (M16) — `sx.certification.*`.
 *
 * Two anti-gaming trust surfaces: a verified review can only be written by an
 * operator the signed run corpus proves ran the agent; a certification is an
 * earned, signed, version-bound seal (eligibility → eval → audit → issue).
 */
export class CertificationResource {
  constructor(private readonly http: HttpClient) {}

  /** Write a verified review (requires verified-operator eligibility). */
  async writeReview(agentId: string, input: WriteReviewInput): Promise<VerifiedReviewView> {
    return (
      await this.http.request<{ review: VerifiedReviewView }>({
        method: "POST",
        path: `/agents/${agentId}/reviews`,
        body: input,
      })
    ).review;
  }

  /** Check whether the caller qualifies as a verified operator to review. */
  async reviewEligibility(agentId: string): Promise<ReviewEligibilityView> {
    return this.http.request<ReviewEligibilityView>({
      method: "GET",
      path: `/agents/${agentId}/reviews/eligibility`,
    });
  }

  /** Apply for a certification seal on a specific agent version. */
  async apply(input: ApplyCertificationInput): Promise<CertificationView> {
    return (
      await this.http.request<{ certification: CertificationView }>({
        method: "POST",
        path: "/certifications/apply",
        body: input,
      })
    ).certification;
  }

  /** Fetch a certification + its proofs (eval run + audit record). */
  async get(id: string): Promise<CertificationDetail> {
    return (
      await this.http.request<{ certification: CertificationDetail }>({
        method: "GET",
        path: `/certifications/${id}`,
      })
    ).certification;
  }

  /** List the certifications held by an agent. */
  async listForAgent(agentId: string): Promise<CertificationView[]> {
    return (
      await this.http.request<{ certifications: CertificationView[] }>({
        method: "GET",
        path: `/agents/${agentId}/certifications`,
      })
    ).certifications;
  }

  /** Re-check the signed certificate (validity + reason). */
  async verify(id: string): Promise<CertVerifyView> {
    return this.http.request<CertVerifyView>({
      method: "GET",
      path: `/certifications/${id}/verify`,
    });
  }

  /** Revoke a certification with a reason (a status transition, never a silent edit). */
  async revoke(id: string, input: RevokeCertificationInput): Promise<CertificationView> {
    return (
      await this.http.request<{ certification: CertificationView }>({
        method: "POST",
        path: `/certifications/${id}/revoke`,
        body: input,
      })
    ).certification;
  }
}
