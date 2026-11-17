import * as vscode from "vscode";
import * as os from "node:os";
import { Api, ApiError, type Listing, type SpendingGroupBy, type CreateBudgetInput } from "./api.js";
import { showRunTrace } from "./trace.js";
import { showSpend } from "./spendview.js";
import { fmtCredits, isBudgetExceeded, isNoProviderKey } from "./finops.js";
import { CaptureCodeLensProvider } from "./codelens.js";
import {
  MarketplaceProvider,
  MyAgentsProvider,
  TemplatesProvider,
  BudgetsProvider,
  SpendProvider,
  MeshProvider,
  FleetProvider,
} from "./tree.js";

const TOKEN_KEY = "silvanexum.token";
// Scoped key requested by the editor: read/run/manage. The IDE NEVER requests
// `pay` (no in-editor spend) — governance per M17 §10.
const DEFAULT_SCOPES = ["read", "run", "manage"];

let status: vscode.StatusBarItem;
let token: string | undefined;
let trees: {
  marketplace: MarketplaceProvider;
  agents: MyAgentsProvider;
  templates: TemplatesProvider;
  budgets: BudgetsProvider;
  spend: SpendProvider;
  mesh: MeshProvider;
  fleet: FleetProvider;
};
// Fires when the token changes, so VS Code re-resolves our contributed MCP server.
const mcpChange = new vscode.EventEmitter<void>();

function cfg() {
  const c = vscode.workspace.getConfiguration("silvanexum");
  return {
    apiBaseUrl: c.get<string>("apiBaseUrl", "https://api.silvanexum.com"),
    webBaseUrl: c.get<string>("webBaseUrl", "https://silvanexum.com"),
  };
}

function api(): Api {
  return new Api(cfg().apiBaseUrl, token);
}

async function requireSignedIn(): Promise<boolean> {
  if (token) return true;
  const pick = await vscode.window.showInformationMessage(
    "Sign in to Silvanexum to continue.",
    "Sign In",
  );
  if (pick === "Sign In") await vscode.commands.executeCommand("silvanexum.signIn");
  return Boolean(token);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function activate(context: vscode.ExtensionContext): void {
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = "silvanexum.statusMenu";
  context.subscriptions.push(status);

  const codeLens = new CaptureCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [{ language: "typescript" }, { language: "javascript" }, { language: "typescriptreact" }, { language: "javascriptreact" }, { language: "python" }],
      codeLens,
    ),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("silvanexum")) codeLens.refresh();
    }),
  );

  registerMcpProvider(context);

  // ── Sidebar tree views ──────────────────────────────────────────────────
  // FinOps-first: Spend / Budgets / Mesh / Fleet lead, then the proof-ranked
  // Marketplace / My Agents / Templates.
  const signedIn = () => Boolean(token);
  trees = {
    marketplace: new MarketplaceProvider(api, signedIn),
    agents: new MyAgentsProvider(api, signedIn),
    templates: new TemplatesProvider(api, signedIn),
    budgets: new BudgetsProvider(api, signedIn),
    spend: new SpendProvider(api, signedIn),
    mesh: new MeshProvider(api, signedIn),
    fleet: new FleetProvider(api, signedIn),
  };
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("silvanexum.spend", trees.spend),
    vscode.window.registerTreeDataProvider("silvanexum.budgets", trees.budgets),
    vscode.window.registerTreeDataProvider("silvanexum.mesh", trees.mesh),
    vscode.window.registerTreeDataProvider("silvanexum.fleet", trees.fleet),
    vscode.window.registerTreeDataProvider("silvanexum.marketplace", trees.marketplace),
    vscode.window.registerTreeDataProvider("silvanexum.agents", trees.agents),
    vscode.window.registerTreeDataProvider("silvanexum.templates", trees.templates),
  );

  // Load any stored token, then paint the status bar + refresh sidebar.
  context.secrets.get(TOKEN_KEY).then((t) => {
    token = t ?? undefined;
    refreshStatus();
    refreshTrees();
  });
  context.subscriptions.push(
    context.secrets.onDidChange((e) => {
      if (e.key === TOKEN_KEY) context.secrets.get(TOKEN_KEY).then((t) => {
        token = t ?? undefined;
        refreshStatus();
        refreshTrees();
      });
    }),
  );

  const reg = (id: string, fn: (...a: never[]) => unknown) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, fn));

  reg("silvanexum.statusMenu", () => statusMenu());
  reg("silvanexum.signIn", () => signIn(context));
  reg("silvanexum.signOut", () => signOut(context));
  reg("silvanexum.findAgent", () => withErrors(findAgent));
  reg("silvanexum.runAgent", (arg?: unknown) => withErrors(() => runAgent(idOf(arg))));
  reg("silvanexum.showProof", (arg?: unknown) => withErrors(() => showProof(idOf(arg))));
  reg("silvanexum.publishVersion", () => withErrors(publishVersion));
  reg("silvanexum.deployTemplate", (arg?: unknown) =>
    withErrors(() => deployTemplate(idOf(arg))),
  );
  reg("silvanexum.openRun", () => withErrors(openRun));
  reg("silvanexum.openRunById", (arg?: unknown) => withErrors(() => openRunById(runIdOf(arg))));
  reg("silvanexum.refresh", () => refreshTrees());
  reg("silvanexum.searchMarketplace", () => withErrors(searchMarketplaceSidebar));
  // ── Agent FinOps commands ────────────────────────────────────────────────
  reg("silvanexum.createBudget", () => withErrors(createBudget));
  reg("silvanexum.deleteBudget", (arg?: unknown) => withErrors(() => deleteBudget(idOf(arg))));
  reg("silvanexum.setSpendGroupBy", () => withErrors(setSpendGroupBy));
  reg("silvanexum.openSpend", () => withErrors(openSpend));
  reg("silvanexum.toggleMeshDirection", () => trees.mesh.setDirection(
    trees.mesh.currentDirection === "outgoing" ? "incoming" : "outgoing",
  ));
}

