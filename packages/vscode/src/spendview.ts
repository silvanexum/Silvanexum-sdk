import * as vscode from "vscode";
import { renderSpend, type SpendData } from "./webview-render.js";

export type { SpendData };

// Spend detail webview — a dependency-free dashboard (inline divs/SVG, no chart
// lib). Static HTML, scripts disabled; HTML built by the pure renderSpend().

let panel: vscode.WebviewPanel | undefined;

export function showSpend(data: SpendData): void {
  if (!panel) {
    panel = vscode.window.createWebviewPanel("silvanexumSpend", "Silvanexum Spend", vscode.ViewColumn.Active, {
      enableScripts: false,
      retainContextWhenHidden: true,
    });
    panel.onDidDispose(() => (panel = undefined));
  }
  panel.webview.html = renderSpend(data);
  panel.reveal();
}
