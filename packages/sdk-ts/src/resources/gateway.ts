import type { HttpClient } from "../core/http.js";

export interface GatewayUsageBreakdownRow {
  key: string | null;
  spentCredits: number;
  calls: number;
}

export interface GatewayUsage {
  totals: { spentCredits: number; calls: number };
  byModel: GatewayUsageBreakdownRow[];
  byAgent: GatewayUsageBreakdownRow[];
  byCustomer: GatewayUsageBreakdownRow[];
  recent: Array<{
    id: string;
    /** "gateway" (proxied) or "sdk" (reported via sx.meter). */
    source: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costCredits: string;
    status: string;
    traceId: string | null;
    agent: string | null;
    customer: string | null;
    /** True when the stream ended before the provider's final usage: tokens are estimated (~4 chars/token). */
    usageEstimated: boolean;
    createdAt: string;
  }>;
}

/**
 * Agent FinOps — zero-code spend capture via the gateway. `sx.gateway.*`
 *
 * Point your provider SDK's base URL at the matching method below and use your
 * Silvanexum API key as its key; every call (streaming or not) is metered on
 * your BYO provider key and counts toward org budgets. Optional headers
 * attribute a call: `x-silvanexum-customer`, `x-silvanexum-agent`,
 * `x-silvanexum-trace`:
 *
 * ```ts
 * import OpenAI from "openai";
 * const openai = new OpenAI({
 *   baseURL: sx.gateway.openaiBaseUrl(),
 *   apiKey: process.env.SILVANEXUM_API_KEY,
 *   defaultHeaders: { "x-silvanexum-trace": traceId },
 * });
 * ```
 *
 * Requires the gateway to be enabled on the deployment (GATEWAY_ENABLED). Rather
 * not proxy? Use `sx.meter` (SDK-only mode) instead.
 */
export class GatewayResource {
  constructor(private readonly http: HttpClient) {}

  /** Base URL to set as your OpenAI client's `baseURL`. */
  openaiBaseUrl(): string {
    return `${this.http.baseUrl}/gateway/openai/v1`;
  }

  /** Base URL for the Anthropic SDK's `baseURL` (Messages API). */
  anthropicBaseUrl(): string {
    return `${this.http.baseUrl}/gateway/anthropic`;
  }

  /** Base URL for Gemini (`generateContent` / `streamGenerateContent`). */
  googleBaseUrl(): string {
    return `${this.http.baseUrl}/gateway/google`;
  }

  /**
   * Base URL for NVIDIA NIM on the hosted API catalog (build.nvidia.com), set as
   * an OpenAI client's `baseURL`. Metered on the org's stored `nvapi-` key.
   */
  nvidiaBaseUrl(): string {
    return `${this.http.baseUrl}/gateway/nvidia/v1`;
  }

  /** Base URL for the deployment's self-hosted NIM (OpenAI client `baseURL`). */
  nimBaseUrl(): string {
    return `${this.http.baseUrl}/gateway/nim/v1`;
  }

  /** 30-day totals, per-model/agent/customer breakdowns and recent calls. */
  async usage(): Promise<GatewayUsage> {
    return this.http.request<GatewayUsage>({ method: "GET", path: "/gateway/usage" });
  }
}
