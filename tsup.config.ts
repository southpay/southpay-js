import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

const define = { __SDK_VERSION__: JSON.stringify(pkg.version) };

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    treeshake: true,
    define,
  },
  {
    entry: { index: "src/global.ts" },
    format: ["iife"],
    globalName: "SouthPay",
    dts: false,
    clean: false,
    minify: true,
    sourcemap: true,
    treeshake: true,
    define,
  },
]);
