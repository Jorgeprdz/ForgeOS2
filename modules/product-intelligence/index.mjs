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

const PRODUCT_EVIDENCE_TYPES = Object.freeze([
  'OFFICIAL_PRODUCT_MANUAL',
  'GENERAL_CONDITIONS',
  'OFFICIAL_CARRIER_DOCUMENTATION',
  'VALIDATED_RULE_PACK',
  'QUOTE_ILLUSTRATION',
  'PRODUCT_BROCHURE',
  'OCR_EXTRACT',
  'HUMAN_CONFIRMATION',
  'INFERENCE'
]);

const PRODUCT_EVIDENCE_AUTHORITY_LEVELS = deepFreeze({
  OFFICIAL_PRODUCT_MANUAL: 1,
  GENERAL_CONDITIONS: 1,
  OFFICIAL_CARRIER_DOCUMENTATION: 1,
  VALIDATED_RULE_PACK: 1,
  QUOTE_ILLUSTRATION: 2,
  OCR_EXTRACT: 3,
  PRODUCT_BROCHURE: 4,
  HUMAN_CONFIRMATION: 4,
  INFERENCE: 5
});

function normalizeClaimValue(value) {
  if (value === undefined) {
    throw new ProductTruthError(
      'CLAIM_VALUE_REQUIRED'
    );
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new ProductTruthError(
        'CLAIM_VALUE_INVALID'
      );
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item =>
      normalizeClaimValue(item)
    );
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [
          key,
          normalizeClaimValue(value[key])
        ])
    );
  }

  throw new ProductTruthError(
    'CLAIM_VALUE_INVALID'
  );
}

function canonicalClaimJson(value) {
  return JSON.stringify(
    normalizeClaimValue(value)
  );
}

function normalizeRequiredDate(
  value,
  requiredCode,
  invalidCode
) {
  const normalized = requireNonEmptyString(
    value,
    requiredCode
  );

  if (Number.isNaN(Date.parse(normalized))) {
    throw new ProductTruthError(
      invalidCode,
      [normalized]
    );
  }

  return normalized;
}

function normalizeEffectivePeriod(input) {
  const from = normalizeRequiredDate(
    input.effectiveFrom ??
      input.effectivePeriod?.from,
    'EFFECTIVE_FROM_REQUIRED',
    'EFFECTIVE_FROM_INVALID'
  );

  const rawTo =
    input.effectiveTo ??
    input.effectivePeriod?.to;

  let to = null;

  if (rawTo !== undefined && rawTo !== null) {
    to = normalizeRequiredDate(
      rawTo,
      'EFFECTIVE_TO_INVALID',
      'EFFECTIVE_TO_INVALID'
    );

    if (Date.parse(to) <= Date.parse(from)) {
      throw new ProductTruthError(
        'EFFECTIVE_PERIOD_INVALID'
      );
    }
  }

  return { from, to };
}

function normalizeEvidenceRecordInput(value) {
  const recreated = createProductEvidenceRecord({
    evidenceId: value?.evidenceId,
    sourceId: value?.sourceId,
    sourceType: value?.sourceType,
    carrierId: value?.carrierId,
    productId: value?.productId,
    productVersion: value?.productVersion,
    claimPath: value?.claimPath,
    claimValue: value?.claimValue,
    effectiveFrom:
      value?.effectiveFrom ??
      value?.effectivePeriod?.from,
    effectiveTo:
      value?.effectiveTo ??
      value?.effectivePeriod?.to,
    country:
      value?.country ??
      value?.context?.country,
    channel:
      value?.channel ??
      value?.context?.channel
  });

  if (
    (
      value?.schemaVersion !== undefined &&
      value.schemaVersion !== 1
    ) ||
    (
      value?.kind !== undefined &&
      value.kind !==
        'PRODUCT_EVIDENCE_RECORD'
    ) ||
    (
      value?.authorityLevel !== undefined &&
      value.authorityLevel !==
        recreated.authorityLevel
    )
  ) {
    throw new ProductTruthError(
      'PRODUCT_EVIDENCE_RECORD_INVALID',
      [recreated.evidenceId]
    );
  }

  return recreated;
}

