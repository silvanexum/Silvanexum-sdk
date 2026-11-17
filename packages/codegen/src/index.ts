/**
 * Codegen entrypoint. Reads the backend Zod contracts + the route manifest and
 * emits three artifacts:
 *
 *   spec/openapi.json                                  (the published API spec)
 *   packages/sdk-ts/src/generated/types.ts             (TS types)
 *   packages/sdk-py/silvanexum/_generated/models.py    (Python pydantic models)
 *
 * Usage (from repo root, via tsx):
 *   pnpm generate          # write the artifacts
 *   pnpm generate:check    # fail (exit 1) if artifacts are stale — for CI
 *
 * The contracts directory defaults to a sibling Silvanexum-Backend checkout and
 * can be overridden with SILVANEXUM_CONTRACTS (path to src/shared).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadSchemas } from "./jsonschema.js";
import { emitTypeScript } from "./emit-ts.js";
import { emitPython } from "./emit-py.js";
import { emitOpenApi } from "./emit-openapi.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../.."); // src → codegen → packages → root

function contractsIndexUrl(): string {
  const override = process.env.SILVANEXUM_CONTRACTS;
  const sharedDir = override
    ? resolve(override)
    : resolve(REPO_ROOT, "../Silvanexum-Backend/src/shared");
  const index = resolve(sharedDir, "index.ts");
  if (!existsSync(index)) {
    throw new Error(
      `Cannot find backend contracts at ${index}.\n` +
        `Set SILVANEXUM_CONTRACTS to the backend's src/shared directory.`,
    );
  }
  return pathToFileURL(index).href;
}

async function readVersion(): Promise<string> {
  try {
    const pkg = JSON.parse(
      await readFile(resolve(REPO_ROOT, "packages/sdk-ts/package.json"), "utf8"),
    );
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

interface Artifact {
  path: string;
  contents: string;
}

async function writeOrCheck(artifacts: Artifact[], check: boolean): Promise<boolean> {
  let stale = false;
  for (const { path, contents } of artifacts) {
    const abs = resolve(REPO_ROOT, path);
    const existing = existsSync(abs) ? await readFile(abs, "utf8") : null;
    if (check) {
      if (existing !== contents) {
        stale = true;
        console.error(`✗ stale: ${path}`);
      } else {
        console.log(`✓ up to date: ${path}`);
      }
    } else {
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, contents, "utf8");
      console.log(`→ wrote ${path}`);
    }
  }
  return stale;
}

async function main() {
  const check = process.argv.includes("--check");
  const version = await readVersion();

  console.log(`Silvanexum codegen — ${check ? "check" : "generate"} (v${version})`);

  const { schemas, approximate, missing } = await loadSchemas(contractsIndexUrl());

  if (missing.length) {
    console.error("\n✗ Contract drift — these registered Zod exports were not found:");
    for (const m of missing) console.error(`   - ${m}`);
    console.error(
      "\nThe backend's src/shared/* changed. Update packages/codegen/src/registry.ts.",
    );
    process.exit(1);
  }

  const ts = emitTypeScript(schemas);
  const py = emitPython(schemas);
  const openapi = JSON.stringify(emitOpenApi(schemas, version), null, 2) + "\n";

  const stale = await writeOrCheck(
    [
      { path: "spec/openapi.json", contents: openapi },
      { path: "packages/sdk-ts/src/generated/types.ts", contents: ts },
      { path: "packages/sdk-py/silvanexum/_generated/models.py", contents: py },
    ],
    check,
  );

  console.log(
    `\n${Object.keys(schemas).length} types emitted ` +
      `(${approximate.length} approximate / pending Zod migration).`,
  );
  if (approximate.length) {
    console.log("Approximate (migrate these backend interfaces to Zod):");
    console.log("  " + approximate.join(", "));
  }

  if (check && stale) {
    console.error(
      "\n✗ Generated artifacts are out of date. Run `pnpm generate` and commit the result.",
    );
    process.exit(1);
  }
  console.log(check ? "\n✓ generated artifacts are current." : "\n✓ generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
