// Builds the installable phone/desktop version of Penny Plan (a PWA).
// index.html is written as a page body (that's what the claude.ai Artifact expects),
// so this wraps it in a full document, adds the manifest and offline service worker,
// and copies the icons.  Usage: node budget/build.mjs <out-dir>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, "dist");
mkdirSync(out, { recursive: true });

const body = readFileSync(join(here, "index.html"), "utf8");
const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0e6a56">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Penny Plan">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>`;
const register = `<script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>`;
writeFileSync(join(out, "index.html"), `<!doctype html>\n<html lang="en">\n<head>\n${head}\n</head>\n<body>\n${body}\n${register}\n</body>\n</html>\n`);

const pwa = join(here, "pwa");
for (const f of readdirSync(pwa)) {
  if (f === "sw.js") writeFileSync(join(out, f), readFileSync(join(pwa, f), "utf8").replace("__VERSION__", Date.now().toString(36)));
  else copyFileSync(join(pwa, f), join(out, f));
}
console.log("Built Penny Plan app into " + out);