function normalizeResolutionTarget(input) {
  if (!isPlainObject(input)) {
    throw new ProductTruthError(
      'RESOLUTION_TARGET_REQUIRED'
    );
  }

  const effectiveAt = normalizeRequiredDate(
    input.effectiveAt,
    'RESOLUTION_EFFECTIVE_AT_REQUIRED',
    'RESOLUTION_EFFECTIVE_AT_INVALID'
  );

  return {
    carrierId: requireNonEmptyString(
      input.carrierId,
      'CARRIER_ID_REQUIRED'
    ),
    productId: requireNonEmptyString(
      input.productId,
      'PRODUCT_ID_REQUIRED'
    ),
    productVersion: requireNonEmptyString(
      input.productVersion,
      'PRODUCT_VERSION_REQUIRED'
    ),
    claimPath: requireNonEmptyString(
      input.claimPath,
      'CLAIM_PATH_REQUIRED'
    ),
    effectiveAt,
    country: normalizeOptionalString(
      input.country,
      'COUNTRY_INVALID',
      item => item.toUpperCase()
    ),
    channel: normalizeOptionalString(
      input.channel,
      'CHANNEL_INVALID',
      item => item.toUpperCase()
    )
  };
}

function evidenceRejectionReason(
  evidence,
  target
) {
  if (evidence.carrierId !== target.carrierId) {
    return 'CROSS_CARRIER';
  }

  if (evidence.productId !== target.productId) {
    return 'CROSS_PRODUCT';
  }

  if (
    evidence.productVersion !==
    target.productVersion
  ) {
    return 'CROSS_VERSION';
  }

  if (evidence.claimPath !== target.claimPath) {
    return 'CLAIM_PATH_MISMATCH';
  }

  if (
    evidence.context.country !== null &&
    target.country === null
  ) {
    return 'COUNTRY_CONTEXT_REQUIRED';
  }

  if (
    evidence.context.country !== null &&
    evidence.context.country !== target.country
  ) {
    return 'COUNTRY_MISMATCH';
  }

  if (
    evidence.context.channel !== null &&
    target.channel === null
  ) {
    return 'CHANNEL_CONTEXT_REQUIRED';
  }

  if (
    evidence.context.channel !== null &&
    evidence.context.channel !== target.channel
  ) {
    return 'CHANNEL_MISMATCH';
  }

  const effectiveAt =
    Date.parse(target.effectiveAt);

  if (
    effectiveAt <
    Date.parse(evidence.effectivePeriod.from)
  ) {
    return 'NOT_YET_EFFECTIVE';
  }

  if (
    evidence.effectivePeriod.to !== null &&
    effectiveAt >=
      Date.parse(evidence.effectivePeriod.to)
  ) {
    return 'STALE';
  }

  return null;
}

function buildEvidenceConflict(
  claimPath,
  evidence
) {
  const groups = new Map();

  for (const record of evidence) {
    const key = canonicalClaimJson(
      record.claimValue
    );

    if (!groups.has(key)) {
      groups.set(key, {
        value: record.claimValue,
        evidenceIds: []
      });
    }

    groups
      .get(key)
      .evidenceIds
      .push(record.evidenceId);
  }

  if (groups.size <= 1) {
    return [];
  }

  const values = [...groups.entries()]
    .sort(([left], [right]) =>
      left.localeCompare(right)
    )
    .map(([, group]) => ({
      value: group.value,
      evidenceIds:
        [...group.evidenceIds].sort()
    }));

  return [{
    claimPath,
    evidenceIds: evidence
      .map(record => record.evidenceId)
      .sort(),
    values
  }];
}

