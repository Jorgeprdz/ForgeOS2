import assert from 'node:assert/strict';

import {
  CARRIER_ADAPTER_SOURCE_STATES,
  CARRIER_ADAPTER_VALUE_STATES,
  createCarrierAdapterResult,
  createCarrierRuleAdapter,
  validateCarrierRuleAdapter,
} from '../revenue/carrier-revenue-adapter-contract.js';

const input = {
  evidenceRefs: ['EVID_1'],
};

const snapshot = JSON.stringify(input);

const adapter = createCarrierRuleAdapter({
  carrierId: 'TEST',
  carrierName: 'Test Carrier',
  sourceState: CARRIER_ADAPTER_SOURCE_STATES.PARTIAL_SOURCE,
  warnings: ['SOURCE_WARNING'],
  canCalculate: () => true,
  calculateFromConfirmedPolicy: (data) => createCarrierAdapterResult({
    carrierId: 'TEST',
    carrierName: 'Test Carrier',
    calculationType: 'confirmed_policy',
    valueState: CARRIER_ADAPTER_VALUE_STATES.UNKNOWN,
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.PARTIAL_SOURCE,
    evidenceRefs: data.evidenceRefs,
    warnings: ['SOURCE_WARNING'],
  }),
});

assert.equal(validateCarrierRuleAdapter(adapter).valid, true);

const invalid = validateCarrierRuleAdapter({
  carrierId: 'BROKEN',
});

assert.equal(invalid.valid, false);
assert.equal(invalid.missingFunctions.includes('calculateFromPaymentEvent'), true);

const result = adapter.calculateFromConfirmedPolicy(input);

assert.equal(result.carrierId, 'TEST');
assert.equal(result.sourceState, CARRIER_ADAPTER_SOURCE_STATES.PARTIAL_SOURCE);
assert.deepEqual(result.evidenceRefs, ['EVID_1']);
assert.deepEqual(result.warnings, ['SOURCE_WARNING']);
assert.equal(JSON.stringify(input), snapshot);

console.log('PASS carrier-revenue-adapter-contract-test');
