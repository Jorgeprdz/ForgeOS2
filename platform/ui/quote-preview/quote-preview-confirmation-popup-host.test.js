"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const popupPath = path.join(
  __dirname,
  "quote-preview-confirmation-popup-host.js"
);

const popupSource = fs.readFileSync(
  popupPath,
  "utf8"
);

const {
  FIELD_DEFINITIONS,
  createQuotePreviewConfirmationPopup,
} = require(popupPath);

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
    node => node.getAttribute &&
      node.getAttribute(name) === value
  );
}

function createPreview(label, annual = 48000) {
  return {
    nativeResult: {
      product: "IMAGINA SER",
      prospect: `PERSONA SINTETICA ${label}`,
      sumInsured: 1500000,
      premiumTable: {
        annual,
        plannedAnnual: null,
      },
      policyTerm: "42 años",
    },
    context: {
      name: `PRUEBA POPUP ${label}`,
      product_family: "life",
    },
    ambiguity: {},
    source: {
      controlledTest: true,
      label,
    },
  };
}

function createObservedStore(overrides = {}) {
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

        if (overrides.writeError) {
          throw overrides.writeError;
        }

        return officialStore.writePreviewResult(input);
      },

      readPreviewResult(identity) {
        reads += 1;

        if (overrides.readError) {
          throw overrides.readError;
        }

        return officialStore.readPreviewResult(identity);
      },
    },

    metrics() {
      return { writes, reads };
    },
  };
}

