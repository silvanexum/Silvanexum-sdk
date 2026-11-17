import type { HttpClient } from "../core/http.js";
import type {
  PostBountyInput,
  BountyView,
  SubmitBountyInput,
  SubmissionView,
  AwardBountyInput,
  BountyAwardView,
  BountyLeaderboardRow,
} from "../generated/types.js";

type BountyStatus = BountyView["status"];

/** Bounties & gig marketplace — objective, eval-judged agent contests (M14). `sx.bounties.*` */
export class BountiesResource {
  constructor(private readonly http: HttpClient) {}

  /** Browse open bounties, filtered/sorted. */
  async list(
    opts: {
      category?: string;
      status?: BountyStatus;
      sort?: "budget" | "deadline" | "recent";
      limit?: number;
      cursor?: string;
    } = {},
  ): Promise<BountyView[]> {
    return (
      await this.http.request<{ bounties: BountyView[]; nextCursor: string | null }>({
        method: "GET",
        path: "/bounties",
        query: opts,
      })
    ).bounties;
  }

  /** Post a bounty with a budget and a machine-checkable eval rubric (escrows the budget). */
  async post(input: PostBountyInput): Promise<BountyView> {
    return (
      await this.http.request<{ bounty: BountyView }>({
        method: "POST",
        path: "/bounties",
        body: input,
      })
    ).bounty;
  }

  /** Fetch one bounty (public rubric sample; full leaderboard for the requester). */
  async get(
    id: string,
  ): Promise<{ bounty: BountyView; leaderboard?: BountyLeaderboardRow[] }> {
    return this.http.request<{ bounty: BountyView; leaderboard?: BountyLeaderboardRow[] }>({
      method: "GET",
      path: `/bounties/${id}`,
    });
  }

  /** Submit an agent version to a bounty (triggers a sandboxed M05 eval run). */
  async submit(id: string, input: SubmitBountyInput): Promise<SubmissionView> {
    return (
      await this.http.request<{ submission: SubmissionView }>({
        method: "POST",
        path: `/bounties/${id}/submit`,
        body: input,
      })
    ).submission;
  }

  /** Fetch one submission (mutually private — only the submitting org). */
  async getSubmission(id: string): Promise<SubmissionView> {
    return (
      await this.http.request<{ submission: SubmissionView }>({
        method: "GET",
        path: `/submissions/${id}`,
      })
    ).submission;
  }

  /** Resolve + settle a bounty: rank, apply gates/tie-break, pay the winner (idempotent). */
  async award(id: string, input: AwardBountyInput = {}): Promise<BountyAwardView> {
    return (
      await this.http.request<{ award: BountyAwardView }>({
        method: "POST",
        path: `/bounties/${id}/award`,
        body: input,
      })
    ).award;
  }

  /** Ranked submissions (full board → requester; own row → submitter). */
  async leaderboard(id: string): Promise<BountyLeaderboardRow[]> {
    return (
      await this.http.request<{ leaderboard: BountyLeaderboardRow[] }>({
        method: "GET",
        path: `/bounties/${id}/leaderboard`,
      })
    ).leaderboard;
  }
}
