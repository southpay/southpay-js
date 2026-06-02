import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const bundle = new URL("../dist/index.global.js", import.meta.url);
const widgets = new URL("../cdn/widgets/", import.meta.url);

rmSync(widgets, { recursive: true, force: true });
mkdirSync(widgets, { recursive: true });

const pinned = `southpay-js-${pkg.version}.js`;
copyFileSync(bundle, new URL("v2.js", widgets));
copyFileSync(bundle, new URL(pinned, widgets));

const sri = `sha384-${createHash("sha384").update(readFileSync(bundle)).digest("base64")}`;

console.log(`staged cdn/widgets/v2.js and cdn/widgets/${pinned}`);
console.log(`SRI (${pinned}): ${sri}`);
