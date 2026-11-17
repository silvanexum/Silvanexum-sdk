import type { HttpClient } from "../core/http.js";
import type {
  BuyCreditsResult,
  LedgerPage,
  PayoutAccountView,
  PayoutView,
  WalletView,
} from "../generated/types.js";

/** Credits, ledger, and payouts (M10). `sx.wallet.*` */
export class WalletResource {
  constructor(private readonly http: HttpClient) {}

  /** Wallet balance + recent ledger entries. */
  async get(): Promise<WalletView> {
    return this.http.request<WalletView>({ method: "GET", path: "/wallet" });
  }

  /** Paged ledger entries (cursor = createdAt of the last seen entry). */
  async ledger(opts: { limit?: number; cursor?: string } = {}): Promise<LedgerPage> {
    return this.http.request<LedgerPage>({
      method: "GET",
      path: "/wallet/ledger",
      query: { limit: opts.limit ?? 50, cursor: opts.cursor },
    });
  }

  /** Buy credits. Returns a hosted Stripe Checkout URL to redirect the buyer to. */
  async buyCredits(credits: number): Promise<BuyCreditsResult> {
    return this.http.request<BuyCreditsResult>({
      method: "POST",
      path: "/wallet/credits/purchase",
      body: { credits },
    });
  }

  /** Your Stripe Connect payout account (null until onboarding begins). */
  async getPayoutAccount(): Promise<PayoutAccountView | null> {
    return (
      await this.http.request<{ account: PayoutAccountView | null }>({
        method: "GET",
        path: "/payout-accounts",
      })
    ).account;
  }

  /** Begin Stripe Connect onboarding (returns an account with an onboarding URL). */
  async startPayoutOnboarding(): Promise<PayoutAccountView> {
    return (
      await this.http.request<{ account: PayoutAccountView }>({
        method: "POST",
        path: "/payout-accounts",
      })
    ).account;
  }

  /** List payouts. */
  async listPayouts(): Promise<PayoutView[]> {
    return (await this.http.request<{ payouts: PayoutView[] }>({ method: "GET", path: "/payouts" }))
      .payouts;
  }

  /** Request a payout. The `idempotencyKey` is REQUIRED (exactly-once). */
  async createPayout(amountCredits: number, idempotencyKey: string): Promise<PayoutView> {
    return (
      await this.http.request<{ payout: PayoutView }>({
        method: "POST",
        path: "/payouts",
        body: { amountCredits },
        idempotencyKey,
      })
    ).payout;
  }
}
