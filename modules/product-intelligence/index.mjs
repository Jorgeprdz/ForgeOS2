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
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new ProductTruthError(code);
  }

  return value.trim();
}

function normalizeOptionalString(
  value,
  code,
  transform = item => item
) {
  if (value === undefined || value === null) {
    return null;
  }

  return transform(
    requireNonEmptyString(value, code)
  );
}

function normalizeStringArray(value, code) {
  if (!Array.isArray(value)) {
    throw new ProductTruthError(code);
  }

  const normalized = value.map((item, index) =>
    requireNonEmptyString(item, `${code}_${index}`)
  );

  return Object.freeze(
    [...new Set(normalized)].sort()
  );
}

function deepFreeze(value) {
  if (
    !isPlainObject(value) &&
    !Array.isArray(value)
  ) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

function buildProductTruthKey({
  carrierId,
  productId,
  productVersion,
  effectiveFrom,
  country,
  channel
}) {
  return [
    'PTK1',
    carrierId,
    productId,
    productVersion,
    effectiveFrom,
    country ?? '*',
    channel ?? '*'
  ]
    .map(segment =>
      encodeURIComponent(String(segment))
    )
    .join(':');
}

export function createProductTruthKey(input) {
  if (!isPlainObject(input)) {
    throw new ProductTruthError(
      'PRODUCT_TRUTH_KEY_INPUT_REQUIRED'
    );
  }

  const carrierId = requireNonEmptyString(
    input.carrierId,
    'CARRIER_ID_REQUIRED'
  );

  const productId = requireNonEmptyString(
    input.productId,
    'PRODUCT_ID_REQUIRED'
  );

  const productVersion = requireNonEmptyString(
    input.productVersion,
    'PRODUCT_VERSION_REQUIRED'
  );

  const effectiveFrom = requireNonEmptyString(
    input.effectiveFrom ??
      input.effectivePeriod?.from,
    'EFFECTIVE_FROM_REQUIRED'
  );

  if (Number.isNaN(Date.parse(effectiveFrom))) {
    throw new ProductTruthError(
      'EFFECTIVE_FROM_INVALID',
      [effectiveFrom]
    );
  }

  const country = normalizeOptionalString(
    input.country ??
      input.versionContext?.country,
    'COUNTRY_INVALID',
    value => value.toUpperCase()
  );

  const channel = normalizeOptionalString(
    input.channel ??
      input.versionContext?.channel,
    'CHANNEL_INVALID',
    value => value.toUpperCase()
  );

  return buildProductTruthKey({
    carrierId,
    productId,
    productVersion,
    effectiveFrom,
    country,
    channel
  });
}

export function createProductTruthEnvelope(input) {
  if (!isPlainObject(input)) {
    throw new ProductTruthError(
      'PRODUCT_TRUTH_INPUT_REQUIRED'
    );
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

  const productVersion = requireNonEmptyString(
    input.productVersion,
    'PRODUCT_VERSION_REQUIRED'
  );

  const productFamily = requireNonEmptyString(
    input.productFamily,
    'PRODUCT_FAMILY_REQUIRED'
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

  if (
    input.effectiveTo !== undefined &&
    input.effectiveTo !== null
  ) {
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

    if (
      Date.parse(effectiveTo) <=
      Date.parse(effectiveFrom)
    ) {
      throw new ProductTruthError(
        'EFFECTIVE_PERIOD_INVALID'
      );
    }
  }

  const rulePackId = normalizeOptionalString(
    input.rulePackId,
    'RULE_PACK_ID_INVALID'
  );

  const currency = normalizeOptionalString(
    input.currency,
    'CURRENCY_INVALID',
    value => value.toUpperCase()
  );

  const country = normalizeOptionalString(
    input.country,
    'COUNTRY_INVALID',
    value => value.toUpperCase()
  );

  const channel = normalizeOptionalString(
    input.channel,
    'CHANNEL_INVALID',
    value => value.toUpperCase()
  );

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
    (
      unknownFields.length > 0 ||
      conflicts.length > 0
    )
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

  const truthKey = buildProductTruthKey({
    carrierId,
    productId,
    productVersion,
    effectiveFrom,
    country,
    channel
  });

  return deepFreeze({
    schemaVersion: 2,
    kind: 'PRODUCT_TRUTH_ENVELOPE',
    truthKey,
    productId,
    carrierId,
    productName,
    productVersion,
    productFamily,
    evidenceState,
    actionable,
    effectivePeriod: {
      from: effectiveFrom,
      to: effectiveTo
    },
    versionContext: {
      rulePackId,
      currency,
      country,
      channel
    },
    sourceIds,
    facts,
    unknownFields,
    conflicts,
    boundaries: {
      owner: 'PRODUCT_INTELLIGENCE',
      consumerMayRecalculate: false,
      consumerMayChangeVersion: false,
      aiMayCreateFacts: false,
      historicalTruthMayBeRewritten: false,
      humanDecisionRequired: true
    }
  });
}

export function assertProductTruthEnvelope(value) {
  const recreated = createProductTruthEnvelope({
    productId: value?.productId,
    carrierId: value?.carrierId,
    productName: value?.productName,
    productVersion: value?.productVersion,
    productFamily: value?.productFamily,
    evidenceState: value?.evidenceState,
    effectiveFrom: value?.effectivePeriod?.from,
    effectiveTo: value?.effectivePeriod?.to,
    rulePackId:
      value?.versionContext?.rulePackId,
    currency:
      value?.versionContext?.currency,
    country:
      value?.versionContext?.country,
    channel:
      value?.versionContext?.channel,
    sourceIds: value?.sourceIds,
    facts: value?.facts,
    unknownFields: value?.unknownFields,
    conflicts: value?.conflicts
  });

  if (
    value?.schemaVersion !== 2 ||
    value?.kind !==
      'PRODUCT_TRUTH_ENVELOPE' ||
    value?.truthKey !== recreated.truthKey ||
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
