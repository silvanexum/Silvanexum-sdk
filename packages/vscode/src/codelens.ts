import * as vscode from "vscode";

// Surfaces Silvanexum actions on captured-agent call sites. We statically detect
// `@sx.capture` / `@silvanexum.capture` decorators (Python) and `sx.capture(` /
// `silvanexum.capture(` calls (TS/JS), debounced via onDidChangeCodeLenses.
//
// When the capture references a concrete agent — `sx.capture("agent-id")`,
// `@sx.capture(agent="…")`, or `agentId="…"` — we bind the actions to that agent
// so "run" / "find proof" act on the real, signed corpus instead of prompting.
// We deliberately do NOT fabricate proof numbers inline; the headline + signed
// trace are fetched on click against the live API.
const CAPTURE_RE =
  /(?:@)?(?:sx|silvanexum)\.capture\b\s*(\(([^)]*)\))?/;
// Pull an agent reference out of the capture arguments, if present.
const AGENT_ARG_RE =
  /(?:agent(?:_?id)?\s*=\s*)?["'`]([A-Za-z0-9][\w.-]{2,})["'`]/;

export class CaptureCodeLensProvider implements vscode.CodeLensProvider {
  private readonly onChange = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.onChange.event;

  refresh(): void {
    this.onChange.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    if (!vscode.workspace.getConfiguration("silvanexum").get<boolean>("codeLens", true)) {
      return [];
    }
    const lenses: vscode.CodeLens[] = [];
    for (let line = 0; line < document.lineCount; line++) {
      const text = document.lineAt(line).text;
      const m = CAPTURE_RE.exec(text);
      if (!m) continue;

      const range = new vscode.Range(line, 0, line, text.length);
      // Try to bind to a concrete agent referenced in the capture args.
      const argMatch = m[2] ? AGENT_ARG_RE.exec(m[2]) : null;
      const agentId = argMatch?.[1];
      const runArgs = agentId ? [agentId] : [];

      lenses.push(
        new vscode.CodeLens(range, {
          title: agentId ? `◆ Silvanexum: run ${agentId}` : "◆ Silvanexum: run",
          tooltip: "Run this agent and open its signed trace",
          command: "silvanexum.runAgent",
          arguments: runArgs,
        }),
        new vscode.CodeLens(range, {
          title: "proof",
          tooltip: agentId
            ? "Open this agent's run-corpus proof and recent signed traces"
            : "Find a proven agent on the marketplace",
          command: agentId ? "silvanexum.showProof" : "silvanexum.findAgent",
          arguments: runArgs,
        }),
      );
    }
    return lenses;
  }
}
