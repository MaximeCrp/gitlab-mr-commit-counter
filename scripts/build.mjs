import { context } from "esbuild";
import { cp, rm } from "node:fs/promises";

const SOURCE_DIR = "src";
const OUTPUT_DIR = "dist";
const STATIC_FILES = ["manifest.json", "icons", "content/content.css", "popup/popup.html", "popup/popup.css"];
const isWatchMode = process.argv.includes("--watch");

const copyStaticFiles = async () => {
  await Promise.all(STATIC_FILES.map((file) => cp(`${SOURCE_DIR}/${file}`, `${OUTPUT_DIR}/${file}`, { recursive: true })));
};

const copyStaticFilesPlugin = {
  name: "copy-static-files",
  setup: (build) => build.onEnd(copyStaticFiles),
};

const buildContext = await context({
  entryPoints: {
    "content/index": `${SOURCE_DIR}/content/index.js`,
    "popup/popup": `${SOURCE_DIR}/popup/popup.js`,
  },
  outdir: OUTPUT_DIR,
  bundle: true,
  format: "iife",
  target: "firefox128",
  logLevel: "info",
  plugins: [copyStaticFilesPlugin],
});

await rm(OUTPUT_DIR, { recursive: true, force: true });

if (isWatchMode) {
  await buildContext.watch();
} else {
  await buildContext.rebuild();
  await buildContext.dispose();
}
