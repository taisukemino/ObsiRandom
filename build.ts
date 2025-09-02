// @ts-ignore - bun types not available
import { build } from "bun";

try {
  // @ts-ignore - top-level await
  await build({
    entrypoints: ["./main.ts"],
    outdir: ".",
    outfile: "main.js",
    target: "node",
    format: "cjs",
    external: ["obsidian"],
    minify: process.env.NODE_ENV === "production",
    sourcemap: process.env.NODE_ENV === "production" ? "none" : "inline",
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      )
    }
  });

  console.log("✅ Build completed successfully");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
