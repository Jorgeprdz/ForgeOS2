const EVIDENCE_STATES = Object.freeze([
  'VERIFIED',
  'PARTIAL',
  'UNKNOWN',
  'CONFLICTED',
  'STALE'
]);

const NON_ACTIONABLE_STATES = new Set([
  'UNKNOWN',
  'CONFLICTED',
  'STALE'
]);

export class ProductTruthError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ProductTruthError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function requireNonEmptyString(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ProductTruthError(code);
  }

  return value.trim();
}

function normalizeStringArray(value, code) {
  if (!Array.isArray(value)) {
    throw new ProductTruthError(code);
  }

  const normalized = value.map((item, index) =>
    requireNonEmptyString(item, `${code}_${index}`)
  );

  return Object.freeze([...new Set(normalized)].sort());
}

function deepFreeze(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

export function createProductTruthEnvelope(input) {
  if (!isPlainObject(input)) {
    throw new ProductTruthError('PRODUCT_TRUTH_INPUT_REQUIRED');
  }

  const productId = requireNonEmptyString(
    input.productId,
    'PRODUCT_ID_REQUIRED'
  );

  const carrierId = requireNonEmptyString(
    input.carrierId,
    'CARRIER_ID_REQUIRED'
  );

  const productName = requireNonEmptyString(
    input.productName,
    'PRODUCT_NAME_REQUIRED'
  );

  const evidenceState = requireNonEmptyString(
    input.evidenceState,
    'EVIDENCE_STATE_REQUIRED'
  );

  if (!EVIDENCE_STATES.includes(evidenceState)) {
    throw new ProductTruthError(
      'EVIDENCE_STATE_INVALID',
      [evidenceState]
    );
  }

  const effectiveFrom = requireNonEmptyString(
    input.effectiveFrom,
    'EFFECTIVE_FROM_REQUIRED'
  );

  if (Number.isNaN(Date.parse(effectiveFrom))) {
    throw new ProductTruthError(
      'EFFECTIVE_FROM_INVALID',
      [effectiveFrom]
    );
  }

  let effectiveTo = null;

  if (input.effectiveTo !== undefined && input.effectiveTo !== null) {
    effectiveTo = requireNonEmptyString(
      input.effectiveTo,
      'EFFECTIVE_TO_INVALID'
    );

    if (Number.isNaN(Date.parse(effectiveTo))) {
      throw new ProductTruthError(
        'EFFECTIVE_TO_INVALID',
        [effectiveTo]
      );
    }

    if (Date.parse(effectiveTo) <= Date.parse(effectiveFrom)) {
      throw new ProductTruthError(
        'EFFECTIVE_PERIOD_INVALID'
      );
    }
  }

  const sourceIds = normalizeStringArray(
    input.sourceIds,
    'SOURCE_IDS_REQUIRED'
  );

  if (sourceIds.length === 0) {
    throw new ProductTruthError(
      'SOURCE_IDS_REQUIRED'
    );
  }

  const facts = isPlainObject(input.facts)
    ? structuredClone(input.facts)
    : null;

  if (!facts) {
    throw new ProductTruthError(
      'PRODUCT_FACTS_REQUIRED'
    );
  }

  const unknownFields = normalizeStringArray(
    input.unknownFields ?? [],
    'UNKNOWN_FIELDS_INVALID'
  );

  const conflicts = normalizeStringArray(
    input.conflicts ?? [],
    'CONFLICTS_INVALID'
  );

  if (
    evidenceState === 'VERIFIED' &&
    (unknownFields.length > 0 || conflicts.length > 0)
  ) {
    throw new ProductTruthError(
      'VERIFIED_STATE_HAS_UNRESOLVED_GAPS'
    );
  }

  if (
    evidenceState === 'CONFLICTED' &&
    conflicts.length === 0
  ) {
    throw new ProductTruthError(
      'CONFLICTED_STATE_REQUIRES_CONFLICTS'
    );
  }

  const actionable =
    !NON_ACTIONABLE_STATES.has(evidenceState) &&
    conflicts.length === 0;

  return deepFreeze({
    schemaVersion: 1,
    kind: 'PRODUCT_TRUTH_ENVELOPE',
    productId,
    carrierId,
    productName,
    evidenceState,
    actionable,
    effectivePeriod: {
      from: effectiveFrom,
      to: effectiveTo
    },
    sourceIds,
    facts,
    unknownFields,
    conflicts,
    boundaries: {
      owner: 'PRODUCT_INTELLIGENCE',
      consumerMayRecalculate: false,
      aiMayCreateFacts: false,
      humanDecisionRequired: true
    }
  });
}

export function assertProductTruthEnvelope(value) {
  const recreated = createProductTruthEnvelope({
    productId: value?.productId,
    carrierId: value?.carrierId,
    productName: value?.productName,
    evidenceState: value?.evidenceState,
    effectiveFrom: value?.effectivePeriod?.from,
    effectiveTo: value?.effectivePeriod?.to,
    sourceIds: value?.sourceIds,
    facts: value?.facts,
    unknownFields: value?.unknownFields,
    conflicts: value?.conflicts
  });

  if (
    value?.schemaVersion !== 1 ||
    value?.kind !== 'PRODUCT_TRUTH_ENVELOPE' ||
    value?.actionable !== recreated.actionable
  ) {
    throw new ProductTruthError(
      'PRODUCT_TRUTH_ENVELOPE_INVALID'
    );
  }

  return true;
}

export function isProductTruthActionable(value) {
  assertProductTruthEnvelope(value);
  return value.actionable;
}

export { EVIDENCE_STATES };
