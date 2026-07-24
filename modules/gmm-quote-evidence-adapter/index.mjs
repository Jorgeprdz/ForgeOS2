export const GMM_QUOTE_CONTRACT_VERSION =
  '1.0.0';

export class GmmQuoteEvidenceAdapterError
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
      'GmmQuoteEvidenceAdapterError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

function unavailable() {
  throw new GmmQuoteEvidenceAdapterError(
    'INTEGRATION_NOT_MATERIALIZED'
  );
}

export function canonicalizeGmmQuoteFixture() {
  return unavailable();
}

export function createGmmQuoteFixtureFingerprint() {
  return unavailable();
}

export function ingestGmmQuoteEvidence() {
  return unavailable();
}

export function assertGmmQuoteEvidenceBatch() {
  return unavailable();
}
