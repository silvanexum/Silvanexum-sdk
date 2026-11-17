import * as vscode from "vscode";
import type {
  Api,
  Listing,
  Agent,
  Template,
  BudgetStatusView,
  SpendingGroupBy,
  MeshCallView,
  FleetAgentRow,
} from "./api.js";
import { budgetSummary, budgetTone, buildHopTree, fmtCredits, type HopNode } from "./finops.js";

// ── Silvanexum sidebar ──────────────────────────────────────────────────────
// FinOps-first ("spend control for AI agents"): the sidebar LEADS with Spend /
// Budgets / Mesh / Fleet, then the proof-ranked Marketplace / My Agents /
// Templates. Each view is lazy and refreshable; all gracefully empty when signed
// out. FinOps views read from /spending, /budgets, /mesh, /fleet.

type NodeKind =
  | "message"
  | "listing"
  | "agent"
  | "template"
  | "budget"
  | "spendRow"
  | "hop"
  | "fleetAgent";

export class SxNode extends vscode.TreeItem {
  /** For mesh hop nodes: the subtree beneath this hop (children rendered lazily). */
  hop?: HopNode;
  /** A signed run id this node links to (mesh hops / fleet agents). */
  runId?: string;

  constructor(
    readonly kind: NodeKind,
    label: string,
    collapsible: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    readonly payloadId?: string,
  ) {
    super(label, collapsible);
  }
}

/** Map a semantic tone to a VS Code chart color for tinted tree icons. */
function toneColor(tone: "ok" | "warn" | "error"): vscode.ThemeColor {
  const id = tone === "error" ? "charts.red" : tone === "warn" ? "charts.yellow" : "charts.green";
  return new vscode.ThemeColor(id);
}

/** Shared base: fetches a list lazily, renders message nodes for empty/signed-out. */
abstract class SxProvider implements vscode.TreeDataProvider<SxNode> {
  protected readonly onChange = new vscode.EventEmitter<SxNode | undefined | void>();
  readonly onDidChangeTreeData = this.onChange.event;

  constructor(
    protected readonly getApi: () => Api,
    protected readonly isSignedIn: () => boolean,
  ) {}

  refresh(): void {
    this.onChange.fire();
  }

  getTreeItem(node: SxNode): vscode.TreeItem {
    return node;
  }

  abstract getChildren(node?: SxNode): Promise<SxNode[]>;

  protected signedOut(): SxNode[] {
    const n = new SxNode("message", "Sign in to Silvanexum…");
    n.command = { command: "silvanexum.signIn", title: "Sign In" };
    n.iconPath = new vscode.ThemeIcon("account");
    return [n];
  }

  protected empty(text: string): SxNode[] {
    return [new SxNode("message", text)];
  }

  protected error(e: unknown): SxNode[] {
    const n = new SxNode("message", e instanceof Error ? e.message : String(e));
    n.iconPath = new vscode.ThemeIcon("warning");
    return [n];
  }
}

// ── Marketplace (proof-ranked listings) ─────────────────────────────────────
export class MarketplaceProvider extends SxProvider {
  private query = "";

  setQuery(q: string): void {
    this.query = q;
    this.refresh();
  }

  async getChildren(node?: SxNode): Promise<SxNode[]> {
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();
    let results: Listing[];
    try {
      results = await this.getApi().searchMarketplace(this.query);
    } catch (e) {
      return this.error(e);
    }
    if (results.length === 0) return this.empty(this.query ? "No listings matched." : "No listings yet.");
    return results.map((r) => {
      const n = new SxNode("listing", r.title, vscode.TreeItemCollapsibleState.None, r.agentId);
      n.description = `proof ${Math.round(r.proofScore)} · ${r.proof.totalRuns} runs`;
      n.tooltip = new vscode.MarkdownString(
        `**${r.title}**\n\n` +
          `category: \`${r.category}\`\n\n` +
          `proof score **${Math.round(r.proofScore)}** · trust ${r.proof.trustScore ?? "—"} · ` +
          `${r.proof.totalRuns} runs (${r.proof.confidence})`,
      );
      n.iconPath = new vscode.ThemeIcon("verified");
      n.contextValue = "sxListing";
      n.command = { command: "silvanexum.runAgent", title: "Run", arguments: [r.agentId] };
      return n;
    });
  }
}

