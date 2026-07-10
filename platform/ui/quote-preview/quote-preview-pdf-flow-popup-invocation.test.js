"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const invocationPath = path.join(
  __dirname,
  "quote-preview-pdf-flow-popup-invocation.js"
);

const invocationSource = fs.readFileSync(
  invocationPath,
  "utf8"
);

const {
  createQuotePreviewPdfFlowPopupInvocation,
} = require(invocationPath);

const storeModule = require(
  "../../runtime/quote-preview/quote-preview-pdf-result-store.js"
);

const controlledNowMs = Date.parse(
  "2026-07-10T12:00:00.000Z"
);
const ttlMs = 24 * 60 * 60 * 1000;

function expectCode(fn, code) {
  assert.throws(fn, error => {
    assert.equal(error && error.code, code);
    return true;
  });
}

class FakeNode {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.className = "";
    this.textContent = "";
    this.type = "";
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);

    if (index < 0) {
      throw new Error("child not found");
    }

    this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(String(name), String(value));
  }

  getAttribute(name) {
    return this.attributes.has(String(name))
      ? this.attributes.get(String(name))
      : null;
  }

  addEventListener(name, handler) {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }

    this.listeners.get(name).add(handler);
  }

  removeEventListener(name, handler) {
    if (this.listeners.has(name)) {
      this.listeners.get(name).delete(handler);
    }
  }

  dispatch(name, payload) {
    const handlers = this.listeners.has(name)
      ? [...this.listeners.get(name)]
      : [];

    return handlers.map(handler => handler(payload));
  }
}

function createFakeDocument() {
  let createCount = 0;

  return {
    documentLike: {
      createElement(tagName) {
        createCount += 1;
        return new FakeNode(tagName);
      },
    },
    getCreateCount() {
      return createCount;
    },
  };
}

function walk(root) {
  const nodes = [];

  function visit(node) {
    nodes.push(node);

    for (const child of node.children || []) {
      visit(child);
    }
  }

  visit(root);
  return nodes;
}

function findByAttribute(root, name, value) {
  return walk(root).filter(
    node =>
      typeof node.getAttribute === "function" &&
      node.getAttribute(name) === value
  );
}

function createNativeResult(label, annual = 48000) {
  return {
    product: "IMAGINA SER",
    prospect: `PERSONA SINTETICA ${label}`,
    sumInsured: 1500000,
    premiumTable: {
      annual,
      plannedAnnual: null,
    },
    policyTerm: "42 años",
  };
}

function createContext(label) {
  return {
    name: `PRUEBA INVOCACION ${label}`,
    product_family: "life",
  };
}

function createObservedStore() {
  const backend = storeModule.createMemoryBackend();
  const officialStore = storeModule.createStore({
    backend,
    now: () => controlledNowMs,
  });

  let writes = 0;
  let reads = 0;

  return {
    store: {
      writePreviewResult(input) {
        writes += 1;
        return officialStore.writePreviewResult(input);
      },

      readPreviewResult(identity) {
        reads += 1;
        return officialStore.readPreviewResult(identity);
      },
    },

    metrics() {
      return { writes, reads };
    },
  };
}

function createHarness() {
  const fakeDocument = createFakeDocument();
  const mountTarget = new FakeNode("main");
  const observedStore = createObservedStore();
  const persisted = [];
  const edits = [];
  const closed = [];
  const errors = [];

  const invocation =
    createQuotePreviewPdfFlowPopupInvocation({
      documentLike: fakeDocument.documentLike,
      mountTarget,
      store: observedStore.store,
      createPreviewResultId(preview) {
        return `invoke-${preview.source.label.toLowerCase()}`;
      },
      now: () => controlledNowMs,
      ttlMs,
      onPersisted(result, preview, payload) {
        persisted.push({ result, preview, payload });
      },
      onEditRequested(preview, payload) {
        edits.push({ preview, payload });
      },
      onClosed(reason, preview) {
        closed.push({ reason, preview });
      },
      onError(error, context) {
        errors.push({ error, context });
      },
    });

  return {
    invocation,
    fakeDocument,
    mountTarget,
    observedStore,
    persisted,
    edits,
    closed,
    errors,
  };
}

