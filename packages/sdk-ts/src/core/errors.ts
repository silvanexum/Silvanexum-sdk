/** Typed error hierarchy. Catch `SilvanexumError` to handle any API failure. */

export interface ErrorBody {
  message?: string;
  error?: string;
  code?: string;
  [k: string]: unknown;
}

export class SilvanexumError extends Error {
  /** HTTP status, or null for connection/timeout failures. */
  readonly status: number | null;
  /** Machine-readable code, when the API provides one. */
  readonly code: string | undefined;
  /** Raw parsed error body, if any. */
  readonly body: ErrorBody | undefined;
  /** Request id from the `x-request-id` response header, for support. */
  readonly requestId: string | undefined;

  constructor(
    message: string,
    opts: { status?: number | null; code?: string; body?: ErrorBody; requestId?: string } = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.status = opts.status ?? null;
    this.code = opts.code;
    this.body = opts.body;
    this.requestId = opts.requestId;
  }
}

export class APIConnectionError extends SilvanexumError {}
export class APITimeoutError extends APIConnectionError {}
export class AuthenticationError extends SilvanexumError {} // 401
export class PermissionError extends SilvanexumError {} // 403 — usually a missing key scope
export class NotFoundError extends SilvanexumError {} // 404
export class ValidationError extends SilvanexumError {} // 400 / 422
export class RateLimitError extends SilvanexumError {} // 429
export class InsufficientCreditsError extends SilvanexumError {} // 402
export class InternalServerError extends SilvanexumError {} // 5xx

/** Map an HTTP status + body to the most specific error class. */
export function errorFromResponse(
  status: number,
  body: ErrorBody | undefined,
  requestId: string | undefined,
): SilvanexumError {
  const message =
    body?.message || body?.error || `Silvanexum API error (HTTP ${status})`;
  const opts = { status, code: body?.code, body, requestId };
  switch (status) {
    case 400:
    case 422:
      return new ValidationError(message, opts);
    case 401:
      return new AuthenticationError(message, opts);
    case 402:
      return new InsufficientCreditsError(message, opts);
    case 403:
      return new PermissionError(message, opts);
    case 404:
      return new NotFoundError(message, opts);
    case 429:
      return new RateLimitError(message, opts);
    default:
      if (status >= 500) return new InternalServerError(message, opts);
      return new SilvanexumError(message, opts);
  }
}