function refreshTrees(): void {
  if (!trees) return;
  trees.marketplace.refresh();
  trees.agents.refresh();
  trees.templates.refresh();
  trees.budgets.refresh();
  trees.spend.refresh();
  trees.mesh.refresh();
  trees.fleet.refresh();
  refreshStatus(); // budget-burn indicator tracks the latest budget state
}

export function deactivate(): void {
  status?.dispose();
}

// ── VS Code MCP integration ─────────────────────────────────────────────────────
// Contributes the `silvanexum` MCP server to VS Code (Copilot agent mode), so
// installing this extension makes the proof-ranked tools available natively —
// wired to the same signed-in key. (VS Code ≥ 1.101.)
function registerMcpProvider(context: vscode.ExtensionContext): void {
  const lm = vscode.lm as unknown as {
    registerMcpServerDefinitionProvider?: (
      id: string,
      provider: vscode.McpServerDefinitionProvider,
    ) => vscode.Disposable;
  };
  if (typeof lm.registerMcpServerDefinitionProvider !== "function") return; // older host

  const make = (withKey: boolean) => {
    const c = cfg();
    const env: Record<string, string> = {
      SILVANEXUM_BASE_URL: c.apiBaseUrl,
      SILVANEXUM_WEB_URL: c.webBaseUrl,
    };
    if (withKey && token) env.SILVANEXUM_API_KEY = token;
    // Pin the MCP server version so a single malicious publish can't silently
    // run in the editor (which holds the user's token). Keep in step with this
    // extension's release.
    return new vscode.McpStdioServerDefinition("Silvanexum", "npx", ["-y", "@silvanexum/mcp@0.5.0"], env);
  };

  context.subscriptions.push(
    mcpChange,
    lm.registerMcpServerDefinitionProvider("silvanexum", {
      onDidChangeMcpServerDefinitions: mcpChange.event,
      provideMcpServerDefinitions: async () => [make(false)],
      // Resolve is called right before start — ensure the user is signed in and
      // inject the key so the server authenticates with the editor's account.
      resolveMcpServerDefinition: async (server) => {
        if (!token) await vscode.commands.executeCommand("silvanexum.signIn");
        return token ? make(true) : server;
      },
    }),
  );
}

