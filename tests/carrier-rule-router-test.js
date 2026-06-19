import assert from 'node:assert/strict';

import { CARRIER_ADAPTER_VALUE_STATES } from '../revenue/carrier-revenue-adapter-contract.js';
import { createCarrierRuleRouter } from '../revenue/carrier-rule-router.js';
import { createSmnylRevenueAdapter } from '../revenue/adapters/smnyl-revenue-adapter.js';

const router = createCarrierRuleRouter({
  adapters: [
    createSmnylRevenueAdapter(),
  ],
});

const confirmedSmnylPolicy = {
  confirmationState: 'confirmed',
  carrierId: 'SMNYL',
  productName: 'Star Temporal',
  policyNumber: 'POL-1',
  currency: 'MXN',
  paymentFrequency: 'monthly',
  evidenceRefs: ['POL_EVID_1'],
};

const snapshot = JSON.stringify(confirmedSmnylPolicy);
const smnylResult = router.routeConfirmedPolicyToCarrierAdapter(confirmedSmnylPolicy);

assert.equal(smnylResult.carrierId, 'SMNYL');
assert.equal(smnylResult.calculationType, 'confirmed_policy');
assert.deepEqual(smnylResult.evidenceRefs, ['POL_EVID_1']);
assert.equal(JSON.stringify(confirmedSmnylPolicy), snapshot);

const unconfirmed = router.routeConfirmedPolicyToCarrierAdapter({
  carrierId: 'SMNYL',
  policyNumber: 'POL-1',
  evidenceRefs: ['POL_EVID_2'],
});

assert.equal(unconfirmed.valueState, CARRIER_ADAPTER_VALUE_STATES.BLOCKED);
assert.equal(unconfirmed.metadata.blockReason, 'unconfirmed_input');

const unknownCarrier = router.routeConfirmedPolicyToCarrierAdapter({
  confirmationState: 'confirmed',
  policyNumber: 'POL-2',
  evidenceRefs: ['POL_EVID_3'],
});

assert.equal(unknownCarrier.metadata.blockReason, 'missing_carrier');
assert.notEqual(unknownCarrier.carrierId, 'SMNYL');

const axa = router.routeConfirmedPolicyToCarrierAdapter({
  confirmationState: 'confirmed',
  carrierId: 'AXA',
  carrierName: 'AXA',
  policyNumber: 'AXA-1',
  evidenceRefs: ['AXA_POL'],
});

assert.equal(axa.carrierId, 'AXA');
assert.equal(axa.valueState, CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED);

const gnp = router.routeConfirmedPolicyToCarrierAdapter({
  confirmationState: 'confirmed',
  carrierId: 'GNP',
  carrierName: 'GNP',
  policyNumber: 'GNP-1',
  evidenceRefs: ['GNP_POL'],
});

assert.equal(gnp.carrierId, 'GNP');
assert.equal(gnp.valueState, CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED);

const missingAmount = router.routePaymentEventToCarrierAdapter({
  confirmationState: 'confirmed',
  carrierId: 'SMNYL',
  policyNumber: 'POL-1',
  evidenceRefs: ['PAY_1'],
});

assert.equal(missingAmount.metadata.blockReason, 'missing_payment_amount');

const missingCarrier = router.routePaymentEventToCarrierAdapter({
  confirmationState: 'confirmed',
  paymentAmount: 1000,
  evidenceRefs: ['PAY_2'],
});

assert.equal(missingCarrier.metadata.blockReason, 'missing_carrier');

console.log('PASS carrier-rule-router-test');