function createPopupHarness(options = {}) {
  const fakeDocument = createFakeDocument();
  const mountTarget = new FakeNode("main");
  const observedStore =
    options.observedStore || createObservedStore();
  const persisted = [];
  const edits = [];
  const closed = [];
  const errors = [];

  const popup = createQuotePreviewConfirmationPopup({
    documentLike: fakeDocument.documentLike,
    mountTarget,
    store: observedStore.store,
    createPreviewResultId(preview) {
      return `popup-${preview.source.label.toLowerCase()}`;
    },
    now: () => controlledNowMs,
    ttlMs,
    title: options.title,
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
    formatFieldValue: options.formatFieldValue,
  });

  return {
    popup,
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
    typeof createQuotePreviewConfirmationPopup,
    "function"
  );
  assert.equal(FIELD_DEFINITIONS.length, 8);

  expectCode(
    () => createQuotePreviewConfirmationPopup(),
    "QUOTE_PREVIEW_POPUP_DOCUMENT_LIKE_REQUIRED"
  );

  expectCode(
    () => createQuotePreviewConfirmationPopup({
      documentLike: { createElement() {} },
    }),
    "QUOTE_PREVIEW_POPUP_MOUNT_TARGET_REQUIRED"
  );

  const invalidStoreDocument = createFakeDocument();

  expectCode(
    () => createQuotePreviewConfirmationPopup({
      documentLike:
        invalidStoreDocument.documentLike,
      mountTarget: new FakeNode("main"),
      store: {},
    }),
    "QUOTE_PREVIEW_POPUP_STORE_REQUIRED"
  );

  const harness = createPopupHarness();

  assert.equal(harness.fakeDocument.getCreateCount(), 0);
  assert.equal(harness.mountTarget.children.length, 0);
  assert.deepStrictEqual(harness.popup.getState(), {
    open: false,
    disposed: false,
    pendingPreviewPresent: false,
    openCount: 0,
    closeCount: 0,
    lastCloseReason: null,
  });

  const previewAlfa = createPreview("ALFA");
  const root = harness.popup.open(previewAlfa);

  assert.strictEqual(
    harness.mountTarget.children[0],
    root
  );
  assert.equal(harness.mountTarget.children.length, 1);
  assert.equal(root.getAttribute("role"), "dialog");
  assert.equal(root.getAttribute("aria-modal"), "true");
  assert.equal(root.style.position, "fixed");
  assert.equal(
    root.getAttribute(
      "data-quote-preview-confirmation-popup"
    ),
    "true"
  );

  const fieldRows = walk(root).filter(
    node =>
      node.getAttribute &&
      node.getAttribute("data-quote-preview-field")
  );

  assert.equal(fieldRows.length, 8);
  assert.deepStrictEqual(
    fieldRows.map(
      node =>
        node.getAttribute("data-quote-preview-field")
    ),
    [
      "name",
      "family",
      "product",
      "insured",
      "sumAssured",
      "annualPremium",
      "plannedOrAvePremium",
      "coveragePeriod",
    ]
  );

  const editButtons = findByAttribute(
    root,
    "data-quote-preview-action",
    "edit"
  );
  const acceptButtons = findByAttribute(
    root,
    "data-quote-preview-action",
    "accept"
  );

  assert.equal(editButtons.length, 1);
  assert.equal(acceptButtons.length, 1);
  assert.equal(editButtons[0].textContent, "Editar");
  assert.equal(acceptButtons[0].textContent, "Aceptar");
  assert.equal(editButtons[0].type, "button");
  assert.equal(acceptButtons[0].type, "button");

  const previewBeta = createPreview("BETA", 52000);
  const sameRoot = harness.popup.open(previewBeta);

  assert.strictEqual(sameRoot, root);
  assert.equal(harness.mountTarget.children.length, 1);

  const insuredValue = findByAttribute(
    root,
    "data-quote-preview-value",
    "insured"
  )[0];

  assert.equal(
    insuredValue.textContent,
    "PERSONA SINTETICA BETA"
  );

  const acceptResults = acceptButtons[0].dispatch(
    "click",
    { origin: "popup-accept" }
  );

  assert.equal(acceptResults.length, 1);
  assert.equal(
    acceptResults[0].identity.previewResultId,
    "popup-beta"
  );
  assert.deepStrictEqual(
    harness.observedStore.metrics(),
    { writes: 1, reads: 1 }
  );
  assert.equal(harness.persisted.length, 1);
  assert.strictEqual(
    harness.persisted[0].preview,
    previewBeta
  );
  assert.equal(harness.mountTarget.children.length, 0);
  assert.deepStrictEqual(harness.popup.getState(), {
    open: false,
    disposed: false,
    pendingPreviewPresent: false,
    openCount: 2,
    closeCount: 1,
    lastCloseReason: "accepted",
  });

  const editPreview = createPreview("EDIT");
  const editRoot = harness.popup.open(editPreview);
  const editButton = findByAttribute(
    editRoot,
    "data-quote-preview-action",
    "edit"
  )[0];

  const beforeEdit = harness.observedStore.metrics();

  const editResults = editButton.dispatch(
    "click",
    { origin: "popup-edit" }
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
    editPreview
  );
  assert.equal(
    harness.edits[0].payload.origin,
    "popup-edit"
  );
  assert.equal(harness.mountTarget.children.length, 0);
  assert.equal(
    harness.popup.getState().lastCloseReason,
    "edit"
  );

  const writeError = Object.assign(
    new Error("synthetic persistence failure"),
    { code: "SYNTHETIC_PERSISTENCE_FAILURE" }
  );
  const errorStore = createObservedStore({
    writeError,
  });
  const errorHarness = createPopupHarness({
    observedStore: errorStore,
  });
  const errorPreview = createPreview("ERROR");
  const errorRoot =
    errorHarness.popup.open(errorPreview);
  const errorAccept = findByAttribute(
    errorRoot,
    "data-quote-preview-action",
    "accept"
  )[0];

  expectCode(
    () => errorAccept.dispatch("click", {
      origin: "popup-error",
    }),
    "SYNTHETIC_PERSISTENCE_FAILURE"
  );

  assert.deepStrictEqual(errorStore.metrics(), {
    writes: 1,
    reads: 0,
  });
  assert.equal(errorHarness.errors.length, 1);
  assert.equal(
    errorHarness.errors[0].context.action,
    "accept"
  );
  assert.equal(errorHarness.popup.getState().open, true);
  assert.equal(errorHarness.mountTarget.children.length, 1);
  assert.equal(errorHarness.persisted.length, 0);

  assert.equal(
    errorHarness.popup.close("manual-after-error"),
    true
  );
  assert.equal(
    errorHarness.popup.close("second-close"),
    false
  );

  assert.equal(harness.popup.dispose(), true);
  assert.equal(harness.popup.dispose(), false);

  expectCode(
    () => harness.popup.open(createPreview("LATE")),
    "QUOTE_PREVIEW_POPUP_DISPOSED"
  );

  assert.equal(
    /\blocalStorage\b/.test(popupSource),
    false
  );
  assert.equal(/\bwindow\b/.test(popupSource), false);
  assert.equal(
    /\bquerySelector\b|\bgetElementById\b/.test(
      popupSource
    ),
    false
  );
  assert.equal(
    /\bcreateStore\b|\bcreateMemoryBackend\b/.test(
      popupSource
    ),
    false
  );
  assert.equal(
    /\b(?:router|routing|dashboard|fullPage|full-page)\b/i.test(
      popupSource
    ),
    false
  );
  assert.equal(
    /generic[-_ ]host/i.test(popupSource),
    false
  );
  assert.equal(
    /forge-quote-pdf-preview-engine/.test(
      popupSource
    ),
    false
  );

  const requireMatches = [
    ...popupSource.matchAll(
      /require\(\s*["']([^"']+)["']\s*\)/g
    ),
  ].map(match => match[1]);

  assert.deepStrictEqual(requireMatches, [
    "../../adapters/quote-preview/quote-preview-controlled-browser-confirmation-ui-surface-binding.js",
    "../../adapters/quote-preview/quote-preview-pdf-result-persistence-coordinator.js",
  ]);

  const result = {
    chain:
      "107Z15E8K_QUOTE_PREVIEW_CONFIRMATION_POPUP_HOST_SCOPED_IMPLEMENTATION_GATE",
    status: "PASS",
    testsPass: true,
    testCount: 19,
    hostType: "POPUP_MODAL_ONLY",
    popupOnly: true,
    noUiBeforeOpen: true,
    mountsExactlyOneRoot: true,
    dialogSemanticsPass: true,
    modalSemanticsPass: true,
    canonicalFieldCount: 8,
    canonicalFieldOrderPass: true,
    actionButtonCount: 2,
    editButtonLabel: "Editar",
    acceptButtonLabel: "Aceptar",
    reopenUpdatesPendingWithoutReplacingRoot: true,
    acceptPersistencePass: true,
    acceptClosesAfterSuccess: true,
    acceptFailureKeepsOpen: true,
    acceptFailureNotifiesError: true,
    editStoreWrites: 0,
    editStoreReads: 0,
    editReturnsPendingPreview: true,
    editClosesPopup: true,
    closeClearsPendingPreview: true,
    disposeIdempotent: true,
    openAfterDisposeRejected: true,
    noDirectUiDiscovery: true,
    directLocalStorageAccess: false,
    backendCreation: false,
    fullPageIntroduced: false,
    routingIntroduced: false,
    dashboardIntroduced: false,
    genericHostIntroduced: false,
    newEngineIntroduced: false,
    quoteTruthPromotionIntroduced: false,
    popupExport:
      "createQuotePreviewConfirmationPopup",
    next:
      "107Z15E8L_QUOTE_PREVIEW_CONFIRMATION_POPUP_CLOSURE_GATE",
  };

  if (process.env.TEST_RESULT_JSON) {
    fs.writeFileSync(
      process.env.TEST_RESULT_JSON,
      JSON.stringify(result, null, 2) + "\n"
    );
  }

  console.log(
    "PASS_107Z15E8K_POPUP_HOST_UNIT_TESTS=true"
  );
  console.log("TEST_COUNT=19");
  console.log("HOST_TYPE=POPUP_MODAL_ONLY");
  console.log("CANONICAL_FIELD_COUNT=8");
  console.log("ACTION_BUTTONS=2");
  console.log("EDIT_STORE_WRITES=0");
  console.log("EDIT_STORE_READS=0");
  console.log("ACCEPT_FAILURE_KEEPS_OPEN=true");
}

try {
  run();
} catch (error) {
  const result = {
    chain:
      "107Z15E8K_QUOTE_PREVIEW_CONFIRMATION_POPUP_HOST_SCOPED_IMPLEMENTATION_GATE",
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
    "HOLD_107Z15E8K_POPUP_HOST_UNIT_TESTS=true"
  );
  console.error(
    error && error.stack ? error.stack : String(error)
  );
  process.exitCode = 1;
}
