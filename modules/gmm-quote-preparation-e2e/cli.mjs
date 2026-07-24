import {
  GmmQuotePreparationE2EError
} from './index.mjs';

export function runCli() {
  throw new GmmQuotePreparationE2EError(
    'PRODUCT_E2E_NOT_MATERIALIZED'
  );
}
