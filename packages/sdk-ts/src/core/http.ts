/** The transport core: config, request building, retries, timeouts, errors. */
import {
  APIConnectionError,
  APITimeoutError,
  errorFromResponse,
  RateLimitError,
  SilvanexumError,
  type ErrorBody,
} from "./errors.js";

/** Minimal fetch type so we don't depend on DOM/node-fetch specifics. */
export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

export interface ClientOptions {
  /**
   * Your Silvanexum API key (`sx_live_...`). Defaults to the
   * `SILVANEXUM_API_KEY` environment variable.
   */
  apiKey?: string;
  /** API base URL. Defaults to `SILVANEXUM_BASE_URL` or the production host. */
  baseUrl?: string;
  /** Per-request timeout in ms. Default 60_000. */
  timeoutMs?: number;
  /** Retries for 429 / 5xx / connection errors. Default 2. */
  maxRetries?: number;
  /** Inject a custom fetch (tests, proxies, edge runtimes). */
  fetch?: FetchLike;
  /** Extra headers sent on every request. */
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Sets the `idempotency-key` header (purchases, payouts, deploys). */
  idempotencyKey?: string;
  headers?: Record<string, string>;
  /** Per-call override of the AbortSignal. */
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = "https://api.silvanexum.com";
/** Kept in step with package.json so the User-Agent reports the real version. */
const SDK_VERSION = "0.3.0";
const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);

function resolveFetch(custom?: FetchLike): FetchLike {
  if (custom) return custom;
  const g = globalThis as { fetch?: FetchLike };
  if (!g.fetch) {
    throw new SilvanexumError(
      "No global fetch found. Use Node >=20, or pass a `fetch` implementation to the client.",
    );
  }
  return g.fetch.bind(globalThis) as FetchLike;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class HttpClient {
  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetch: FetchLike;
  private readonly defaultHeaders: Record<string, string>;

  constructor(opts: ClientOptions = {}) {
    const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string>;
    const apiKey = opts.apiKey ?? env.SILVANEXUM_API_KEY ?? "";
    if (!apiKey) {
      throw new SilvanexumError(
        "Missing API key. Pass `apiKey` or set the SILVANEXUM_API_KEY environment variable. " +
          "Get a free key (read+run scopes) at https://silvanexum.com/signup",
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = (opts.baseUrl ?? env.SILVANEXUM_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.fetch = resolveFetch(opts.fetch);
    this.defaultHeaders = opts.defaultHeaders ?? {};
  }

  /**
   * Reject a request path that could escape its intended endpoint. Resource
   * methods interpolate ids straight into the path (e.g. `/agents/${id}`); an id
   * like `../budgets/x` or one containing `?`/`#` would otherwise redirect the
   * call — carrying the caller's bearer token — to a different endpoint. This is
   * the confused-deputy guard that matters most when an MCP/LLM supplies the id.
   */
  private assertSafePath(path: string): void {
    if (
      !path.startsWith("/") ||
      path.includes("..") ||
      path.includes("\\") ||
      path.includes("#") ||
      /%2e|%2f|%5c/i.test(path)
    ) {
      throw new SilvanexumError(`Invalid request path: ${path}`);
    }
  }

  private url(path: string, query?: RequestOptions["query"]): string {
    this.assertSafePath(path);
    let qs = "";
    if (query) {
      const params: string[] = [];
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        params.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
      if (params.length) qs = `?${params.join("&")}`;
    }
    return `${this.baseUrl}${path}${qs}`;
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "User-Agent": `silvanexum-sdk-js/${SDK_VERSION}`,
      ...this.defaultHeaders,
      ...opts.headers,
    };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;

    const url = this.url(opts.path, opts.query);
    const body = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;

    // Auto-retry only when a retry cannot duplicate a side effect: HTTP-idempotent
    // methods, or any request carrying an idempotency-key (the server dedups it).
    // A bare POST/PATCH (e.g. runs.create, mesh.call without a key) is NOT retried
    // — a transient 5xx/timeout must not silently create a second run or hop.
    const method = opts.method.toUpperCase();
    const retriable =
      ["GET", "HEAD", "DELETE", "PUT"].includes(method) || opts.idempotencyKey !== undefined;
    const maxAttempts = retriable ? this.maxRetries : 0;

    let lastErr: SilvanexumError | undefined;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      // The timeout must fire even when the caller passes its own signal — combine
      // both so an external signal never disables our timeout.
      const signal = opts.signal
        ? AbortSignal.any([opts.signal, controller.signal])
        : controller.signal;
      try {
        const res = await this.fetch(url, { method: opts.method, headers, body, signal });
        clearTimeout(timer);
        const requestId = res.headers.get("x-request-id") ?? undefined;

        if (res.ok) {
          if (res.status === 204) return undefined as T;
          const text = await res.text();
          return (text ? JSON.parse(text) : undefined) as T;
        }

        const parsed = await safeJson(res.text());
        const err = errorFromResponse(res.status, parsed, requestId);
        if (RETRYABLE.has(res.status) && attempt < maxAttempts) {
          lastErr = err;
          await sleep(backoffMs(attempt, err));
          continue;
        }
        throw err;
      } catch (e) {
        clearTimeout(timer);
        // A decided SilvanexumError (non-retryable, or attempts exhausted) is final.
        if (e instanceof SilvanexumError) throw e;
        // Network/abort failures.
        const aborted = (e as { name?: string })?.name === "AbortError";
        lastErr = aborted
          ? new APITimeoutError(`Request timed out after ${this.timeoutMs}ms.`)
          : new APIConnectionError(
              `Could not reach ${this.baseUrl}. ${(e as Error)?.message ?? ""}`.trim(),
            );
        if (attempt < maxAttempts) {
          await sleep(backoffMs(attempt));
          continue;
        }
        throw lastErr;
      }
    }
    throw lastErr ?? new APIConnectionError("Request failed.");
  }
}

function backoffMs(attempt: number, err?: SilvanexumError): number {
  // Honor Retry-After-ish hints surfaced on rate-limit errors; else exp backoff.
  if (err instanceof RateLimitError) {
    const retryAfter = Number((err.body as ErrorBody | undefined)?.["retryAfter"]);
    if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  }
  const base = 500 * 2 ** attempt;
  return base + Math.floor(base * 0.25 * pseudoJitter(attempt));
}

// Deterministic-ish jitter without Math.random (works in restricted runtimes).
function pseudoJitter(attempt: number): number {
  const x = Math.sin(attempt + 1) * 10_000;
  return x - Math.floor(x);
}

async function safeJson(textPromise: Promise<string>): Promise<ErrorBody | undefined> {
  try {
    const t = await textPromise;
    return t ? (JSON.parse(t) as ErrorBody) : undefined;
  } catch {
    return undefined;
  }
}
