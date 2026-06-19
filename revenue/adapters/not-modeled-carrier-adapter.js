import {
  CARRIER_ADAPTER_SOURCE_STATES,
  CARRIER_ADAPTER_VALUE_STATES,
  createCarrierAdapterResult,
  createCarrierRuleAdapter,
} from '../carrier-revenue-adapter-contract.js';

const WARNING = 'CARRIER_RULE_PACK_NOT_MODELED';

function notModeledResult(adapter, calculationType, input = {}) {
  return createCarrierAdapterResult({
    carrierId: adapter.carrierId,
    carrierName: adapter.carrierName,
    calculationType,
    valueState: CARRIER_ADAPTER_VALUE_STATES.NOT_MODELED,
    amount: null,
    currency: input.currency || null,
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.NOT_MODELED,
    evidenceRefs: input.evidenceRefs || [],
    warnings: [WARNING],
    explanation: 'Carrier rule pack is recognized or connected but not modeled. This is not zero.',
  });
}

export function createNotModeledCarrierAdapter({
  carrierId = 'UNKNOWN',
  carrierName = carrierId,
} = {}) {
  const adapter = {};

  Object.assign(adapter, createCarrierRuleAdapter({
    carrierId,
    carrierName,
    capabilities: [],
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.NOT_MODELED,
    warnings: [WARNING],
    canCalculate: () => false,
    calculateInitialCommission: (input) => notModeledResult(adapter, 'initial_commission', input),
    calculateRenewalCommission: (input) => notModeledResult(adapter, 'renewal_commission', input),
    calculateBonus: (input) => notModeledResult(adapter, 'bonus', input),
    calculateRenewalBonus: (input) => notModeledResult(adapter, 'renewal_bonus', input),
    calculateOpportunityPotential: (input) => notModeledResult(adapter, 'opportunity_potential', input),
    calculateFromConfirmedPolicy: (input) => notModeledResult(adapter, 'confirmed_policy', input),
    calculateFromPaymentEvent: (input) => notModeledResult(adapter, 'payment_event', input),
    confirmPayoutFromStatement: (input) => notModeledResult(adapter, 'payout_confirmation', input),
  }));

  return Object.freeze(adapter);
}
