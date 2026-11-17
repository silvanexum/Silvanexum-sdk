import { defineConfig } from "tsup";

// A single ESM bin with a Node shebang. Deps (@silvanexum/sdk, the MCP SDK) stay
// external and are installed normally — npx resolves them.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
});
