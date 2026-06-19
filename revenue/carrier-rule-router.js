import {
  CARRIER_ADAPTER_SOURCE_STATES,
  createBlockedCarrierAdapterResult,
} from './carrier-revenue-adapter-contract.js';

import { createNotModeledCarrierAdapter } from './adapters/not-modeled-carrier-adapter.js';

const defaultRegistry = new Map();

function normalizeCarrierId(carrierId) {
  return carrierId ? String(carrierId).trim().toUpperCase() : '';
}

function cloneInput(input = {}) {
  return {
    ...input,
    evidenceRefs: Array.isArray(input.evidenceRefs) ? [...input.evidenceRefs] : [],
    warnings: Array.isArray(input.warnings) ? [...input.warnings] : input.warnings,
  };
}

function isConfirmed(input = {}) {
  return input.confirmationState === 'confirmed' || input.economicEventStatus?.status === 'payment_confirmed';
}

function blockedResult({
  input = {},
  calculationType,
  blockReason,
  carrierId = input.carrierId || null,
  carrierName = input.carrierName || null,
} = {}) {
  return createBlockedCarrierAdapterResult({
    carrierId,
    carrierName,
    calculationType,
    blockReason,
    sourceState: CARRIER_ADAPTER_SOURCE_STATES.UNKNOWN,
    evidenceRefs: input.evidenceRefs || [],
    warnings: [blockReason],
    metadata: { blockReason },
  });
}

export function registerCarrierAdapter(adapter, registry = defaultRegistry) {
  if (!adapter?.carrierId) {
    return {
      registered: false,
      reason: 'missing_carrier',
    };
  }

  registry.set(normalizeCarrierId(adapter.carrierId), adapter);

  return {
    registered: true,
    carrierId: normalizeCarrierId(adapter.carrierId),
  };
}

export function getCarrierAdapter(carrierId, registry = defaultRegistry) {
  return registry.get(normalizeCarrierId(carrierId)) || null;
}

function resolveAdapter(input = {}, registry = defaultRegistry) {
  const carrierId = normalizeCarrierId(input.carrierId);

  if (!carrierId) {
    return {
      adapter: null,
      carrierId,
      missingCarrier: true,
    };
  }

  const adapter = getCarrierAdapter(carrierId, registry);

  return {
    adapter: adapter || createNotModeledCarrierAdapter({
      carrierId,
      carrierName: input.carrierName || carrierId,
    }),
    carrierId,
    missingAdapter: !adapter,
  };
}

export function routeConfirmedPolicyToCarrierAdapter(input = {}, {
  registry = defaultRegistry,
} = {}) {
  const safeInput = cloneInput(input);

  if (!isConfirmed(safeInput)) {
    return blockedResult({
      input: safeInput,
      calculationType: 'confirmed_policy',
      blockReason: 'unconfirmed_input',
    });
  }

  if (!safeInput.carrierId) {
    return blockedResult({
      input: safeInput,
      calculationType: 'confirmed_policy',
      blockReason: 'missing_carrier',
    });
  }

  if (!safeInput.policyNumber) {
    return blockedResult({
      input: safeInput,
      calculationType: 'confirmed_policy',
      blockReason: 'missing_policy_number',
    });
  }

  const { adapter } = resolveAdapter(safeInput, registry);

  return adapter.calculateFromConfirmedPolicy(safeInput);
}

export function routePaymentEventToCarrierAdapter(input = {}, {
  registry = defaultRegistry,
} = {}) {
  const safeInput = cloneInput(input);

  if (!isConfirmed(safeInput)) {
    return blockedResult({
      input: safeInput,
      calculationType: 'payment_event',
      blockReason: 'unconfirmed_input',
    });
  }

  if (!safeInput.carrierId) {
    return blockedResult({
      input: safeInput,
      calculationType: 'payment_event',
      blockReason: 'missing_carrier',
    });
  }

  if (!safeInput.paymentAmount || Number(safeInput.paymentAmount) <= 0) {
    return blockedResult({
      input: safeInput,
      calculationType: 'payment_event',
      blockReason: 'missing_payment_amount',
    });
  }

  const { adapter } = resolveAdapter(safeInput, registry);

  return adapter.calculateFromPaymentEvent(safeInput);
}

export function routeCommissionStatementToCarrierAdapter(input = {}, {
  registry = defaultRegistry,
} = {}) {
  const safeInput = cloneInput(input);

  if (!isConfirmed(safeInput)) {
    return blockedResult({
      input: safeInput,
      calculationType: 'payout_confirmation',
      blockReason: 'unconfirmed_input',
    });
  }

  if (!safeInput.carrierId) {
    return blockedResult({
      input: safeInput,
      calculationType: 'payout_confirmation',
      blockReason: 'missing_carrier',
    });
  }

  if (!safeInput.payoutEvidenceId && (!safeInput.evidenceRefs || safeInput.evidenceRefs.length === 0)) {
    return blockedResult({
      input: safeInput,
      calculationType: 'payout_confirmation',
      blockReason: 'missing_statement',
    });
  }

  const { adapter } = resolveAdapter(safeInput, registry);

  return adapter.confirmPayoutFromStatement(safeInput);
}

export function createCarrierRuleRouter({
  adapters = [],
} = {}) {
  const registry = new Map();

  adapters.forEach((adapter) => {
    registerCarrierAdapter(adapter, registry);
  });

  return Object.freeze({
    registerCarrierAdapter: (adapter) => registerCarrierAdapter(adapter, registry),
    getCarrierAdapter: (carrierId) => getCarrierAdapter(carrierId, registry),
    routeConfirmedPolicyToCarrierAdapter: (input) => routeConfirmedPolicyToCarrierAdapter(input, { registry }),
    routePaymentEventToCarrierAdapter: (input) => routePaymentEventToCarrierAdapter(input, { registry }),
    routeCommissionStatementToCarrierAdapter: (input) => routeCommissionStatementToCarrierAdapter(input, { registry }),
  });
}
