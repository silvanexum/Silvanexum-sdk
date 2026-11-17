import { defineConfig } from "tsup";

// Dual ESM + CJS, bundled .d.ts, Node 20 target. No postinstall, tree-shakeable.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "node20",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
