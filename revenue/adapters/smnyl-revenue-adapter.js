import {
  CARRIER_ADAPTER_CAPABILITIES,
  CARRIER_ADAPTER_SOURCE_STATES,
  CARRIER_ADAPTER_VALUE_STATES,
  createBlockedCarrierAdapterResult,
  createCarrierAdapterResult,
  createCarrierRuleAdapter,
} from '../carrier-revenue-adapter-contract.js';

export const SMNYL_REVENUE_ADAPTER_WARNINGS = Object.freeze([
  'SMNYL_RULE_LAYER_PARTIAL',
  'CURRENT_RUNTIME_RULES_NOT_FULL_SOURCE_TRUTH',
]);

const REQUIRED_POLICY_SELECTORS = Object.freeze([
  'carrierId',
  'productName',
  'policyNumber',
  'currency',
  'paymentFrequency',
]);

const REQUIRED_PAYMENT_SELECTORS = Object.freeze([
  'carrierId',
  'policyNumber',
  'paymentAmount',
  'currency',
  'paymentDate',
]);

function isSmnylCarrier(input = {}) {
  return String(input.carrierId || '').toUpperCase() === 'SMNYL';
}

function missingFields(input = {}, fields = []) {
  return fields.filter((field) => (
    input[field] === undefined ||
    input[field] === null ||
    input[field] === ''
  ));
}

function sourceWarningResult(adapter, calculationType, input = {}, extraWarnings = []) {
  return createCarrierAdapterResult({
    carrierId: adapter.carrierId,
    carrierName: adapter.carrierName,
    calculationType,
    valueState: CARRIER_ADAPTER_VALUE_STATES.UNKNOWN,
    amount: null,
    currency: input.currency || null,
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.RUNTIME_RULES_NOT_FULL_SOURCE_TRUTH,
    evidenceRefs: input.evidenceRefs || [],
    warnings: [...SMNYL_REVENUE_ADAPTER_WARNINGS, ...extraWarnings],
    explanation: 'SMNYL adapter wrapper is available, but this patch does not calculate or mutate commission rules.',
  });
}

function blockedMissingSelectors(adapter, calculationType, input = {}, missing = []) {
  return createBlockedCarrierAdapterResult({
    carrierId: adapter.carrierId,
    carrierName: adapter.carrierName,
    calculationType,
    blockReason: 'missing_required_selectors',
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.PARTIAL_SOURCE,
    evidenceRefs: input.evidenceRefs || [],
    warnings: [...SMNYL_REVENUE_ADAPTER_WARNINGS, `MISSING_SELECTORS:${missing.join(',')}`],
    explanation: 'SMNYL adapter does not silently default missing product, currency, premium, payment or branch selectors.',
    metadata: { missingSelectors: missing },
  });
}

export function createSmnylRevenueAdapter() {
  const adapter = {};

  Object.assign(adapter, createCarrierRuleAdapter({
    carrierId: 'SMNYL',
    carrierName: 'Seguros Monterrey New York Life',
    capabilities: [
      CARRIER_ADAPTER_CAPABILITIES.INITIAL_COMMISSION,
      CARRIER_ADAPTER_CAPABILITIES.RENEWAL_COMMISSION,
      CARRIER_ADAPTER_CAPABILITIES.OPPORTUNITY_POTENTIAL,
      CARRIER_ADAPTER_CAPABILITIES.PAYOUT_CONFIRMATION,
    ],
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.RUNTIME_RULES_NOT_FULL_SOURCE_TRUTH,
    warnings: SMNYL_REVENUE_ADAPTER_WARNINGS,
    canCalculate: (input = {}) => isSmnylCarrier(input),
    calculateInitialCommission: (input) => sourceWarningResult(adapter, 'initial_commission', input),
    calculateRenewalCommission: (input) => sourceWarningResult(adapter, 'renewal_commission', input),
    calculateBonus: (input) => sourceWarningResult(adapter, 'bonus', input, ['BONUS_RULES_NOT_ROUTED_IN_001B']),
    calculateRenewalBonus: (input) => sourceWarningResult(adapter, 'renewal_bonus', input, ['RENEWAL_BONUS_RULES_NOT_ROUTED_IN_001B']),
    calculateOpportunityPotential: (input) => sourceWarningResult(adapter, 'opportunity_potential', input),
    calculateFromConfirmedPolicy: (input = {}) => {
      const missing = missingFields(input, REQUIRED_POLICY_SELECTORS);

      if (!isSmnylCarrier(input)) {
        return createBlockedCarrierAdapterResult({
          carrierId: 'SMNYL',
          carrierName: adapter.carrierName,
          calculationType: 'confirmed_policy',
          blockReason: 'carrier_mismatch',
          sourceState: adapter.sourceState,
          evidenceRefs: input.evidenceRefs || [],
          warnings: SMNYL_REVENUE_ADAPTER_WARNINGS,
        });
      }

      if (missing.length > 0) {
        return blockedMissingSelectors(adapter, 'confirmed_policy', input, missing);
      }

      return sourceWarningResult(adapter, 'confirmed_policy', input);
    },
    calculateFromPaymentEvent: (input = {}) => {
      const missing = missingFields(input, REQUIRED_PAYMENT_SELECTORS);

      if (!isSmnylCarrier(input)) {
        return createBlockedCarrierAdapterResult({
          carrierId: 'SMNYL',
          carrierName: adapter.carrierName,
          calculationType: 'payment_event',
          blockReason: 'carrier_mismatch',
          sourceState: adapter.sourceState,
          evidenceRefs: input.evidenceRefs || [],
          warnings: SMNYL_REVENUE_ADAPTER_WARNINGS,
        });
      }

      if (missing.length > 0) {
        return blockedMissingSelectors(adapter, 'payment_event', input, missing);
      }

      return sourceWarningResult(adapter, 'payment_event', input);
    },
    confirmPayoutFromStatement: (input = {}) => sourceWarningResult(adapter, 'payout_confirmation', input),
  }));

  return Object.freeze(adapter);
}
