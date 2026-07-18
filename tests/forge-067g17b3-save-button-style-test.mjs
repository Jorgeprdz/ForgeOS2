import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(
  "advisor-os/sales-pipeline/pipeline-ui.css",
  "utf8",
);

const ui = readFileSync(
  "advisor-os/sales-pipeline/productive-prospect-ui.js",
  "utf8",
);

test("prospect modal renders the canonical save button", () => {
  assert.match(
    ui,
    /class="forge-pipeline-primary"\s+data-save-prospect/,
    "The prospect form must render its canonical save button",
  );

  assert.match(
    ui,
    /type="submit"/,
    "The save action must remain a real submit button",
  );
});

test("save button has a gold fallback outside the Pipeline scope", () => {
  assert.match(
    css,
    /background:var\(--pipeline-accent,var\(--forge-gold-500,#f2cf75\)\)!important/,
    "The modal save button must remain visible when --pipeline-accent is unavailable",
  );
});

test("save button keeps visible dark foreground text", () => {
  assert.match(
    css,
    /\.forge-pipeline-primary\{[^}]*color:#07111f!important/,
    "The save button must retain readable foreground contrast",
  );
});
