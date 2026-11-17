import type { HttpClient } from "../core/http.js";
import type { BillingView } from "../generated/types.js";

/**
 * Billing (R4 — plan & subscription). `sx.billing.*`
 *
 * The plan gates the Team/Enterprise features (block-mode budgets, mesh
 * delegation, chargeback exports, unlimited connectors). Read the org's plan
 * and entitlements, or start a Stripe Checkout to subscribe to Team.
 *
 * Note: `entitlements.maxConnectors === -1` means unlimited (JSON can't carry
 * Infinity).
 */
export class BillingResource {
  constructor(private readonly http: HttpClient) {}

  /** The org's current plan + resolved entitlements. */
  async get(): Promise<BillingView> {
    return this.http.request<BillingView>({ method: "GET", path: "/billing" });
  }

  /**
   * Start a Stripe Checkout for the Team seat subscription. Returns the hosted
   * checkout URL to redirect the user to; the plan flips to the purchased tier only after
   * Stripe confirms payment (verified webhook). 501 if Stripe isn't configured.
   */
  async subscribe(
    input: { plan?: "team" | "scale" } = {},
  ): Promise<{ checkoutUrl: string; plan: "team" | "scale" }> {
    return this.http.request<{ checkoutUrl: string; plan: "team" | "scale" }>({
      method: "POST",
      path: "/billing/subscribe",
      body: { plan: input.plan ?? "team" },
    });
  }
}
