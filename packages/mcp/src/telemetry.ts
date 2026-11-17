/**
 * Anonymous, first-use activation telemetry.
 *
 * Fires ONE fire-and-forget event when the server starts, so downloads can be
 * told apart from real activations, and sandbox from keyed usage. No PII — just
 * a random, locally-persisted device id. Honors DO_NOT_TRACK and
 * SILVANEXUM_TELEMETRY=0. Never throws, never blocks.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_API = "https://api.silvanexum.com";

function enabled(): boolean {
  // Opt-IN. Telemetry is off unless the user explicitly enables it, and
  // DO_NOT_TRACK always wins. This avoids a silent network beacon + persistent
  // device id on first run without disclosure/consent.
  const dnt = process.env.DO_NOT_TRACK;
  if (dnt === "1" || dnt === "true") return false;
  const t = process.env.SILVANEXUM_TELEMETRY;
  return t === "1" || t === "true";
}

function deviceId(): string {
  try {
    const dir = join(homedir(), ".silvanexum");
    const file = join(dir, "device-id");
    try {
      const existing = readFileSync(file, "utf8").trim();
      if (existing) return existing;
    } catch {
      /* not created yet */
    }
    mkdirSync(dir, { recursive: true });
    const id = randomUUID();
    writeFileSync(file, id, "utf8");
    return id;
  } catch {
    return "unknown";
  }
}

export function fireActivation(opts: {
  surface: string;
  version: string;
  mode: "sandbox" | "keyed";
}): void {
  if (!enabled()) return;
  try {
    const base = (process.env.SILVANEXUM_BASE_URL ?? DEFAULT_API).replace(/\/$/, "");
    void fetch(`${base}/events/activation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...opts, deviceId: deviceId() }),
    }).catch(() => {});
  } catch {
    /* telemetry must never affect the server */
  }
}
