import assert from 'node:assert/strict';

import { CARRIER_ADAPTER_VALUE_STATES } from '../revenue/carrier-revenue-adapter-contract.js';
import { createNotModeledCarrierAdapter } from '../revenue/adapters/not-modeled-carrier-adapter.js';

const axa = createNotModeledCarrierAdapter({
  carrierId: 'AXA',
  carrierName: 'AXA',
});

const axaResult = axa.calculateFromPaymentEvent({
  evidenceRefs: ['PAY_1'],
  currency: 'MXN',
});

assert.equal(axaResult.carrierId, 'AXA');
assert.equal(axaResult.valueState, CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED);
assert.equal(axaResult.amount, null);
assert.deepEqual(axaResult.evidenceRefs, ['PAY_1']);
assert.equal(axaResult.warnings.includes('CARRIER_RULE_PACK_NOT_MODELED'), true);

const gnp = createNotModeledCarrierAdapter({
  carrierId: 'GNP',
  carrierName: 'GNP',
});

const gnpResult = gnp.calculateFromConfirmedPolicy({
  evidenceRefs: ['POL_1'],
});

assert.equal(gnpResult.carrierId, 'GNP');
assert.equal(gnpResult.valueState, CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED);
assert.equal(gnpResult.amount, null);

console.log('PASS not-modeled-carrier-adapter-test');
