export const CARRIER_ADAPTER_CAPABILITIES = Object.freeze({
  INITIAL_COMMISSION: 'initial_commission',
  RENEWAL_COMMISSION: 'renewal_commission',
  BONUS: 'bonus',
  RENEWAL_BONUS: 'renewal_bonus',
  OPPORTUNITY_POTENTIAL: 'opportunity_potential',
  PAYOUT_CONFIRMATION: 'payout_confirmation',
});

export const CARRIER_ADAPTER_SOURCE_STATES = Object.freeze({
  SOURCE_LOCKED: 'source_locked',
  PARTIAL_SOURCE: 'partial_source',
  RUNTIME_RULES_NOT_FULL_SOURCE_TRUTH: 'runtime_rules_not_full_source_truth',
  NOT_MODELED: 'not_modeled',
  BLOCKED_BY_MISSING_SOURCE: 'blocked_by_missing_source',
  UNKNOWN: 'unknown',
});

export const CARRIER_ADAPTER_VALUE_STATES = Object.freeze({
  KNOWN: 'known',
  ZERO: 'zero',
  UNKNOWN: 'unknown',
  NOT_MODELED: 'not_modeled',
  BLOCKED: 'blocked',
  HIDDEN_BY_SCOPE: 'hidden_by_scope',
});

const REQUIRED_ADAPTER_FIELDS = Object.freeze([
  'carrierId',
  'carrierName',
  'capabilities',
  'sourceState',
  'warnings',
  'canCalculate',
  'calculateInitialCommission',
  'calculateRenewalCommission',
  'calculateBonus',
  'calculateRenewalBonus',
  'calculateOpportunityPotential',
  'calculateFromConfirmedPolicy',
  'calculateFromPaymentEvent',
  'confirmPayoutFromStatement',
]);

const REQUIRED_ADAPTER_FUNCTIONS = Object.freeze([
  'canCalculate',
  'calculateInitialCommission',
  'calculateRenewalCommission',
  'calculateBonus',
  'calculateRenewalBonus',
  'calculateOpportunityPotential',
  'calculateFromConfirmedPolicy',
  'calculateFromPaymentEvent',
  'confirmPayoutFromStatement',
]);

function cloneArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function defaultBlocked(adapter, calculationType) {
  return (input = {}) => createBlockedCarrierAdapterResult({
    carrierId: adapter.carrierId,
    carrierName: adapter.carrierName,
    calculationType,
    blockReason: 'adapter_function_not_implemented',
    sourceState: adapter.sourceState,
    evidenceRefs: input.evidenceRefs,
    warnings: adapter.warnings,
  });
}

export function createCarrierAdapterResult({
  carrierId,
  carrierName = null,
  calculationType = 'unknown',
  valueState = CARRIER_ADAPTER_VALUE_STATES.UNKNOWN,
  amount = null,
  currency = null,
  sourceState = CARRIER_ADAPTER_SOURCE_STATES.UNKNOWN,
  evidenceRefs = [],
  warnings = [],
  explanation = '',
  metadata = {},
} = {}) {
  return {
    carrierId,
    carrierName,
    calculationType,
    valueState,
    amount,
    currency,
    sourceState,
    evidenceRefs: cloneArray(evidenceRefs),
    warnings: cloneArray(warnings),
    explanation,
    metadata: { ...metadata },
  };
}

export function createBlockedCarrierAdapterResult({
  carrierId = null,
  carrierName = null,
  calculationType = 'unknown',
  blockReason = 'unknown',
  sourceState = CARRIER_ADAPTER_SOURCE_STATES.UNKNOWN,
  evidenceRefs = [],
  warnings = [],
  explanation = '',
  metadata = {},
} = {}) {
  return createCarrierAdapterResult({
    carrierId,
    carrierName,
    calculationType,
    valueState: CARRIER_ADAPTER_VALUE_STATES.BLOCKED,
    amount: null,
    currency: null,
    sourceState,
    evidenceRefs,
    warnings: [...cloneArray(warnings), blockReason],
    explanation: explanation || blockReason,
    metadata: {
      ...metadata,
      blockReason,
    },
  });
}

export function createCarrierRuleAdapter({
  carrierId,
  carrierName,
  capabilities = [],
  sourceState = CARRIER_ADAPTER_SOURCE_STATES.UNKNOWN,
  warnings = [],
  canCalculate = () => false,
  calculateInitialCommission,
  calculateRenewalCommission,
  calculateBonus,
  calculateRenewalBonus,
  calculateOpportunityPotential,
  calculateFromConfirmedPolicy,
  calculateFromPaymentEvent,
  confirmPayoutFromStatement,
} = {}) {
  const adapter = {
    carrierId,
    carrierName,
    capabilities: cloneArray(capabilities),
    sourceState,
    warnings: cloneArray(warnings),
    canCalculate,
  };

  adapter.calculateInitialCommission =
    calculateInitialCommission || defaultBlocked(adapter, CARRIER_ADAPTER_CAPABILITIES.INITIAL_COMMISSION);
  adapter.calculateRenewalCommission =
    calculateRenewalCommission || defaultBlocked(adapter, CARRIER_ADAPTER_CAPABILITIES.RENEWAL_COMMISSION);
  adapter.calculateBonus =
    calculateBonus || defaultBlocked(adapter, CARRIER_ADAPTER_CAPABILITIES.BONUS);
  adapter.calculateRenewalBonus =
    calculateRenewalBonus || defaultBlocked(adapter, CARRIER_ADAPTER_CAPABILITIES.RENEWAL_BONUS);
  adapter.calculateOpportunityPotential =
    calculateOpportunityPotential || defaultBlocked(adapter, CARRIER_ADAPTER_CAPABILITIES.OPPORTUNITY_POTENTIAL);
  adapter.calculateFromConfirmedPolicy =
    calculateFromConfirmedPolicy || defaultBlocked(adapter, 'confirmed_policy');
  adapter.calculateFromPaymentEvent =
    calculateFromPaymentEvent || defaultBlocked(adapter, 'payment_event');
  adapter.confirmPayoutFromStatement =
    confirmPayoutFromStatement || defaultBlocked(adapter, CARRIER_ADAPTER_CAPABILITIES.PAYOUT_CONFIRMATION);

  return Object.freeze(adapter);
}

export function validateCarrierRuleAdapter(adapter = {}) {
  const missingFields = REQUIRED_ADAPTER_FIELDS.filter((field) => adapter[field] === undefined);
  const missingFunctions = REQUIRED_ADAPTER_FUNCTIONS.filter((field) => typeof adapter[field] !== 'function');

  return {
    valid: missingFields.length === 0 && missingFunctions.length === 0,
    missingFields,
    missingFunctions,
    errors: [
      ...missingFields.map((field) => `MISSING_FIELD:${field}`),
      ...missingFunctions.map((field) => `MISSING_FUNCTION:${field}`),
    ],
  };
}
