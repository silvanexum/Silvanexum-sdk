import type { HttpClient } from "../core/http.js";
import type {
  BenchmarkDetail,
  BenchmarkRunView,
  BenchmarkView,
  CreateBenchmarkInput,
  CreateEvalDatasetInput,
  EvalDatasetView,
  LeaderboardEntryView,
  SubmitBenchmarkInput,
} from "../generated/types.js";

/** Public, cross-vendor eval benchmarks & leaderboards (M05). `sx.proving.*` */
export class ProvingResource {
  constructor(private readonly http: HttpClient) {}

  /** Create an evaluation dataset (inline cases or an object-store ref). */
  async createDataset(input: CreateEvalDatasetInput): Promise<EvalDatasetView> {
    return (
      await this.http.request<{ dataset: EvalDatasetView }>({
        method: "POST",
        path: "/eval-datasets",
        body: input,
      })
    ).dataset;
  }

  /** Create a benchmark over a dataset. */
  async createBenchmark(input: CreateBenchmarkInput): Promise<BenchmarkView> {
    return (
      await this.http.request<{ benchmark: BenchmarkView }>({
        method: "POST",
        path: "/benchmarks",
        body: input,
      })
    ).benchmark;
  }

  /** Fetch a benchmark plus its recent runs. */
  async getBenchmark(id: string): Promise<BenchmarkDetail> {
    return (
      await this.http.request<{ benchmark: BenchmarkDetail }>({
        method: "GET",
        path: `/benchmarks/${id}`,
      })
    ).benchmark;
  }

  /** Submit an agent version to run against a benchmark. */
  async submit(id: string, input: SubmitBenchmarkInput): Promise<BenchmarkRunView> {
    return (
      await this.http.request<{ run: BenchmarkRunView }>({
        method: "POST",
        path: `/benchmarks/${id}/submit`,
        body: input,
      })
    ).run;
  }

  /** Read a benchmark run (status + per-case results). */
  async getRun(id: string): Promise<BenchmarkRunView> {
    return (
      await this.http.request<{ run: BenchmarkRunView }>({
        method: "GET",
        path: `/benchmark-runs/${id}`,
      })
    ).run;
  }

  /** The ranked leaderboard for a benchmark category. */
  async leaderboard(category: string, opts: { limit?: number } = {}): Promise<LeaderboardEntryView[]> {
    return (
      await this.http.request<{ entries: LeaderboardEntryView[] }>({
        method: "GET",
        path: `/leaderboards/${encodeURIComponent(category)}`,
        query: opts,
      })
    ).entries;
  }
}
