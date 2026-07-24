import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GmmQuotePreparationE2EError,
  runGmmQuotePreparationWorkflow
} from './index.mjs';

test(
  'declared product E2E fails closed until the global campaign materializes it',
  () => {
    assert.throws(
      () => runGmmQuotePreparationWorkflow({}),
      error =>
        error instanceof
          GmmQuotePreparationE2EError
        && error.code ===
          'PRODUCT_E2E_NOT_MATERIALIZED'
    );
  }
);
