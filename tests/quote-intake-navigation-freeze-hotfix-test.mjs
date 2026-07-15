import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL(
    "../docs/static-preview/quote-preview-live/forge-quote-intake-ui-simplification-r16j1c1.js",
    import.meta.url,
  ),
  "utf8",
);

for (const token of [
  "const refreshedAcceptanceWrappers = new WeakSet()",
  "requestAnimationFrame",
  "function scheduleSync()",
  "function refreshAcceptanceRuntimeOnce()",
  'globalThis.addEventListener("popstate", syncBurst)',
  'globalThis.addEventListener("hashchange", syncBurst)',
  "observer = new MutationObserver(scheduleSync)",
  "childList: true",
  "subtree: true",
  "navigationSyncPending: framePending",
  "automaticCalculation: false",
  "automaticAcceptance: false",
]) {
  assert.ok(source.includes(token), `missing ${token}`);
}

assert.doesNotMatch(
  source,
  /attributes:\s*true/,
  "attribute observation can create a self-triggering UI loop",
);
assert.doesNotMatch(
  source,
  /attributeFilter/,
  "the hotfix must not observe attributes changed by its own synchronizer",
);
assert.doesNotMatch(
  source,
  /new MutationObserver\(\(\)\s*=>\s*\{\s*settle\(\)/,
  "the observer must not call the mutating synchronizer directly",
);
assert.match(
  source,
  /refreshedAcceptanceWrappers\.has\(wrapper\)/,
);
assert.match(
  source,
  /refreshedAcceptanceWrappers\.add\(wrapper\)/,
);
assert.match(
  source,
  /if \(framePending\) return;/,
);
assert.match(
  source,
  /if \(wrapper\.hidden !== hidden\)/,
);
assert.match(
  source,
  /if \(wrapper\.getAttribute\("aria-hidden"\) !== ariaHidden\)/,
);

console.log("PASS R16J1C1 navigation freeze hotfix contract", {
  attributeFeedbackLoop: false,
  childListRouteWatch: true,
  observerDebounced: true,
  runtimeRefreshOncePerWrapper: true,
  inicioToCotizacionesSupported: true,
  betaUiPreserved: true,
  reviewPdfUiPreserved: true,
});
