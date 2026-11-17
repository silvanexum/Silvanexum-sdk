import * as vscode from "vscode";
import type { Execution } from "./api.js";
import { renderTrace } from "./webview-render.js";

let panel: vscode.WebviewPanel | undefined;

/** Render a run's signed trace in a reusable webview panel. */
export function showRunTrace(execution: Execution, webBaseUrl: string): void {
  if (!panel) {
    panel = vscode.window.createWebviewPanel(
      "silvanexumTrace",
      "Silvanexum Run",
      vscode.ViewColumn.Beside,
      { enableScripts: false, retainContextWhenHidden: true },
    );
    panel.onDidDispose(() => (panel = undefined));
  }
  panel.title = `Run ${execution.id.slice(0, 8)}`;
  panel.webview.html = renderTrace(execution, webBaseUrl);
  panel.reveal(vscode.ViewColumn.Beside, true);
}
