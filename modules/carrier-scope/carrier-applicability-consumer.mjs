import {
  CarrierScopeError,
  createCarrierScope
} from './index.mjs';

export class CarrierApplicabilityDecisionError
  extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name =
      'CarrierApplicabilityDecisionError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}

function requireString(value, code) {
  if (
    typeof value !== 'string'
    || value.trim().length === 0
  ) {
    throw new CarrierApplicabilityDecisionError(
      code
    );
  }

  return value.trim();
}

function deepFreeze(value) {
  if (
    value === null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

function normalizeScope(value, label) {
  try {
    return createCarrierScope(value);
  } catch (error) {
    if (error instanceof CarrierScopeError) {
      throw new CarrierApplicabilityDecisionError(
        `${label}_INVALID`,
        [error.message]
      );
    }

    throw error;
  }
}

function determineUnsupportedReason(
  requestScope,
  supportedScopes
) {
  const carrierScopes = supportedScopes.filter(
    scope =>
      scope.carrier === requestScope.carrier
  );

  if (carrierScopes.length === 0) {
    return 'CARRIER_UNSUPPORTED';
  }

  const marketScopes = carrierScopes.filter(
    scope =>
      scope.market === requestScope.market
  );

  if (marketScopes.length === 0) {
    return 'MARKET_UNSUPPORTED';
  }

  return 'PRODUCT_LINE_UNSUPPORTED';
}

export function createCarrierApplicabilityDecision(
  input
) {
  if (!isPlainObject(input)) {
    throw new CarrierApplicabilityDecisionError(
      'CARRIER_APPLICABILITY_INPUT_REQUIRED'
    );
  }

  const workflowId = requireString(
    input.workflowId,
    'WORKFLOW_ID_REQUIRED'
  );

  if (
    !Array.isArray(input.supportedScopes)
    || input.supportedScopes.length === 0
  ) {
    throw new CarrierApplicabilityDecisionError(
      'SUPPORTED_CARRIER_SCOPES_REQUIRED'
    );
  }

  const requestScope = normalizeScope(
    input.requestScope,
    'REQUEST_SCOPE'
  );

  const supportedScopes =
    input.supportedScopes.map(
      (scope, index) =>
        normalizeScope(
          scope,
          `SUPPORTED_SCOPE_${index}`
        )
    );

  const canonicalScopes = new Set();

  for (const scope of supportedScopes) {
    if (canonicalScopes.has(scope.canonical)) {
      throw new CarrierApplicabilityDecisionError(
        'DUPLICATE_SUPPORTED_SCOPE',
        [scope.canonical]
      );
    }

    canonicalScopes.add(scope.canonical);
  }

  const matchedScope = supportedScopes.find(
    scope =>
      scope.canonical === requestScope.canonical
  );

  if (matchedScope) {
    return deepFreeze({
      schemaVersion: 1,
      kind: 'CARRIER_APPLICABILITY_DECISION',
      workflowId,
      decision: 'CARRIER_SCOPE_ELIGIBLE',
      eligible: true,
      ineligible: false,
      applies: true,
      supported: true,
      rejected: false,
      reasonCode:
        'EXACT_CARRIER_SCOPE_SUPPORTED',
      requestScope,
      matchedScope,
      evaluatedScopeCount:
        supportedScopes.length,
      boundaries: {
        owner:
          'CARRIER_SCOPE_APPLICABILITY_CONSUMER',
        consumesCarrierScope: true,
        mayOverrideCarrierScope: false,
        mayInferUnsupportedScope: false,
        maySendQuote: false,
        humanDecisionRequired: true
      }
    });
  }

  return deepFreeze({
    schemaVersion: 1,
    kind: 'CARRIER_APPLICABILITY_DECISION',
    workflowId,
    decision: 'CARRIER_SCOPE_INELIGIBLE',
    eligible: false,
    ineligible: true,
    applies: false,
    supported: false,
    rejected: true,
    reasonCode: determineUnsupportedReason(
      requestScope,
      supportedScopes
    ),
    requestScope,
    matchedScope: null,
    evaluatedScopeCount:
      supportedScopes.length,
    boundaries: {
      owner:
        'CARRIER_SCOPE_APPLICABILITY_CONSUMER',
      consumesCarrierScope: true,
      mayOverrideCarrierScope: false,
      mayInferUnsupportedScope: false,
      maySendQuote: false,
      humanDecisionRequired: true
    }
  });
}
