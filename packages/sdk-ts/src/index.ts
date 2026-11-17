/**
 * @silvanexum/sdk — official TypeScript/JavaScript SDK for Silvanexum.
 *
 * All request/response types are GENERATED from the API's Zod contracts
 * (see packages/codegen) and re-exported here, so they can never drift from
 * the live API.
 */
export { Silvanexum } from "./client.js";
export type { ClientOptions, RequestOptions, FetchLike } from "./core/http.js";

export {
  SilvanexumError,
  APIConnectionError,
  APITimeoutError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InsufficientCreditsError,
  InternalServerError,
} from "./core/errors.js";
export type { ErrorBody } from "./core/errors.js";
export { BudgetExceededError, usageFromResponse } from "./resources/meter.js";
export type { MeterEvent, MeterUsage, MeterProvider, MeterCheckResult, TrackOptions } from "./resources/meter.js";

// Generated domain types — the single source of truth.
export type * from "./generated/types.js";

import { Silvanexum } from "./client.js";
export default Silvanexum;
