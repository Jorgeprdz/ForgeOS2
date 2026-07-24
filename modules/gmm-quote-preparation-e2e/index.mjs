export class GmmQuotePreparationE2EError
  extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name =
      'GmmQuotePreparationE2EError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

function unavailable() {
  throw new GmmQuotePreparationE2EError(
    'PRODUCT_E2E_NOT_MATERIALIZED'
  );
}

export function runGmmQuotePreparationWorkflow() {
  return unavailable();
}

export function assertGmmQuotePreparationResult() {
  return unavailable();
}
