import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

let bundle;
try {
  bundle = readFileSync(new URL("dist/index.global.js", root));
} catch {
  console.error("dist/index.global.js not found. Run `npm run build` first.");
  process.exit(1);
}

const pinned = `southpay-js-${pkg.version}.js`;
const sri = `sha384-${createHash("sha384").update(bundle).digest("base64")}`;

const readmeUrl = new URL("README.md", root);
const readme = readFileSync(readmeUrl, "utf8");
const next = readme
  .replace(/widgets\/southpay-js-[^"'\s]+\.js/g, `widgets/${pinned}`)
  .replace(/integrity="sha384-[^"]*"/g, `integrity="${sri}"`);

if (process.argv.includes("--write")) {
  if (next === readme) {
    console.log("README already current");
  } else {
    writeFileSync(readmeUrl, next);
    console.log(`README updated -> ${pinned}, ${sri}`);
  }
} else if (next !== readme) {
  console.error(
    `README pin/SRI is stale. Run: npm run cdn:sri -- --write\n  expected ${pinned}\n  expected ${sri}`,
  );
  process.exit(1);
} else {
  console.log(`README pin/SRI up to date (${pinned})`);
}
