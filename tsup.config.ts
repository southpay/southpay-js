import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs", "iife"],
  globalName: "SouthPay",
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  treeshake: true,
});
