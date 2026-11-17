import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

// The extension runs in VS Code's Node host. Bundle to a single CJS file;
// `vscode` is provided by the host, so it stays external.
const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["vscode"],
  sourcemap: true,
  minify: !watch,
});

if (watch) {
  await ctx.watch();
  console.log("esbuild: watching…");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("esbuild: built dist/extension.js");
}
