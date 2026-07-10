"use strict";

const {
  createQuotePreviewConfirmationPopup,
} = require(
  "./quote-preview-confirmation-popup-host.js"
);

function fail(condition, code, message) {
  if (condition) {
    return;
  }

  const error = new Error(message);
  error.code = code;
  throw error;
}

function isObject(value) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function createQuotePreviewPdfFlowPopupInvocation(
  options = {}
) {
  const popup =
    createQuotePreviewConfirmationPopup(options);

  let disposed = false;
  let presentCount = 0;

  function present(input = {}) {
    fail(
      disposed === false,
      "QUOTE_PREVIEW_PDF_FLOW_INVOCATION_DISPOSED",
      "invocation disposed"
    );
    fail(
      isObject(input),
      "QUOTE_PREVIEW_PDF_FLOW_INPUT_REQUIRED",
      "present input required"
    );
    fail(
      isObject(input.nativeResult),
      "QUOTE_PREVIEW_PDF_FLOW_NATIVE_RESULT_REQUIRED",
      "nativeResult required"
    );
    fail(
      isObject(input.context),
      "QUOTE_PREVIEW_PDF_FLOW_CONTEXT_REQUIRED",
      "context required"
    );
    fail(
      input.ambiguity === undefined ||
        isObject(input.ambiguity),
      "QUOTE_PREVIEW_PDF_FLOW_AMBIGUITY_INVALID",
      "ambiguity must be an object when provided"
    );
    fail(
      input.source === undefined ||
        isObject(input.source),
      "QUOTE_PREVIEW_PDF_FLOW_SOURCE_INVALID",
      "source must be an object when provided"
    );

    const preview = Object.freeze({
      nativeResult: input.nativeResult,
      context: input.context,
      ambiguity:
        input.ambiguity === undefined
          ? Object.freeze({})
          : input.ambiguity,
      source:
        input.source === undefined
          ? Object.freeze({})
          : input.source,
    });

    const root = popup.open(preview);
    presentCount += 1;

    return Object.freeze({
      preview,
      root,
    });
  }

  function close(reason = "closed") {
    return popup.close(reason);
  }

  function dispose() {
    if (disposed) {
      return false;
    }

    const popupDisposed = popup.dispose();
    disposed = true;
    return popupDisposed;
  }

  function getState() {
    return Object.freeze({
      disposed,
      presentCount,
      popup: popup.getState(),
    });
  }

  return Object.freeze({
    present,
    close,
    dispose,
    getState,
  });
}

module.exports = Object.freeze({
  createQuotePreviewPdfFlowPopupInvocation,
});
