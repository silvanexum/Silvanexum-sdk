import type { HttpClient } from "../core/http.js";
import type {
  AddSuiteCaseInput,
  CreateSuiteInput,
  SuiteCaseView,
  SuiteDetail,
  SuiteRunView,
  SuiteView,
} from "../generated/types.js";

/** Regression eval suites — the CI gate (M04). `sx.suites.*` */
export class SuitesResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<SuiteView[]> {
    return (await this.http.request<{ suites: SuiteView[] }>({ method: "GET", path: "/suites" }))
      .suites;
  }

  async get(id: string): Promise<SuiteDetail> {
    return (await this.http.request<{ suite: SuiteDetail }>({ method: "GET", path: `/suites/${id}` }))
      .suite;
  }

  async create(input: CreateSuiteInput): Promise<SuiteView> {
    return (
      await this.http.request<{ suite: SuiteView }>({ method: "POST", path: "/suites", body: input })
    ).suite;
  }

  async addCase(id: string, input: AddSuiteCaseInput): Promise<SuiteCaseView> {
    return (
      await this.http.request<{ case: SuiteCaseView }>({
        method: "POST",
        path: `/suites/${id}/cases`,
        body: input,
      })
    ).case;
  }

  async deleteCase(id: string, caseId: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/suites/${id}/cases/${caseId}` });
  }

  /** Run the suite. The returned run's `status` is the pass/fail gate result. */
  async run(id: string): Promise<SuiteRunView> {
    return (
      await this.http.request<{ run: SuiteRunView }>({ method: "POST", path: `/suites/${id}/run` })
    ).run;
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>({ method: "DELETE", path: `/suites/${id}` });
  }
}
