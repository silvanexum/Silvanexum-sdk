import type { HttpClient } from "../core/http.js";
import type {
  BranchView,
  BranchDetail,
  CreateBranchInput,
  UpdateBranchInput,
  BranchRerunInput,
  ExecutionView,
  PrView,
  PrDetail,
  OpenPrInput,
  CreatePrReviewInput,
  PrReviewView,
  CreateCommentInput,
  CommentView,
  CreateRunDiffInput,
  RunDiffView,
} from "../generated/types.js";

/**
 * Multiplayer Agent Studio (M07) — `sx.studio.*`.
 *
 * A git-grade branch / diff / pull-request flow over an agent's full definition,
 * plus the run-level diff promoted to a first-class artifact.
 */
export class StudioResource {
  constructor(private readonly http: HttpClient) {}

  /** List the open/closed branches of an agent. */
  async listBranches(agentId: string): Promise<BranchView[]> {
    return (
      await this.http.request<{ branches: BranchView[] }>({
        method: "GET",
        path: `/agents/${agentId}/branches`,
      })
    ).branches;
  }

  /** Fork an isolated, editable branch off an agent. */
  async createBranch(agentId: string, input: CreateBranchInput): Promise<BranchView> {
    return (
      await this.http.request<{ branch: BranchView }>({
        method: "POST",
        path: `/agents/${agentId}/branches`,
        body: input,
      })
    ).branch;
  }

  /** Fetch a branch + its (stubbed) realtime co-edit room. */
  async getBranch(id: string): Promise<BranchDetail> {
    return (
      await this.http.request<{ branch: BranchDetail }>({ method: "GET", path: `/branches/${id}` })
    ).branch;
  }

  /** Edit a branch's config / connectors / tools. */
  async updateBranch(id: string, input: UpdateBranchInput): Promise<BranchView> {
    return (
      await this.http.request<{ branch: BranchView }>({
        method: "PATCH",
        path: `/branches/${id}`,
        body: input,
      })
    ).branch;
  }

  /** Re-run the branch's carried input against the edited definition. */
  async rerunBranch(id: string, input: BranchRerunInput = {}): Promise<ExecutionView> {
    return (
      await this.http.request<{ execution: ExecutionView }>({
        method: "POST",
        path: `/branches/${id}/rerun`,
        body: input,
      })
    ).execution;
  }

  /** Open a pull request proposing a branch back into its base. */
  async openPr(branchId: string, input: OpenPrInput): Promise<PrView> {
    return (
      await this.http.request<{ pull: PrView }>({
        method: "POST",
        path: `/branches/${branchId}/pr`,
        body: input,
      })
    ).pull;
  }

  /** Fetch a PR: its config diff + run diff + reviews + threaded comments. */
  async getPr(id: string): Promise<PrDetail> {
    return (await this.http.request<{ pull: PrDetail }>({ method: "GET", path: `/pulls/${id}` }))
      .pull;
  }

  /** Submit a review verdict on a PR. */
  async reviewPr(id: string, input: CreatePrReviewInput): Promise<PrReviewView> {
    return (
      await this.http.request<{ review: PrReviewView }>({
        method: "POST",
        path: `/pulls/${id}/reviews`,
        body: input,
      })
    ).review;
  }

  /** Add a (optionally anchored / threaded) comment to a PR. */
  async commentPr(id: string, input: CreateCommentInput): Promise<CommentView> {
    return (
      await this.http.request<{ comment: CommentView }>({
        method: "POST",
        path: `/pulls/${id}/comments`,
        body: input,
      })
    ).comment;
  }

  /** Merge a PR — produces a new signed agent version. */
  async mergePr(id: string): Promise<PrView> {
    return (
      await this.http.request<{ pull: PrView }>({ method: "POST", path: `/pulls/${id}/merge` })
    ).pull;
  }

  /** Compute a deterministic, step-aligned run-level diff of two traces. */
  async createRunDiff(input: CreateRunDiffInput): Promise<RunDiffView> {
    return (
      await this.http.request<{ runDiff: RunDiffView }>({
        method: "POST",
        path: "/runs/diff",
        body: input,
      })
    ).runDiff;
  }

  /** Fetch a persisted run-level diff. */
  async getRunDiff(id: string): Promise<RunDiffView> {
    return (
      await this.http.request<{ runDiff: RunDiffView }>({ method: "GET", path: `/runs/diff/${id}` })
    ).runDiff;
  }

  /** Flip a run diff between private and public (scrubbed on share). */
  async setRunDiffVisibility(id: string, visibility: "private" | "public"): Promise<RunDiffView> {
    return (
      await this.http.request<{ runDiff: RunDiffView }>({
        method: "POST",
        path: `/runs/diff/${id}/visibility`,
        body: { visibility },
      })
    ).runDiff;
  }
}