// ── Status bar ────────────────────────────────────────────────────────────────
function refreshStatus(): void {
  if (!token) {
    status.text = "$(account) Silvanexum: Sign in";
    status.tooltip = "Sign in to Silvanexum";
    status.backgroundColor = undefined;
    status.show();
    return;
  }
  status.text = "$(sparkle) Silvanexum";
  status.tooltip = "Silvanexum — signed in";
  status.backgroundColor = undefined;
  // Lead with spend CONTROL, not visibility: surface the most-utilized enforcing
  // budget; keep the wallet balance in the tooltip. Best-effort — either call may
  // be unavailable on a given deployment.
  const a = api();
  Promise.allSettled([a.listBudgets(), a.wallet()])
    .then(([budgetsRes, walletRes]) => {
      const balance =
        walletRes.status === "fulfilled" ? `${formatCredits(walletRes.value.balanceCredits)} cr` : undefined;
      const budgets = budgetsRes.status === "fulfilled" ? budgetsRes.value : [];
      const top = budgets
        .filter((b) => b.budget.enforcement !== "off")
        .sort((x, y) => y.usedPct - x.usedPct)[0];
      if (top) {
        const pct = Math.round(top.usedPct);
        const icon = top.state === "exceeded" ? "$(error)" : top.state === "warn" ? "$(warning)" : "$(dashboard)";
        status.text = `${icon} Budget ${pct}%`;
        status.tooltip = new vscode.MarkdownString(
          `**${top.budget.name}** — ${pct}% of ${fmtCredits(top.limitCredits)} cr (${top.state})` +
            (balance ? `\n\nWallet: ${balance}` : ""),
        );
        status.backgroundColor =
          top.state === "exceeded"
            ? new vscode.ThemeColor("statusBarItem.errorBackground")
            : top.state === "warn"
              ? new vscode.ThemeColor("statusBarItem.warningBackground")
              : undefined;
      } else if (balance) {
        status.text = `$(sparkle) ${balance}`;
        status.tooltip = "Silvanexum credit balance";
      }
    })
    .catch(() => {});
  status.show();
}

function formatCredits(s: string): string {
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : s;
}

async function statusMenu(): Promise<void> {
  if (!token) return void signInCmd();
  const pick = await vscode.window.showQuickPick(
    [
      { label: "$(graph) Open Spend", id: "silvanexum.openSpend" },
      { label: "$(dashboard) Create Budget", id: "silvanexum.createBudget" },
      { label: "$(search) Find Agent", id: "silvanexum.findAgent" },
      { label: "$(play) Run Agent", id: "silvanexum.runAgent" },
      { label: "$(tag) Publish Version", id: "silvanexum.publishVersion" },
      { label: "$(cloud-download) Deploy Template", id: "silvanexum.deployTemplate" },
      { label: "$(sign-out) Sign Out", id: "silvanexum.signOut" },
    ],
    { placeHolder: "Silvanexum" },
  );
  if (pick) await vscode.commands.executeCommand(pick.id);
}

function signInCmd() {
  return vscode.commands.executeCommand("silvanexum.signIn");
}

// ── Auth: device authorization grant ────────────────────────────────────────────
async function signIn(context: vscode.ExtensionContext): Promise<void> {
  if (token) {
    vscode.window.showInformationMessage("Already signed in to Silvanexum.");
    return;
  }
  const { apiBaseUrl } = cfg();
  const clientName = `VS Code (${os.hostname()})`;
  let device;
  try {
    device = await Api.deviceCode(apiBaseUrl, clientName, DEFAULT_SCOPES);
  } catch (e) {
    vscode.window.showErrorMessage(`Silvanexum sign-in failed: ${msg(e)}`);
    return;
  }

  const open = await vscode.window.showInformationMessage(
    `Approve this code in your browser: ${device.user_code}`,
    { modal: false },
    "Open & Approve",
    "Copy Code",
  );
  if (open === "Copy Code") await vscode.env.clipboard.writeText(device.user_code);
  await vscode.env.openExternal(vscode.Uri.parse(device.verification_uri_complete));

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Silvanexum: waiting for approval…", cancellable: true },
    async (_p, cancel) => {
      const deadline = Date.now() + device.expires_in * 1000;
      while (Date.now() < deadline && !cancel.isCancellationRequested) {
        await delay(device.interval * 1000);
        if (cancel.isCancellationRequested) return;
        try {
          const t = await Api.devicePollOnce(apiBaseUrl, device.device_code);
          if (t) {
            token = t;
            await context.secrets.store(TOKEN_KEY, t);
            refreshStatus();
            mcpChange.fire(); // let VS Code pick up the key for the MCP server
            vscode.window.showInformationMessage("Signed in to Silvanexum ✓");
            return;
          }
        } catch (e) {
          vscode.window.showErrorMessage(`Silvanexum sign-in failed: ${msg(e)}`);
          return;
        }
      }
      if (!token) vscode.window.showWarningMessage("Silvanexum sign-in timed out.");
    },
  );
}

