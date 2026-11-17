// Pure webview HTML renderers — NO `vscode` import, so they can be unit-tested
// directly. The panel wrappers (trace.ts / spendview.ts) own the vscode surface
// and delegate their HTML to these functions.

import type { Execution, SpendingRow, SpendingTrendPoint, FleetCostRow, SpendingGroupBy } from "./api.js";
import { fmtCredits } from "./finops.js";

export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// ── Run trace ────────────────────────────────────────────────────────────────
export function renderTrace(e: Execution, webBaseUrl: string): string {
  const replay = `${webBaseUrl.replace(/\/$/, "")}/runs/${e.id}`;
  const ok = e.status === "success";
  const signed = Boolean(e.signature);
  // The public /runs/:id page only resolves runs shared publicly; a private
  // playground run 404s there. Only offer the link when it will actually work.
  const isPublic = e.visibility === "public";
  const steps = e.trace
    .map((s) => {
      const dot = s.status === "ok" ? "#34d399" : "#f87171";
      return `<div class="step">
        <span class="rail" style="background:${dot}"></span>
        <div>
          <div class="srow"><span class="kind">${esc(s.kind)}</span> <span class="name">${esc(s.name)}</span>
          <span class="t">+${s.startMs}ms · ${s.durationMs}ms</span></div>
          ${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ""}
        </div>
      </div>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root { color-scheme: dark; }
    body { font: 13px var(--vscode-font-family); color: var(--vscode-foreground); padding: 14px 18px; }
    .hd { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
    .badge { font-size:11px; padding:2px 8px; border-radius:6px; border:1px solid #ffffff22; }
    .ok { color:#34d399; } .fail { color:#f87171; }
    .mono { font-family: var(--vscode-editor-font-family); }
    h2 { font-size:14px; margin:16px 0 6px; opacity:.7; font-weight:600; }
    .out { white-space:pre-wrap; background:#ffffff0a; border:1px solid #ffffff14; border-radius:8px; padding:10px; }
    .step { display:grid; grid-template-columns:10px 1fr; gap:10px; padding:6px 0; }
    .rail { width:8px; height:8px; border-radius:50%; margin-top:5px; }
    .srow { display:flex; gap:8px; align-items:baseline; flex-wrap:wrap; }
    .kind { text-transform:uppercase; font-size:10px; letter-spacing:.05em; opacity:.6; }
    .name { font-weight:600; } .t { font-size:11px; opacity:.5; margin-left:auto; }
    .detail { font-size:12px; opacity:.7; margin-top:2px; } a { color:#22d3ee; }
  </style></head><body>
    <div class="hd">
      <span class="badge ${ok ? "ok" : "fail"}">${ok ? "success" : "error"}</span>
      <span class="badge">${e.latencyMs} ms</span>
      <span class="badge ${signed ? "ok" : ""}">${signed ? "● signed" : "unsigned"}</span>
      ${
        isPublic
          ? `<a href="${replay}">Open replayable run ↗</a>`
          : `<span class="badge" title="Share this run to get a public replay link">private</span>`
      }
    </div>
    ${signed ? `<div class="mono" style="font-size:11px;opacity:.5">sha256 ${esc(e.contentHash ?? "")}</div>` : ""}
    <h2>Prompt</h2>
    <div class="out">${esc(e.prompt || "(empty)")}</div>
    <h2>Output</h2>
    <div class="out">${esc(e.output || "(empty)")}</div>
    <h2>Trace</h2>
    ${steps || '<div style="opacity:.5">No steps recorded.</div>'}
  </body></html>`;
}

// ── Spend dashboard ──────────────────────────────────────────────────────────
export interface SpendData {
  groupBy: SpendingGroupBy;
  summary: SpendingRow[];
  trends: SpendingTrendPoint[];
  cost: FleetCostRow[];
}

function bars(items: { label: string; value: number; sub?: string }[]): string {
  const max = Math.max(1, ...items.map((i) => i.value));
  return items
    .map((i) => {
      const pct = Math.round((i.value / max) * 100);
      return `<div class="row">
        <div class="lbl" title="${esc(i.label)}">${esc(i.label)}</div>
        <div class="track"><div class="fill" style="width:${pct}%"></div></div>
        <div class="val">${fmtCredits(i.value)} cr${i.sub ? ` <span class="sub">${esc(i.sub)}</span>` : ""}</div>
      </div>`;
    })
    .join("");
}

function trendColumns(points: SpendingTrendPoint[]): string {
  if (points.length === 0) return `<div class="muted">No trend data.</div>`;
  const vals = points.map((p) => Number(p.costCredits) || 0);
  const max = Math.max(1, ...vals);
  return `<div class="trend">${points
    .map((p, i) => {
      const h = Math.round((vals[i]! / max) * 100);
      const day = p.ts.slice(5, 10);
      return `<div class="col" title="${esc(day)} · ${fmtCredits(vals[i]!)} cr · ${p.runs} runs">
        <div class="bar" style="height:${Math.max(2, h)}%"></div>
      </div>`;
    })
    .join("")}</div>`;
}

export function renderSpend(d: SpendData): string {
  const total = d.summary.reduce((s, r) => s + (Number(r.costCredits) || 0), 0);
  const runs = d.summary.reduce((s, r) => s + r.runs, 0);
  const activeDays = d.trends.filter((p) => (Number(p.costCredits) || 0) > 0).length;

  const summaryBars = bars(
    d.summary.map((r) => ({ label: r.label, value: Number(r.costCredits) || 0, sub: `${r.runs} runs` })),
  );
  const costBars = bars(
    d.cost.map((r) => ({
      label: r.model ? `${r.provider}/${r.model}` : r.provider,
      value: Number(r.costCredits) || 0,
      sub: `${r.runs} runs`,
    })),
  );

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root { color-scheme: light dark; }
    body { font: 13px var(--vscode-font-family); color: var(--vscode-foreground); padding: 16px 20px; }
    h1 { font-size: 15px; margin: 0 0 2px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .6; margin: 20px 0 8px; }
    .sub, .muted { opacity: .55; }
    .metrics { display: flex; gap: 26px; margin: 12px 0 4px; flex-wrap: wrap; }
    .metric .n { font-size: 20px; font-weight: 600; } .metric .k { font-size: 11px; opacity: .6; text-transform: uppercase; letter-spacing:.05em; }
    .row { display: grid; grid-template-columns: 130px 1fr 150px; gap: 10px; align-items: center; padding: 3px 0; }
    .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .track { background: #8882; border-radius: 4px; height: 10px; overflow: hidden; }
    .fill { background: var(--vscode-charts-blue, #3794ff); height: 100%; }
    .val { text-align: right; font-variant-numeric: tabular-nums; }
    .trend { display: flex; align-items: flex-end; gap: 2px; height: 90px; margin-top: 6px; border-bottom: 1px solid #8883; }
    .trend .col { flex: 1; display: flex; align-items: flex-end; height: 100%; }
    .trend .bar { width: 100%; background: var(--vscode-charts-green, #89d185); border-radius: 2px 2px 0 0; }
  </style></head><body>
    <h1>Spend · last 30 days</h1>
    <div class="metrics">
      <div class="metric"><div class="n">${fmtCredits(total)}</div><div class="k">credits</div></div>
      <div class="metric"><div class="n">${runs.toLocaleString()}</div><div class="k">runs</div></div>
      <div class="metric"><div class="n">${activeDays}</div><div class="k">active days</div></div>
    </div>

    <h2>Daily spend</h2>
    ${trendColumns(d.trends)}

    <h2>By ${esc(d.groupBy)}</h2>
    ${summaryBars || `<div class="muted">No spend recorded.</div>`}

    <h2>Cost by provider</h2>
    ${costBars || `<div class="muted">No provider cost data.</div>`}
  </body></html>`;
}
