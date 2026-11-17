// Pure FinOps helpers — NO `vscode` import so they can be unit-tested directly
// with node:test. Rendering (icons/colors) stays in tree.ts; this file only maps
// data → semantic tokens and does math on the decimal-string credit fields.

import { ApiError, type BudgetState, type MeshCallView } from "./api.js";

/**
 * Format a credit amount for display. Backend sends credits as decimal STRINGS
 * (numeric(20,6)); coerce, then group. Null / unparseable → an em dash.
 */
export function fmtCredits(value: string | number | null | undefined, digits = 2): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Credits × the wallet's USD rate → a "$1.23" string, or null if no rate. */
export function creditsToUsd(credits: string | number | null | undefined, rateUsd: number | null | undefined): string | null {
  if (credits == null || rateUsd == null || !Number.isFinite(rateUsd)) return null;
  const n = typeof credits === "number" ? credits : Number(credits);
  if (!Number.isFinite(n)) return null;
  return (n * rateUsd).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/** Semantic tone for a budget's state — consumed by the tree to pick an icon/color. */
export function budgetTone(state: BudgetState): "ok" | "warn" | "error" {
  switch (state) {
    case "exceeded":
      return "error";
    case "warn":
      return "warn";
    default:
      return "ok";
  }
}

/** A compact "82% · block" style descriptor for a budget row. */
export function budgetSummary(usedPct: number, enforcement: string): string {
  const pct = Number.isFinite(usedPct) ? Math.round(usedPct) : 0;
  return `${pct}% · ${enforcement}`;
}

export interface HopNode {
  call: MeshCallView;
  children: HopNode[];
}

/**
 * Assemble a hop forest from a flat list of mesh calls using parentCallId. The
 * web UI only renders a flat table; the moat is the *tree*, so we reconstruct it.
 * Orphans (parent not present in the set) are treated as roots so nothing is lost.
 * Stable: preserves input order among siblings; guards against cycles.
 */
export function buildHopTree(calls: MeshCallView[]): HopNode[] {
  const byId = new Map<string, HopNode>();
  for (const call of calls) byId.set(call.id, { call, children: [] });

  const roots: HopNode[] = [];
  for (const call of calls) {
    const node = byId.get(call.id)!;
    const parent = call.parentCallId ? byId.get(call.parentCallId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * Did a request fail because a `block`-mode budget is exhausted? The backend
 * pre-flights runs and returns 402 { error: "budget_exceeded" }. We surface that
 * as actionable guidance instead of a raw error.
 */
export function isBudgetExceeded(e: unknown): boolean {
  return e instanceof ApiError && (e.code === "budget_exceeded" || e.status === 402);
}

/**
 * Did a run fail because no provider (AI model) API key is configured for the
 * account whose key would execute it? The extension surfaces this with a button
 * that opens Settings → Keys instead of a raw error.
 */
export function isNoProviderKey(e: unknown): boolean {
  return e instanceof ApiError && (e.code === "no_provider_key" || e.code === "seller_has_no_provider_key");
}