async function signOut(context: vscode.ExtensionContext): Promise<void> {
  token = undefined;
  await context.secrets.delete(TOKEN_KEY);
  refreshStatus();
  mcpChange.fire();
  vscode.window.showInformationMessage("Signed out of Silvanexum.");
}

// ── Commands ────────────────────────────────────────────────────────────────────
async function pickAgent(placeHolder: string): Promise<string | undefined> {
  const agents = await api().listAgents();
  if (agents.length === 0) {
    vscode.window.showInformationMessage("No agents in your org yet.");
    return undefined;
  }
  const pick = await vscode.window.showQuickPick(
    agents.map((a) => ({
      label: a.name,
      description: `${a.config.provider}/${a.config.model}`,
      detail: a.reputation?.trustScore != null
        ? `trust ${a.reputation.trustScore} · ${a.reputation.totalRuns} runs (${a.reputation.confidence})`
        : "no runs yet",
      id: a.id,
    })),
    { placeHolder, matchOnDescription: true },
  );
  return pick?.id;
}

async function findAgent(): Promise<void> {
  if (!(await requireSignedIn())) return;
  const q = await vscode.window.showInputBox({ prompt: "Search the proof-ranked marketplace", placeHolder: "e.g. legal contract review" });
  if (q === undefined) return;
  const results = await api().searchMarketplace(q);
  if (results.length === 0) {
    vscode.window.showInformationMessage("No listings matched.");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    results.map((r: Listing) => ({
      label: r.title,
      description: r.category,
      detail: `proof ${r.proofScore} · trust ${r.proof.trustScore ?? "—"} · ${r.proof.totalRuns} runs (${r.proof.confidence})`,
      id: r.agentId,
    })),
    { placeHolder: "Proof-ranked results — pick one to run" },
  );
  if (pick) await runAgent(pick.id);
}

async function runAgent(presetAgentId?: string): Promise<void> {
  if (!(await requireSignedIn())) return;
  const agentId = presetAgentId ?? (await pickAgent("Pick an agent to run"));
  if (!agentId) return;
  const prompt = await vscode.window.showInputBox({ prompt: "Prompt", placeHolder: "What should the agent do?" });
  if (!prompt) return;
  try {
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Silvanexum: running…" },
      async () => {
        const run = await api().runAgent(agentId, prompt);
        showRunTrace(run, cfg().webBaseUrl);
      },
    );
  } catch (e) {
    // A `block`-mode budget pre-flight rejects the run with 402 — surface it as
    // actionable spend guidance rather than a raw error, and jump to Budgets.
    if (isBudgetExceeded(e)) {
      const pick = await vscode.window.showWarningMessage(
        `Run blocked — a budget is exhausted. ${e instanceof ApiError ? e.message : ""}`.trim(),
        "View Budgets",
      );
      if (pick === "View Budgets") {
        refreshTrees();
        await vscode.commands.executeCommand("silvanexum.budgets.focus");
      }
      return;
    }
    // No AI provider key configured for the account whose key runs this agent —
    // send the user to the web Settings → Keys page to add one.
    if (isNoProviderKey(e)) {
      const pick = await vscode.window.showWarningMessage(
        "This agent needs an AI provider API key. Add your key to run it.",
        "Add provider key",
      );
      if (pick === "Add provider key") {
        await vscode.env.openExternal(vscode.Uri.parse(`${cfg().webBaseUrl.replace(/\/$/, "")}/settings/keys`));
      }
      return;
    }
    throw e;
  }
}

