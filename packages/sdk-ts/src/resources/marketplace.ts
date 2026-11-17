import type { HttpClient } from "../core/http.js";
import type {
  CreateListingInput,
  InstallView,
  ListingCard,
  PurchaseResult,
} from "../generated/types.js";

/** Proof-ranked agent marketplace (M02). `sx.marketplace.*` */
export class MarketplaceResource {
  constructor(private readonly http: HttpClient) {}

  /** Search listings, ranked by proven outcomes (not stars). */
  async search(
    opts: { q?: string; sort?: "proof" | "recent" | "price"; category?: string } = {},
  ): Promise<ListingCard[]> {
    return (
      await this.http.request<{ results: ListingCard[] }>({
        method: "GET",
        path: "/marketplace/search",
        query: { sort: "proof", ...opts },
      })
    ).results;
  }

  /** Fetch one listing. */
  async getListing(id: string): Promise<ListingCard> {
    return (
      await this.http.request<{ listing: ListingCard }>({
        method: "GET",
        path: `/listings/${id}`,
      })
    ).listing;
  }

  /** List one of your agents on the marketplace. */
  async createListing(input: CreateListingInput): Promise<ListingCard> {
    return (
      await this.http.request<{ listing: ListingCard }>({
        method: "POST",
        path: "/listings",
        body: input,
      })
    ).listing;
  }

  /** Try a listing on sample input before buying. */
  async tryListing(
    id: string,
    input: string,
  ): Promise<{ runId: string; status: string; shareUrl: string }> {
    return this.http.request({
      method: "POST",
      path: `/listings/${id}/try`,
      body: { input },
    });
  }

  /**
   * Purchase/install a listing. Settles on the credit ledger. The
   * `idempotencyKey` is REQUIRED — it makes the charge exactly-once.
   */
  async purchase(id: string, idempotencyKey: string): Promise<PurchaseResult> {
    return this.http.request<PurchaseResult>({
      method: "POST",
      path: `/listings/${id}/purchase`,
      body: {},
      idempotencyKey,
    });
  }

  /** Listings installed by your org. */
  async myInstalls(): Promise<InstallView[]> {
    return (
      await this.http.request<{ installs: InstallView[] }>({ method: "GET", path: "/me/installs" })
    ).installs;
  }
}
