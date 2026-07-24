import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GmmQuoteEvidenceAdapterError,
  ingestGmmQuoteEvidence
} from './index.mjs';

test(
  'declared integration fails closed until the global campaign materializes it',
  () => {
    assert.throws(
      () => ingestGmmQuoteEvidence({}),
      error =>
        error instanceof
          GmmQuoteEvidenceAdapterError
        && error.code ===
          'INTEGRATION_NOT_MATERIALIZED'
    );
  }
);
