import type { HttpClient } from "../core/http.js";
import { SilvanexumError } from "../core/errors.js";

/** "nvidia" = NIM on NVIDIA's hosted API catalog; "nim" = a self-hosted NIM. Both are OpenAI-compatible. */
export type MeterProvider = "openai" | "anthropic" | "google" | "nvidia" | "nim" | "other";

/** Normalized usage: inputTokens is ALL prompt tokens, cache subsets included. */
export interface MeterUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface MeterAttribution {
  agent?: string;
  customer?: string;
  traceId?: string;
}

export interface MeterEvent extends Partial<MeterUsage>, MeterAttribution {
  provider: MeterProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  status?: "success" | "error";
  /** ISO timestamp; must be within the last 7 days. Defaults to receipt time. */
  occurredAt?: string;
}

export type MeterCheckResult = { allowed: true } | { allowed: false; error?: string; message?: string; details?: unknown };

/** Thrown by `track({ check: true })` when a block-mode budget is exhausted. */
export class BudgetExceededError extends SilvanexumError {}

type Obj = Record<string, unknown>;
const num = (v: unknown): number => {
  const x = Math.floor(Number(v ?? 0));
  return Number.isFinite(x) && x > 0 ? x : 0;
};
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});

/** Read usage off an OpenAI / Anthropic / Gemini / NVIDIA NIM response (raw JSON or SDK object). */
export function usageFromResponse(provider: Exclude<MeterProvider, "other">, response: unknown): MeterUsage {
  const r = obj(response);
  switch (provider) {
    case "openai":
    case "nvidia":
    case "nim": {
      const u = obj(r.usage);
      return {
        inputTokens: num(u.prompt_tokens),
        outputTokens: num(u.completion_tokens),
        cacheReadTokens: num(obj(u.prompt_tokens_details).cached_tokens),
        cacheWriteTokens: 0,
      };
    }
    case "anthropic": {
      const u = obj(r.usage);
      const read = num(u.cache_read_input_tokens);
      const write = num(u.cache_creation_input_tokens);
      return { inputTokens: num(u.input_tokens) + read + write, outputTokens: num(u.output_tokens), cacheReadTokens: read, cacheWriteTokens: write };
    }
    case "google": {
      const u = obj(r.usageMetadata);
      return {
        inputTokens: num(u.promptTokenCount),
        outputTokens: num(u.candidatesTokenCount) + num(u.thoughtsTokenCount),
        cacheReadTokens: num(u.cachedContentTokenCount),
        cacheWriteTokens: 0,
      };
    }
  }
}

export interface TrackOptions extends MeterAttribution {
  /** Run `check()` first and throw BudgetExceededError instead of making the call. */
  check?: boolean;
  /** Surface reporting failures instead of logging them (default: never break the caller). */
  throwOnReportError?: boolean;
  /** Pull usage from what `fn` returned (default: `usageFromResponse` for known providers). */
  usage?: (result: unknown) => MeterUsage;
}

/**
 * SDK-only metering — `sx.meter.*`. No proxy in your request path: you call the
 * provider directly and report usage here; Silvanexum prices it, attributes it
 * to an agent and a customer, and enforces budgets through `check()`.
 *
 * ```ts
 * const msg = await sx.meter.track("anthropic", "claude-sonnet-5-5", { customer: "acme" },
 *   () => claude.messages.create({ model: "claude-sonnet-5-5", max_tokens: 1024, messages }));
 * ```
 */
export class MeterResource {
  constructor(private readonly http: HttpClient) {}

  /** Budget pre-flight. Resolves `{ allowed: false, ... }` (never throws) when a block budget is exhausted. */
  async check(opts: { agent?: string; customer?: string; model?: string; projectedCredits?: number } = {}): Promise<MeterCheckResult> {
    try {
      return await this.http.request<MeterCheckResult>({ method: "POST", path: "/meter/check", body: opts });
    } catch (e) {
      if (e instanceof SilvanexumError && e.status === 402) {
        return { allowed: false, ...(obj(e.body) as { error?: string; message?: string }) };
      }
      throw e;
    }
  }

  /** Report up to 500 calls. Priced server-side. */
  async record(events: MeterEvent | MeterEvent[]): Promise<{ recorded: number; costCredits: number }> {
    const list = Array.isArray(events) ? events : [events];
    return this.http.request({ method: "POST", path: "/meter/events", body: { events: list } });
  }

  /**
   * Run `fn` (your provider call), time it, read the usage off its result and
   * report it — as `error` if `fn` throws. `fn`'s result or error passes through
   * unchanged; a reporting failure is logged, not thrown (unless asked).
   */
  async track<T>(provider: MeterProvider, model: string, opts: TrackOptions, fn: () => Promise<T>): Promise<T> {
    if (opts.check) {
      const verdict = await this.check({ agent: opts.agent, customer: opts.customer, model });
      if (!verdict.allowed) {
        throw new BudgetExceededError(verdict.message ?? "Budget exhausted.", { status: 402, code: "budget_exceeded" });
      }
    }
    const t0 = Date.now();
    let result: T | undefined;
    let failed = false;
    try {
      result = await fn();
      return result;
    } catch (e) {
      failed = true;
      throw e;
    } finally {
      const usage: MeterUsage = failed
        ? { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
        : opts.usage
          ? opts.usage(result)
          : provider === "other"
            ? { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
            : usageFromResponse(provider, result);
      const report = this.record({
        provider,
        model,
        ...usage,
        latencyMs: Date.now() - t0,
        status: failed ? "error" : "success",
        agent: opts.agent,
        customer: opts.customer,
        traceId: opts.traceId,
      });
      if (opts.throwOnReportError) {
        await report;
      } else {
        await report.catch((err: unknown) => {
          console.warn(`[silvanexum] failed to report usage (${err instanceof Error ? err.message : String(err)}); the call itself was unaffected`);
        });
      }
    }
  }
}