// ── My Agents (org agents + run-corpus headline) ────────────────────────────
export class MyAgentsProvider extends SxProvider {
  async getChildren(node?: SxNode): Promise<SxNode[]> {
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();
    let agents: Agent[];
    try {
      // Org-scoped: "My Agents" must show only the caller's own agents, not the
      // public marketplace (that's the Marketplace view). See /agents vs /agents/mine.
      agents = await this.getApi().listMyAgents();
    } catch (e) {
      return this.error(e);
    }
    if (agents.length === 0) return this.empty("No agents in your org yet.");
    return agents.map((a) => {
      const n = new SxNode("agent", a.name, vscode.TreeItemCollapsibleState.None, a.id);
      const rep = a.reputation;
      n.description = rep && rep.totalRuns > 0
        ? `${rep.trustScore ?? "—"} trust · ${rep.totalRuns} runs`
        : "no runs yet";
      n.tooltip = `${a.config.provider}/${a.config.model}`;
      n.iconPath = new vscode.ThemeIcon("robot");
      n.contextValue = "sxAgent";
      n.command = { command: "silvanexum.runAgent", title: "Run", arguments: [a.id] };
      return n;
    });
  }
}

// ── Templates (M11 deployable verticals) ────────────────────────────────────
export class TemplatesProvider extends SxProvider {
  async getChildren(node?: SxNode): Promise<SxNode[]> {
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();
    let templates: Template[];
    try {
      templates = await this.getApi().listTemplates();
    } catch {
      return this.empty("Templates not enabled (M11).");
    }
    if (templates.length === 0) return this.empty("No templates available.");
    return templates.map((t) => {
      const n = new SxNode("template", t.displayName, vscode.TreeItemCollapsibleState.None, t.id);
      n.description = t.vertical;
      n.iconPath = new vscode.ThemeIcon("cloud-download");
      n.contextValue = "sxTemplate";
      n.command = { command: "silvanexum.deployTemplate", title: "Deploy", arguments: [t.id] };
      return n;
    });
  }
}

// ── Budgets (spend caps — the "control" surface) ─────────────────────────────
export class BudgetsProvider extends SxProvider {
  async getChildren(node?: SxNode): Promise<SxNode[]> {
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();
    let budgets: BudgetStatusView[];
    try {
      budgets = await this.getApi().listBudgets();
    } catch (e) {
      return this.error(e);
    }
    if (budgets.length === 0) {
      const n = new SxNode("message", "No budgets — set a spend cap");
      n.iconPath = new vscode.ThemeIcon("add");
      n.command = { command: "silvanexum.createBudget", title: "Create Budget" };
      return [n];
    }
    return budgets.map((b) => {
      const tone = budgetTone(b.state);
      const n = new SxNode("budget", b.budget.name, vscode.TreeItemCollapsibleState.None, b.budget.id);
      n.description = `${budgetSummary(b.usedPct, b.budget.enforcement)} · ${fmtCredits(b.spentCredits)}/${fmtCredits(b.limitCredits)} cr`;
      n.tooltip = new vscode.MarkdownString(
        `**${b.budget.name}** — ${b.budget.scopeType} · ${b.budget.periodType}\n\n` +
          `spent **${fmtCredits(b.spentCredits)}** / ${fmtCredits(b.limitCredits)} cr ` +
          `(**${Math.round(b.usedPct)}%**, ${b.state})\n\n` +
          `remaining ${fmtCredits(b.remainingCredits)} cr · enforcement \`${b.budget.enforcement}\``,
      );
      n.iconPath = new vscode.ThemeIcon(
        b.state === "exceeded" ? "error" : b.state === "warn" ? "warning" : "pass",
        toneColor(tone),
      );
      n.contextValue = "sxBudget";
      return n;
    });
  }
}

// ── Spend (cost attribution, group-by pivot) ─────────────────────────────────
export class SpendProvider extends SxProvider {
  private groupBy: SpendingGroupBy = "agent";

  setGroupBy(g: SpendingGroupBy): void {
    this.groupBy = g;
    this.refresh();
  }
  get currentGroupBy(): SpendingGroupBy {
    return this.groupBy;
  }

  async getChildren(node?: SxNode): Promise<SxNode[]> {
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();
    let rows;
    try {
      rows = await this.getApi().spendingSummary({ groupBy: this.groupBy, from: "-30d" });
    } catch (e) {
      return this.error(e);
    }
    if (rows.length === 0) return this.empty("No spend in the last 30 days.");

    const total = rows.reduce((s, r) => s + (Number(r.costCredits) || 0), 0);
    const header = new SxNode("message", `30d · ${fmtCredits(total)} cr · by ${this.groupBy}`);
    header.iconPath = new vscode.ThemeIcon("graph");
    header.tooltip = "Click the group-by button in the view title to change grouping.";

    const items = rows.map((r) => {
      const n = new SxNode("spendRow", r.label, vscode.TreeItemCollapsibleState.None, r.key);
      n.description = `${fmtCredits(r.costCredits)} cr · ${r.runs} run${r.runs === 1 ? "" : "s"}`;
      n.iconPath = new vscode.ThemeIcon("symbol-number");
      return n;
    });
    return [header, ...items];
  }
}