function run() {
  assert.equal(
    typeof createQuotePreviewPdfFlowPopupInvocation,
    "function"
  );

  expectCode(
    () => createQuotePreviewPdfFlowPopupInvocation(),
    "QUOTE_PREVIEW_POPUP_DOCUMENT_LIKE_REQUIRED"
  );

  const harness = createHarness();

  assert.equal(harness.fakeDocument.getCreateCount(), 0);
  assert.equal(harness.mountTarget.children.length, 0);
  assert.deepStrictEqual(harness.invocation.getState(), {
    disposed: false,
    presentCount: 0,
    popup: {
      open: false,
      disposed: false,
      pendingPreviewPresent: false,
      openCount: 0,
      closeCount: 0,
      lastCloseReason: null,
    },
  });

  expectCode(
    () => harness.invocation.present(),
    "QUOTE_PREVIEW_PDF_FLOW_NATIVE_RESULT_REQUIRED"
  );

  expectCode(
    () => harness.invocation.present({
      nativeResult: createNativeResult("NO_CONTEXT"),
    }),
    "QUOTE_PREVIEW_PDF_FLOW_CONTEXT_REQUIRED"
  );

  expectCode(
    () => harness.invocation.present({
      nativeResult: createNativeResult("BAD_AMBIGUITY"),
      context: createContext("BAD_AMBIGUITY"),
      ambiguity: [],
    }),
    "QUOTE_PREVIEW_PDF_FLOW_AMBIGUITY_INVALID"
  );

  expectCode(
    () => harness.invocation.present({
      nativeResult: createNativeResult("BAD_SOURCE"),
      context: createContext("BAD_SOURCE"),
      source: "bad",
    }),
    "QUOTE_PREVIEW_PDF_FLOW_SOURCE_INVALID"
  );

  const nativeAlfa = createNativeResult("ALFA");
  const contextAlfa = createContext("ALFA");

  const first = harness.invocation.present({
    nativeResult: nativeAlfa,
    context: contextAlfa,
  });

  assert.strictEqual(
    first.preview.nativeResult,
    nativeAlfa
  );
  assert.strictEqual(first.preview.context, contextAlfa);
  assert.deepStrictEqual(first.preview.ambiguity, {});
  assert.deepStrictEqual(first.preview.source, {});
  assert.equal(Object.isFrozen(first.preview), true);
  assert.equal(
    harness.mountTarget.children.length,
    1
  );
  assert.strictEqual(
    harness.mountTarget.children[0],
    first.root
  );

  const fieldRows = walk(first.root).filter(
    node =>
      typeof node.getAttribute === "function" &&
      node.getAttribute("data-quote-preview-field")
  );

  assert.equal(fieldRows.length, 8);

  const ambiguityBeta = {
    annualPremium: {
      reason: "controlled test ambiguity",
    },
  };
  const sourceBeta = {
    label: "BETA",
    controlledTest: true,
  };
  const nativeBeta = createNativeResult("BETA", 52000);
  const contextBeta = createContext("BETA");

  const second = harness.invocation.present({
    nativeResult: nativeBeta,
    context: contextBeta,
    ambiguity: ambiguityBeta,
    source: sourceBeta,
  });

  assert.strictEqual(second.root, first.root);
  assert.equal(harness.mountTarget.children.length, 1);
  assert.strictEqual(
    second.preview.nativeResult,
    nativeBeta
  );
  assert.strictEqual(second.preview.context, contextBeta);
  assert.strictEqual(
    second.preview.ambiguity,
    ambiguityBeta
  );
  assert.strictEqual(second.preview.source, sourceBeta);

  const insuredValue = findByAttribute(
    second.root,
    "data-quote-preview-value",
    "insured"
  )[0];

  assert.equal(
    insuredValue.textContent,
    "PERSONA SINTETICA BETA"
  );

  assert.deepStrictEqual(
    harness.observedStore.metrics(),
    { writes: 0, reads: 0 }
  );

  const acceptButton = findByAttribute(
    second.root,
    "data-quote-preview-action",
    "accept"
  )[0];

  const acceptResults = acceptButton.dispatch(
    "click",
    { origin: "invocation-accept" }
  );

  assert.equal(acceptResults.length, 1);
  assert.equal(
    acceptResults[0].identity.previewResultId,
    "invoke-beta"
  );
  assert.deepStrictEqual(
    harness.observedStore.metrics(),
    { writes: 1, reads: 1 }
  );
  assert.equal(harness.persisted.length, 1);
  assert.strictEqual(
    harness.persisted[0].preview,
    second.preview
  );
  assert.equal(harness.mountTarget.children.length, 0);

  const editNative = createNativeResult("EDIT");
  const editContext = createContext("EDIT");
  const editSource = {
    label: "EDIT",
    controlledTest: true,
  };

  const editPresentation = harness.invocation.present({
    nativeResult: editNative,
    context: editContext,
    source: editSource,
  });

  const editButton = findByAttribute(
    editPresentation.root,
    "data-quote-preview-action",
    "edit"
  )[0];

  const beforeEdit = harness.observedStore.metrics();

  const editResults = editButton.dispatch(
    "click",
    { origin: "invocation-edit" }
  );

  assert.deepStrictEqual(editResults, [
    {
      action: "edit",
      persisted: false,
    },
  ]);
  assert.deepStrictEqual(
    harness.observedStore.metrics(),
    beforeEdit
  );
  assert.equal(harness.edits.length, 1);
  assert.strictEqual(
    harness.edits[0].preview,
    editPresentation.preview
  );
  assert.equal(harness.mountTarget.children.length, 0);

  const closePresentation = harness.invocation.present({
    nativeResult: createNativeResult("CLOSE"),
    context: createContext("CLOSE"),
    source: {
      label: "CLOSE",
    },
  });

  assert.ok(closePresentation.root);
  assert.equal(harness.invocation.close("manual"), true);
  assert.equal(harness.invocation.close("again"), false);
  assert.equal(harness.mountTarget.children.length, 0);
  assert.equal(
    harness.invocation.getState().popup.lastCloseReason,
    "manual"
  );

  assert.equal(harness.invocation.dispose(), true);
  assert.equal(harness.invocation.dispose(), false);

  expectCode(
    () => harness.invocation.present({
      nativeResult: createNativeResult("LATE"),
      context: createContext("LATE"),
    }),
    "QUOTE_PREVIEW_PDF_FLOW_INVOCATION_DISPOSED"
  );

  assert.equal(
    /\b(?:readFile|readFileSync|createReadStream|openSync|readdir|statSync)\b/.test(
      invocationSource
    ),
    false
  );
  assert.equal(
    /\brequire\(\s*["'](?:fs|fs\/promises)["']\s*\)/.test(
      invocationSource
    ),
    false
  );
  assert.equal(
    /\b(?:ocr|extractPdf|pdfExtractor|pdfjs|pdf-parse|tesseract)\b/i.test(
      invocationSource
    ),
    false
  );
  assert.equal(
    /\blocalStorage\b/.test(invocationSource),
    false
  );
  assert.equal(/\bwindow\b/.test(invocationSource), false);
  assert.equal(
    /\bquerySelector\b|\bgetElementById\b/.test(
      invocationSource
    ),
    false
  );
  assert.equal(
    /\bcreateStore\b|\bcreateMemoryBackend\b/.test(
      invocationSource
    ),
    false
  );
  assert.equal(
    /\b(?:router|routing|dashboard|fullPage|full-page)\b/i.test(
      invocationSource
    ),
    false
  );

  const requireMatches = [
    ...invocationSource.matchAll(
      /require\(\s*["']([^"']+)["']\s*\)/g
    ),
  ].map(match => match[1]);

  assert.deepStrictEqual(requireMatches, [
    "./quote-preview-confirmation-popup-host.js",
  ]);

  const result = {
    chain:
      "107Z15E8N_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_SCOPED_IMPLEMENTATION_GATE",
    status: "PASS",
    testsPass: true,
    testCount: 16,
    noUiBeforePresent: true,
    missingNativeResultRejected: true,
    missingContextRejected: true,
    invalidAmbiguityRejected: true,
    invalidSourceRejected: true,
    nativeResultReferencePreserved: true,
    contextReferencePreserved: true,
    defaultAmbiguityPass: true,
    defaultSourcePass: true,
    explicitAmbiguityForwarded: true,
    explicitSourceForwarded: true,
    mountsExactlyOnePopupRoot: true,
    canonicalFieldCount: 8,
    repeatedPresentUsesSamePopupRoot: true,
    presentStoreWrites: 0,
    presentStoreReads: 0,
    acceptPersistencePass: true,
    editStoreWrites: 0,
    editStoreReads: 0,
    closeDelegationPass: true,
    disposeIdempotent: true,
    presentAfterDisposeRejected: true,
    pdfReadIntroduced: false,
    extractionIntroduced: false,
    ocrIntroduced: false,
    automaticDiscoveryIntroduced: false,
    directLocalStorageAccess: false,
    backendCreation: false,
    routingIntroduced: false,
    dashboardIntroduced: false,
    invocationExport:
      "createQuotePreviewPdfFlowPopupInvocation",
    next:
      "107Z15E8O_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_CLOSURE_GATE",
  };

  if (process.env.TEST_RESULT_JSON) {
    fs.writeFileSync(
      process.env.TEST_RESULT_JSON,
      JSON.stringify(result, null, 2) + "\n"
    );
  }

  console.log(
    "PASS_107Z15E8N_INVOCATION_UNIT_TESTS=true"
  );
  console.log("TEST_COUNT=16");
  console.log("NO_UI_BEFORE_PRESENT=true");
  console.log("PRESENT_STORE_WRITES=0");
  console.log("PRESENT_STORE_READS=0");
  console.log("ACCEPT_PERSISTENCE_PASS=true");
  console.log("EDIT_STORE_WRITES=0");
  console.log("EDIT_STORE_READS=0");
}

try {
  run();
} catch (error) {
  const result = {
    chain:
      "107Z15E8N_EXPLICIT_PDF_FLOW_POPUP_INVOCATION_SCOPED_IMPLEMENTATION_GATE",
    status: "HOLD",
    testsPass: false,
    exactError:
      error && error.stack ? error.stack : String(error),
  };

  if (process.env.TEST_RESULT_JSON) {
    fs.writeFileSync(
      process.env.TEST_RESULT_JSON,
      JSON.stringify(result, null, 2) + "\n"
    );
  }

  console.error(
    "HOLD_107Z15E8N_INVOCATION_UNIT_TESTS=true"
  );
  console.error(
    error && error.stack ? error.stack : String(error)
  );
  process.exitCode = 1;
}
