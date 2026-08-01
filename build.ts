import { build } from "bun";

const nodeEnvironment = Bun.env.NODE_ENV || "development";
const isProductionBuild = nodeEnvironment === "production";

// Reason: Bun.build throws on failure by default, which prints the errors
// and exits non-zero — no try/catch or success logging needed.
await build({
  entrypoints: ["./main.ts"],
  outdir: ".",
  target: "node",
  format: "cjs",
  external: ["obsidian"],
  minify: isProductionBuild,
  sourcemap: isProductionBuild ? "none" : "inline",
  define: {
    "process.env.NODE_ENV": JSON.stringify(nodeEnvironment)
  }
});
