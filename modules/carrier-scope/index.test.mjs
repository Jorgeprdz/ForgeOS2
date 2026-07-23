import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CarrierScopeError,
  assertCarrierScope,
  createCarrierScope,
  isCarrierScope
} from './index.mjs';

test('creates canonical scope', () => {
  const scope = createCarrierScope({
    carrier: 'SMNYL',
    market: 'Mexico',
    productLine: 'Vida-Individual'
  });

  assert.deepEqual(scope, {
    kind: 'carrier-scope',
    version: 1,
    carrier: 'smnyl',
    market: 'mexico',
    productLine: 'vida-individual',
    canonical: 'smnyl:mexico:vida-individual'
  });
  assert.equal(Object.isFrozen(scope), true);
});

test('supports no product line', () => {
  const scope = createCarrierScope({ carrier: 'smnyl', market: 'mexico' });
  assert.equal(scope.productLine, null);
  assert.equal(scope.canonical, 'smnyl:mexico');
});

test('rejects invalid tokens', () => {
  assert.throws(
    () => createCarrierScope({ carrier: 'SM NYL', market: 'mexico' }),
    CarrierScopeError
  );
});

test('asserts valid scope', () => {
  const scope = createCarrierScope({ carrier: 'smnyl', market: 'mexico' });
  assert.equal(assertCarrierScope(scope), scope);
  assert.equal(isCarrierScope(scope), true);
  assert.equal(isCarrierScope({}), false);
});