// ── Mesh (agent→agent hop ledger, rendered as the hop TREE) ──────────────────
export class MeshProvider extends SxProvider {
  private direction: "outgoing" | "incoming" = "outgoing";
  private names = new Map<string, string>();

  setDirection(d: "outgoing" | "incoming"): void {
    this.direction = d;
    this.refresh();
  }
  get currentDirection(): "outgoing" | "incoming" {
    return this.direction;
  }

  private label(call: MeshCallView): string {
    const name = (id: string) => this.names.get(id) ?? `${id.slice(0, 8)}…`;
    return `${name(call.callerAgent)} → ${name(call.calleeAgent)}`;
  }

  async getChildren(node?: SxNode): Promise<SxNode[]> {
    // Child level: render this hop's subtree.
    if (node?.hop) return node.hop.children.map((c) => this.hopNode(c));
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();

    let calls: MeshCallView[];
    try {
      // Best-effort agent-name resolution (org + public) for readable labels.
      const [agents, meshCalls] = await Promise.all([
        this.getApi().listAgents().catch(() => [] as Agent[]),
        this.getApi().listMeshCalls(this.direction, 100),
      ]);
      this.names = new Map(agents.map((a) => [a.id, a.name]));
      calls = meshCalls;
    } catch (e) {
      return this.error(e);
    }
    if (calls.length === 0) {
      return this.empty(
        this.direction === "outgoing" ? "No hops — your agents haven't hired others." : "No incoming hops yet.",
      );
    }
    return buildHopTree(calls).map((h) => this.hopNode(h));
  }

  private hopNode(h: HopNode): SxNode {
    const call = h.call;
    const hasKids = h.children.length > 0;
    const n = new SxNode(
      "hop",
      this.label(call),
      hasKids ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
      call.id,
    );
    n.hop = h;
    n.runId = call.runId ?? undefined;
    const cost = call.costCredits != null ? `${fmtCredits(call.costCredits)} cr` : "—";
    n.description = `${cost} · ${call.status}${hasKids ? ` · +${h.children.length}` : ""}`;
    const tone = call.status === "failed" ? "error" : call.status === "settled" ? "ok" : "warn";
    n.iconPath = new vscode.ThemeIcon("arrow-right", toneColor(tone));
    n.tooltip = new vscode.MarkdownString(
      `**hop** \`${call.id.slice(0, 8)}\` · depth ${call.depth}\n\n` +
        `escrow ${fmtCredits(call.escrowCredits)} cr · cost ${call.costCredits != null ? fmtCredits(call.costCredits) : "—"} cr\n\n` +
        `status \`${call.status}\`${call.runId ? ` · [open run](command:silvanexum.openRunById?${encodeURIComponent(JSON.stringify([call.runId]))})` : ""}`,
    );
    n.tooltip.isTrusted = true;
    n.contextValue = call.runId ? "sxHopWithRun" : "sxHop";
    return n;
  }
}

// ── Fleet (per-agent observability over the signed-run corpus) ───────────────
export class FleetProvider extends SxProvider {
  async getChildren(node?: SxNode): Promise<SxNode[]> {
    if (node) return [];
    if (!this.isSignedIn()) return this.signedOut();
    let agents: FleetAgentRow[];
    try {
      agents = await this.getApi().fleetAgents();
    } catch (e) {
      return this.error(e);
    }
    if (agents.length === 0) return this.empty("No fleet activity yet.");
    return agents.map((a) => {
      const n = new SxNode("fleetAgent", a.name, vscode.TreeItemCollapsibleState.None, a.agentId);
      const p95 = a.p95LatencyMs != null ? `${a.p95LatencyMs}ms` : "—";
      const success = Number.isFinite(a.successRate) ? `${Math.round(a.successRate)}%` : "—";
      n.description = `${a.runs} runs · p95 ${p95} · ${success} · ${fmtCredits(a.costCredits)} cr`;
      const drift = a.drift;
      n.iconPath = drift
        ? new vscode.ThemeIcon("warning", toneColor("warn"))
        : new vscode.ThemeIcon("pulse");
      n.tooltip = new vscode.MarkdownString(
        `**${a.name}**\n\n` +
          `${a.runs} runs · p95 ${p95} · success ${success} · ${fmtCredits(a.costCredits)} cr\n\n` +
          (a.modelAlias ? `model \`${a.modelAlias}\`\n\n` : "") +
          (drift ? `⚠ drift detected (\`${drift.kind}\`) across ${drift.runIds.length} run(s)` : "no drift"),
      );
      n.contextValue = "sxFleetAgent";
      n.command = { command: "silvanexum.showProof", title: "Show Proof", arguments: [a.agentId] };
      return n;
    });
  }
}