async function publishVersion(): Promise<void> {
  if (!(await requireSignedIn())) return;
  const agentId = await pickAgent("Pick an agent to version");
  if (!agentId) return;
  const semver = await vscode.window.showInputBox({
    prompt: "Version (semver)",
    value: "1.0.0",
    validateInput: (v) => (/^\d+\.\d+\.\d+$/.test(v) ? null : "Use MAJOR.MINOR.PATCH"),
  });
  if (!semver) return;
  const changelog = (await vscode.window.showInputBox({ prompt: "Changelog (optional)" })) ?? "";
  const version = await api().publishVersion(agentId, semver, changelog);
  vscode.window.showInformationMessage(`Published signed version ${version.semver} ✓`);
}

async function deployTemplate(presetTemplateId?: string): Promise<void> {
  if (!(await requireSignedIn())) return;
  let templateId = presetTemplateId;
  if (!templateId) {
    let templates;
    try {
      templates = await api().listTemplates();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 501)) {
        vscode.window.showInformationMessage("Templates aren't enabled on this deployment yet (M11).");
        return;
      }
      throw e;
    }
    if (templates.length === 0) {
      vscode.window.showInformationMessage("No templates available.");
      return;
    }
    const pick = await vscode.window.showQuickPick(
      templates.map((t) => ({ label: t.displayName, description: t.vertical, id: t.id })),
      { placeHolder: "Pick a template to deploy" },
    );
    if (!pick) return;
    templateId = pick.id;
  }
  const agent = await api().deployTemplate(templateId, {});
  refreshTrees(); // a new agent now exists in the org
  const run = await vscode.window.showInformationMessage(`Deployed “${agent.name}” ✓`, "Run it");
  if (run === "Run it") await runAgent(agent.id);
}

// Open the most recent signed trace for a specific agent (CodeLens "proof").
async function showProof(agentId?: string): Promise<void> {
  if (!(await requireSignedIn())) return;
  const id = agentId ?? (await pickAgent("Pick an agent to inspect"));
  if (!id) return;
  const runs = await api().listRuns(id, 10);
  if (runs.length === 0) {
    const run = await vscode.window.showInformationMessage(
      "No signed runs for this agent yet.",
      "Run it now",
    );
    if (run === "Run it now") await runAgent(id);
    return;
  }
  if (runs.length === 1) {
    showRunTrace(runs[0]!, cfg().webBaseUrl);
    return;
  }
  const pick = await vscode.window.showQuickPick(
    runs.map((r) => ({
      label: `$(${r.status === "success" ? "pass" : "error"}) ${r.id.slice(0, 8)}`,
      description: `${r.latencyMs} ms · ${r.signature ? "signed" : "unsigned"}`,
      detail: r.prompt?.slice(0, 80),
      run: r,
    })),
    { placeHolder: "Recent signed runs — pick one to open its trace" },
  );
  if (pick) showRunTrace(pick.run, cfg().webBaseUrl);
}

// Set the sidebar marketplace query from an input box, then refresh that view.
async function searchMarketplaceSidebar(): Promise<void> {
  if (!(await requireSignedIn())) return;
  const q = await vscode.window.showInputBox({
    prompt: "Filter the proof-ranked marketplace",
    placeHolder: "e.g. legal contract review",
  });
  if (q === undefined) return;
  trees.marketplace.setQuery(q.trim());
}

async function openRun(): Promise<void> {
  if (!(await requireSignedIn())) return;
  const id = await vscode.window.showInputBox({ prompt: "Run (execution) id" });
  if (!id) return;
  const run = await api().getRun(id.trim());
  showRunTrace(run, cfg().webBaseUrl);
}

// Open a run's trace by id (used by mesh hop "open run" links).
async function openRunById(id?: string): Promise<void> {
  if (!id || !(await requireSignedIn())) return;
  const run = await api().getRun(id);
  showRunTrace(run, cfg().webBaseUrl);
}

