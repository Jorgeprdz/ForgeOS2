import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const root = process.cwd();
const sourceDir = join(root, "advisor-os/presentation/browser");
const targetDir = join(
  root,
  "docs/static-preview/advisor-presentation-runtime",
);
const files = [
  "forge-sales-presentation-browser-context-adapter.js",
  "forge-sales-presentation-editable-preview.js",
  "forge-sales-presentation-export-adapter.js",
  "forge-sales-presentation-human-approval-gate.js",
  "forge-sales-presentation-prompt-builder.js",
  "forge-sales-presentation-review-packet-builder.js",
  "forge-sales-presentation-review-state-store.js",
  "forge-sales-presentation-slide-plan-generator.js",
];

await mkdir(targetDir, { recursive: true });
for (const file of files) {
  await copyFile(join(sourceDir, file), join(targetDir, basename(file)));
}

await writeFile(
  join(targetDir, "GENERATED_FROM_ADVISOR_OS.md"),
  [
    "# Generated Advisor OS Presentation Runtime",
    "",
    "Canonical source: `advisor-os/presentation/browser/`",
    "Generator: `scripts/build-advisor-presentation-pages-runtime.mjs`",
    "Distribution authority: read-only GitHub Pages browser artifact",
    "Writable presentation authority: Advisor OS only",
    "",
  ].join("\n"),
);

for (const file of files) {
  const source = await readFile(join(sourceDir, file), "utf8");
  const generated = await readFile(join(targetDir, file), "utf8");
  if (source !== generated) {
    throw new Error(`Generated runtime mismatch: ${file}`);
  }
}

console.log(`Generated ${files.length} Advisor OS Pages runtime modules.`);
