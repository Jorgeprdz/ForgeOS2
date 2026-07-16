import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = relative =>
  readFile(new URL(relative, root), "utf8");

const [parser, bridge, loader] = await Promise.all([
  read("docs/static-preview/quote-preview-live/forge-pdf-browser-parser.js"),
  read("docs/static-preview/quote-preview-live/forge-accepted-quote-bridge.js"),
  read("docs/static-preview/forge-alive/forge-alive-runtime-lazy-loader-r16j1c1.js"),
]);

assert.match(parser, /forge:accepted-quote-packet-ready/);
assert.match(parser, /automaticAcceptance:\s*false/);
assert.doesNotMatch(parser, /Listo para continuar/);
assert.match(
  parser,
  /Abriendo confirmación para revisión humana/,
);
assert.doesNotMatch(parser, /\.accepted-quote\.json/);

assert.equal(
  bridge.match(
    /createQuotePreviewPdfFlowPopupInvocation\(\{/g,
  )?.length,
  1,
);
assert.equal(
  bridge.match(/invocation\.present\(\{/g)?.length,
  2,
);
assert.match(
  bridge,
  /addEventListener\(\s*"forge:accepted-quote-packet-ready"/,
);
assert.match(bridge, /packet = validatePacket\(event\?\.detail\?\.packet\)/);
assert.match(bridge, /currentQuoteCandidateR16J0A = packet/);
assert.match(bridge, /applyPacketToExistingPage\?\.\(packet\)/);
assert.match(bridge, /await calculateCurrentQuoteCandidatePreview\(\)/);
assert.match(bridge, /buildOrviConfirmationPreview\(packet\)/);

for (const field of [
  "nativeResult:",
  "context:",
  "ambiguity:",
  "source:",
]) {
  assert.equal(
    bridge.split(field).length >= 3,
    true,
    `automatic and manual handoffs must include ${field}`,
  );
}

assert.match(
  loader,
  /forge-accepted-quote-bridge\.js\?v=r16j1c1-popup-handoff-03c2-20260716-1/,
);
assert.match(
  loader,
  /forge-quote-acceptance-entrypoint-r16j0a\.js\?v=r16j1c1-auto-calculation-03b-20260715-1/,
);
assert.doesNotMatch(
  bridge,
  /confirmCurrentQuoteCandidate\(\);/,
);

console.log("PASS direct PDF packet opens existing human confirmation popup");
