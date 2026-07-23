import assert from 'node:assert/strict';
import test from 'node:test';

import {
  contractRegistry,
  listContracts,
  validateRegistry
} from '../../platform/contracts/generated/index.mjs';

test('generated contract registry is populated', () => {
  assert.ok(contractRegistry.size > 0);
});

test('generated contract ids are deterministic', () => {
  const ids = listContracts();
  const sorted = [...ids].sort();

  assert.deepEqual(ids, sorted);
  assert.equal(new Set(ids).size, ids.length);
});

test('all generated contracts validate', () => {
  const result = validateRegistry();

  assert.equal(result.valid, true);
  assert.equal(
    result.results.length,
    contractRegistry.size
  );
});

test('unauthorized functional implementations fail closed', () => {
  const unauthorized = [...contractRegistry.values()]
    .filter(
      (module) =>
        module.implementationStatus ===
        'CONTRACT_RUNTIME_ONLY'
    );

  assert.ok(unauthorized.length > 0);

  for (const module of unauthorized) {
    assert.throws(
      () => module.assertFunctionalImplementationAllowed(),
      /FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED/
    );
  }
});
