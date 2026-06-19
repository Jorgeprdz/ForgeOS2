import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CARRIER_ADAPTER_SOURCE_STATES,
  CARRIER_ADAPTER_VALUE_STATES,
} from '../revenue/carrier-revenue-adapter-contract.js';

import {
  SMNYL_REVENUE_ADAPTER_WARNINGS,
  createSmnylRevenueAdapter,
} from '../revenue/adapters/smnyl-revenue-adapter.js';

const source = readFileSync(new URL('../revenue/adapters/smnyl-revenue-adapter.js', import.meta.url), 'utf8');

assert.equal(source.includes("comisiones.js"), false);

const adapter = createSmnylRevenueAdapter();

assert.equal(adapter.carrierId, 'SMNYL');
assert.equal(adapter.sourceState, CARRIER_ADAPTER_SOURCE_STATES.RUNTIME_RULES_NOT_FULL_SOURCE_TRUTH);
assert.equal(adapter.warnings.includes('SMNYL_RULE_LAYER_PARTIAL'), true);

const missingSelectors = adapter.calculateFromConfirmedPolicy({
  confirmationState: 'confirmed',
  carrierId: 'SMNYL',
  policyNumber: 'POL-1',
  evidenceRefs: ['POL_EVID_1'],
});

assert.equal(missingSelectors.valueState, CARRIER_ADAPTER_VALUE_STATES.BLOCKED);
assert.equal(missingSelectors.metadata.missingSelectors.includes('productName'), true);

const result = adapter.calculateFromPaymentEvent({
  carrierId: 'SMNYL',
  policyNumber: 'POL-1',
  paymentAmount: 1000,
  currency: 'MXN',
  paymentDate: '2026-06-01',
  evidenceRefs: ['PAY_1'],
});

assert.equal(result.amount, null);
assert.equal(result.valueState, CARRIER_ADAPTER_VALUE_STATES.UNKNOWN);
assert.equal(result.warnings.includes(SMNYL_REVENUE_ADAPTER_WARNINGS[0]), true);
assert.equal(Object.prototype.hasOwnProperty.call(result, 'calculationType'), true);

console.log('PASS smnyl-revenue-adapter-test');