export function createProductEvidenceRecord(
  input
) {
  if (!isPlainObject(input)) {
    throw new ProductTruthError(
      'PRODUCT_EVIDENCE_INPUT_REQUIRED'
    );
  }

  const sourceType = requireNonEmptyString(
    input.sourceType,
    'SOURCE_TYPE_REQUIRED'
  ).toUpperCase();

  if (
    !PRODUCT_EVIDENCE_TYPES.includes(
      sourceType
    )
  ) {
    throw new ProductTruthError(
      'SOURCE_TYPE_INVALID',
      [sourceType]
    );
  }

  const effectivePeriod =
    normalizeEffectivePeriod(input);

  const claimValue = normalizeClaimValue(
    input.claimValue
  );

  const record = {
    schemaVersion: 1,
    kind: 'PRODUCT_EVIDENCE_RECORD',
    evidenceId: requireNonEmptyString(
      input.evidenceId,
      'EVIDENCE_ID_REQUIRED'
    ),
    sourceId: requireNonEmptyString(
      input.sourceId,
      'SOURCE_ID_REQUIRED'
    ),
    sourceType,
    authorityLevel:
      PRODUCT_EVIDENCE_AUTHORITY_LEVELS[
        sourceType
      ],
    carrierId: requireNonEmptyString(
      input.carrierId,
      'CARRIER_ID_REQUIRED'
    ),
    productId: requireNonEmptyString(
      input.productId,
      'PRODUCT_ID_REQUIRED'
    ),
    productVersion: requireNonEmptyString(
      input.productVersion,
      'PRODUCT_VERSION_REQUIRED'
    ),
    claimPath: requireNonEmptyString(
      input.claimPath,
      'CLAIM_PATH_REQUIRED'
    ),
    claimValue,
    effectivePeriod,
    context: {
      country: normalizeOptionalString(
        input.country,
        'COUNTRY_INVALID',
        item => item.toUpperCase()
      ),
      channel: normalizeOptionalString(
        input.channel,
        'CHANNEL_INVALID',
        item => item.toUpperCase()
      )
    },
    boundaries: {
      owner: 'PRODUCT_INTELLIGENCE',
      aiMayCreateFacts: false,
      humanValidationRequired: true
    }
  };

  return deepFreeze(record);
}

export function resolveProductEvidence(
  targetInput,
  evidenceInput
) {
  const target =
    normalizeResolutionTarget(targetInput);

  if (!Array.isArray(evidenceInput)) {
    throw new ProductTruthError(
      'PRODUCT_EVIDENCE_COLLECTION_REQUIRED'
    );
  }

  const evidence = evidenceInput
    .map(normalizeEvidenceRecordInput)
    .sort((left, right) =>
      left.evidenceId.localeCompare(
        right.evidenceId
      )
    );

  const evidenceIds = new Set();

  for (const record of evidence) {
    if (evidenceIds.has(record.evidenceId)) {
      throw new ProductTruthError(
        'PRODUCT_EVIDENCE_DUPLICATE_ID',
        [record.evidenceId]
      );
    }

    evidenceIds.add(record.evidenceId);
  }

  const applicable = [];
  const rejectedEvidence = [];

  for (const record of evidence) {
    const reason = evidenceRejectionReason(
      record,
      target
    );

    if (reason === null) {
      applicable.push(record);
    } else {
      rejectedEvidence.push({
        evidenceId: record.evidenceId,
        reason
      });
    }
  }

  const prevailingLevel =
    applicable.length === 0
      ? null
      : Math.min(
          ...applicable.map(
            record => record.authorityLevel
          )
        );

  const prevailingEvidence =
    prevailingLevel === null
      ? []
      : applicable.filter(
          record =>
            record.authorityLevel ===
            prevailingLevel
        );

  const conflicts = buildEvidenceConflict(
    target.claimPath,
    applicable
  );

  let evidenceState = 'UNKNOWN';
  let actionable = false;

  if (conflicts.length > 0) {
    evidenceState = 'CONFLICTED';
  } else if (prevailingLevel === 1) {
    evidenceState = 'VERIFIED';
    actionable = true;
  } else if (prevailingLevel === 2) {
    evidenceState = 'PARTIAL';
  }

  return deepFreeze({
    schemaVersion: 1,
    kind: 'PRODUCT_EVIDENCE_RESOLUTION',
    carrierId: target.carrierId,
    productId: target.productId,
    productVersion: target.productVersion,
    claimPath: target.claimPath,
    effectiveAt: target.effectiveAt,
    context: {
      country: target.country,
      channel: target.channel
    },
    evidenceState,
    actionable,
    prevailingEvidenceIds:
      prevailingEvidence
        .map(record => record.evidenceId)
        .sort(),
    applicableEvidenceIds:
      applicable
        .map(record => record.evidenceId)
        .sort(),
    rejectedEvidence,
    sourceIds: [
      ...new Set(
        applicable.map(
          record => record.sourceId
        )
      )
    ].sort(),
    conflicts,
    boundaries: {
      owner: 'PRODUCT_INTELLIGENCE',
      aiMayCreateFacts: false,
      consumerMayOverrideHierarchy: false,
      consumerMayChangeVersion: false,
      conflictsMayBeDiscarded: false,
      humanDecisionRequired: true
    }
  });
}

export {
  EVIDENCE_STATES,
  PRODUCT_EVIDENCE_AUTHORITY_LEVELS,
  PRODUCT_EVIDENCE_TYPES
};
