import {
  ProductTruthError,
  createProductEvidenceRecord,
  createProductTruthEnvelope,
  resolveProductEvidence
} from './index.mjs';

export class QuotePreparationDecisionError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'QuotePreparationDecisionError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}

function requireString(value, code) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new QuotePreparationDecisionError(code);
  }
  return value.trim();
}

function normalizeClaims(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new QuotePreparationDecisionError(
      'REQUESTED_CLAIMS_REQUIRED'
    );
  }

  return Object.freeze(
    [...new Set(
      value.map((claim, index) =>
        requireString(
          claim,
          `REQUESTED_CLAIM_${index}_INVALID`
        )
      )
    )].sort()
  );
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

function blockerCodes(resolution) {
  const codes = [];

  if (resolution.evidenceState === 'CONFLICTED') {
    codes.push('PRODUCT_TRUTH_CONFLICTED');
  }

  if (resolution.evidenceState === 'PARTIAL') {
    codes.push('PRODUCT_TRUTH_PARTIAL');
  }

  if (resolution.evidenceState === 'UNKNOWN') {
    codes.push('PRODUCT_TRUTH_UNKNOWN');
  }

  for (const rejected of resolution.rejectedEvidence) {
    codes.push(`EVIDENCE_${rejected.reason}`);
  }

  return [...new Set(codes)].sort();
}

function claimValueFromResolution(
  resolution,
  recordsById
) {
  const evidenceId =
    resolution.prevailingEvidenceIds[0];

  if (!evidenceId) {
    throw new QuotePreparationDecisionError(
      'PREVAILING_EVIDENCE_REQUIRED',
      [resolution.claimPath]
    );
  }

  const record = recordsById.get(evidenceId);

  if (!record) {
    throw new QuotePreparationDecisionError(
      'PREVAILING_EVIDENCE_NOT_FOUND',
      [evidenceId]
    );
  }

  return structuredClone(record.claimValue);
}

export function createQuotePreparationDecision(input) {
  if (!isPlainObject(input)) {
    throw new QuotePreparationDecisionError(
      'QUOTE_PREPARATION_INPUT_REQUIRED'
    );
  }

  const productId = requireString(
    input.productId,
    'PRODUCT_ID_REQUIRED'
  );
  const carrierId = requireString(
    input.carrierId,
    'CARRIER_ID_REQUIRED'
  );
  const productName = requireString(
    input.productName,
    'PRODUCT_NAME_REQUIRED'
  );
  const productVersion = requireString(
    input.productVersion,
    'PRODUCT_VERSION_REQUIRED'
  );
  const productFamily = requireString(
    input.productFamily,
    'PRODUCT_FAMILY_REQUIRED'
  );
  const effectiveAt = requireString(
    input.effectiveAt,
    'EFFECTIVE_AT_REQUIRED'
  );

  if (Number.isNaN(Date.parse(effectiveAt))) {
    throw new QuotePreparationDecisionError(
      'EFFECTIVE_AT_INVALID',
      [effectiveAt]
    );
  }

  const requestedClaims =
    normalizeClaims(input.requestedClaims);

  if (
    !Array.isArray(input.evidence)
    || input.evidence.length < 2
  ) {
    throw new QuotePreparationDecisionError(
      'MULTIPLE_PRODUCT_EVIDENCE_REQUIRED'
    );
  }

  let records;

  try {
    records = input.evidence.map(
      createProductEvidenceRecord
    );
  } catch (error) {
    if (error instanceof ProductTruthError) {
      throw new QuotePreparationDecisionError(
        'PRODUCT_EVIDENCE_INVALID',
        [error.code]
      );
    }
    throw error;
  }

  const uniqueSources = new Set(
    records.map(record => record.sourceId)
  );

  if (uniqueSources.size < 2) {
    throw new QuotePreparationDecisionError(
      'MULTIPLE_PRODUCT_SOURCES_REQUIRED'
    );
  }

  const recordsById = new Map(
    records.map(record => [
      record.evidenceId,
      record
    ])
  );

  const resolutions = requestedClaims.map(
    claimPath => resolveProductEvidence(
      {
        carrierId,
        productId,
        productVersion,
        claimPath,
        effectiveAt,
        country: input.country ?? null,
        channel: input.channel ?? null
      },
      records.filter(
        record => record.claimPath === claimPath
      )
    )
  );

  const blockedClaims = resolutions
    .filter(
      resolution =>
        !resolution.actionable
        || resolution.evidenceState !== 'VERIFIED'
    )
    .map(resolution => ({
      claimPath: resolution.claimPath,
      evidenceState: resolution.evidenceState,
      reasonCodes: blockerCodes(resolution),
      rejectedEvidence:
        resolution.rejectedEvidence,
      conflicts: resolution.conflicts
    }));

  if (blockedClaims.length > 0) {
    return deepFreeze({
      schemaVersion: 1,
      kind: 'QUOTE_PREPARATION_DECISION',
      decision: 'BLOCK_QUOTE_PREPARATION',
      allowed: false,
      actionable: false,
      productId,
      carrierId,
      productVersion,
      effectiveAt,
      requestedClaims,
      blockedClaims,
      claimResolutions: resolutions,
      productTruth: null,
      boundaries: {
        owner: 'QUOTE_PREPARATION_CONSUMER',
        consumesProductTruth: true,
        mayOverrideProductTruth: false,
        evaluatesClientSuitability: false,
        sendsQuote: false,
        humanDecisionRequired: true
      }
    });
  }

  const facts = {};
  for (const resolution of resolutions) {
    facts[resolution.claimPath] =
      claimValueFromResolution(
        resolution,
        recordsById
      );
  }

  const sourceIds = [
    ...new Set(
      resolutions.flatMap(
        resolution => resolution.sourceIds
      )
    )
  ].sort();

  const productTruth = createProductTruthEnvelope({
    productId,
    carrierId,
    productName,
    productVersion,
    productFamily,
    evidenceState: 'VERIFIED',
    effectiveFrom:
      input.productEffectiveFrom ?? effectiveAt,
    effectiveTo:
      input.productEffectiveTo ?? null,
    rulePackId: input.rulePackId ?? null,
    currency: input.currency ?? null,
    country: input.country ?? null,
    channel: input.channel ?? null,
    sourceIds,
    facts,
    unknownFields: [],
    conflicts: []
  });

  return deepFreeze({
    schemaVersion: 1,
    kind: 'QUOTE_PREPARATION_DECISION',
    decision: 'ALLOW_QUOTE_PREPARATION',
    allowed: true,
    actionable: true,
    productId,
    carrierId,
    productVersion,
    effectiveAt,
    requestedClaims,
    blockedClaims: [],
    claimResolutions: resolutions,
    productTruth,
    boundaries: {
      owner: 'QUOTE_PREPARATION_CONSUMER',
      consumesProductTruth: true,
      mayOverrideProductTruth: false,
      evaluatesClientSuitability: false,
      sendsQuote: false,
      humanDecisionRequired: true
    }
  });
}