// ── Agent FinOps command handlers ─────────────────────────────────────────────
async function createBudget(): Promise<void> {
  if (!(await requireSignedIn())) return;
  const name = await vscode.window.showInputBox({
    prompt: "Budget name",
    placeHolder: "e.g. Monthly cap",
    validateInput: (v) => (v.trim() ? null : "Name is required"),
  });
  if (!name) return;

  const scopePick = await vscode.window.showQuickPick(
    [
      { label: "Organization", detail: "Cap total spend across the org", scope: "org" as const },
      { label: "Single agent", detail: "Cap one agent's spend", scope: "agent" as const },
    ],
    { placeHolder: "Budget scope" },
  );
  if (!scopePick) return;

  let scopeId: string | undefined;
  if (scopePick.scope === "agent") {
    scopeId = await pickAgent("Pick the agent to cap");
    if (!scopeId) return;
  }

  const period = await vscode.window.showQuickPick(
    ["monthly", "weekly", "daily", "rolling_30d"],
    { placeHolder: "Budget period" },
  );
  if (!period) return;

  const limitRaw = await vscode.window.showInputBox({
    prompt: "Limit (credits)",
    placeHolder: "e.g. 1000",
    validateInput: (v) => (Number(v) > 0 ? null : "Enter a positive number"),
  });
  if (!limitRaw) return;

  const enforcePick = await vscode.window.showQuickPick(
    [
      { label: "Block", detail: "Reject over-budget runs (402)", mode: "block" as const },
      { label: "Alert", detail: "Allow, but flag when over threshold", mode: "alert" as const },
      { label: "Off", detail: "Track only, no enforcement", mode: "off" as const },
    ],
    { placeHolder: "Enforcement" },
  );
  if (!enforcePick) return;

  const input: CreateBudgetInput = {
    name: name.trim(),
    scopeType: scopePick.scope,
    scopeId,
    periodType: period as CreateBudgetInput["periodType"],
    limitCredits: Number(limitRaw),
    enforcement: enforcePick.mode,
  };
  await api().createBudget(input);
  trees.budgets.refresh();
  refreshStatus();
  vscode.window.showInformationMessage(`Budget “${input.name}” created ✓`);
}

async function deleteBudget(id?: string): Promise<void> {
  if (!id || !(await requireSignedIn())) return;
  const ok = await vscode.window.showWarningMessage("Delete this budget?", { modal: true }, "Delete");
  if (ok !== "Delete") return;
  await api().deleteBudget(id);
  trees.budgets.refresh();
  refreshStatus();
}

async function setSpendGroupBy(): Promise<void> {
  const pick = await vscode.window.showQuickPick(["agent", "project", "model", "provider"], {
    placeHolder: "Group spend by",
  });
  if (!pick) return;
  trees.spend.setGroupBy(pick as SpendingGroupBy);
}

async function openSpend(): Promise<void> {
  if (!(await requireSignedIn())) return;
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: "Silvanexum: loading spend…" },
    async () => {
      const groupBy = trees.spend.currentGroupBy;
      const a = api();
      const [summary, trends, cost] = await Promise.all([
        a.spendingSummary({ groupBy, from: "-30d" }),
        a.spendingTrends({ bucket: "1d", from: "-30d" }).catch(() => []),
        a.fleetCost("provider").catch(() => []),
      ]);
      showSpend({ groupBy, summary, trends, cost });
    },
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function withErrors(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    vscode.window.showErrorMessage(`Silvanexum: ${msg(e)}`);
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Normalize a command argument to an id string. Commands are invoked three ways:
// from the command palette (no arg), from a CodeLens / tree-item click
// (a string id), and from a tree context-menu button (an SxNode with payloadId).
function idOf(arg: unknown): string | undefined {
  if (typeof arg === "string") return arg;
  if (arg && typeof arg === "object" && "payloadId" in arg) {
    const v = (arg as { payloadId?: unknown }).payloadId;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

// Like idOf, but pulls the signed-run id off a mesh hop node (or a raw string
// from a command-URI link). Hop nodes carry runId separately from payloadId.
function runIdOf(arg: unknown): string | undefined {
  if (typeof arg === "string") return arg;
  if (arg && typeof arg === "object" && "runId" in arg) {
    const v = (arg as { runId?: unknown }).runId;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}
