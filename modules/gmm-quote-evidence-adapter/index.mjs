import crypto from 'node:crypto';

import {
  createProductEvidenceRecord
} from '../product-intelligence/index.mjs';

import {
  createCarrierScope
} from '../carrier-scope/index.mjs';

export const GMM_QUOTE_CONTRACT_VERSION =
  '1.0.0';

const FORBIDDEN_SECRET_KEY =
  /^(authorization|api[-_]?key|access[-_]?token|refresh[-_]?token|password|secret|private[-_]?key)$/iu;

const TOP_LEVEL_KEYS = new Set([
  'schemaVersion',
  'kind',
  'contractVersion',
  'sourceSnapshot',
  'claims'
]);

const SOURCE_KEYS = new Set([
  'quoteId',
  'sourceSystem',
  'sourceId',
  'sourceType',
  'carrierId',
  'carrierScope',
  'productId',
  'productVersion',
  'generatedAt',
  'effectiveFrom',
  'effectiveTo',
  'country',
  'channel',
  'currency'
]);

const CLAIM_KEYS = new Set([
  'claimPath',
  'claimValue',
  'sourcePage'
]);

export class GmmQuoteEvidenceAdapterError
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
      'GmmQuoteEvidenceAdapterError';
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
    throw new GmmQuoteEvidenceAdapterError(
      code
    );
  }

  return value.trim();
}

function requireDate(value, code) {
  const normalized = requireString(value, code);

  if (Number.isNaN(Date.parse(normalized))) {
    throw new GmmQuoteEvidenceAdapterError(
      code,
      [normalized]
    );
  }

  return normalized;
}

function assertAllowedKeys(
  value,
  allowed,
  code
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new GmmQuoteEvidenceAdapterError(
        code,
        [key]
      );
    }
  }
}

function assertNoSecrets(
  value,
  trail = []
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoSecrets(item, [...trail, index])
    );
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_SECRET_KEY.test(key)) {
      throw new GmmQuoteEvidenceAdapterError(
        'SECRET_MATERIAL_FORBIDDEN',
        [[...trail, key].join('.')]
      );
    }

    assertNoSecrets(child, [...trail, key]);
  }
}

function normalizeJsonValue(value) {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new GmmQuoteEvidenceAdapterError(
        'CLAIM_VALUE_INVALID'
      );
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [
          key,
          normalizeJsonValue(value[key])
        ])
    );
  }

  throw new GmmQuoteEvidenceAdapterError(
    'CLAIM_VALUE_INVALID'
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

function canonicalJson(value) {
  return JSON.stringify(
    normalizeJsonValue(value)
  );
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function evidenceId(
  sourceId,
  claimPath
) {
  const suffix = sha256(claimPath)
    .slice(0, 20)
    .toUpperCase();

  return `${sourceId}:CLAIM:${suffix}`;
}

function normalizeSourceSnapshot(value) {
  if (!isPlainObject(value)) {
    throw new GmmQuoteEvidenceAdapterError(
      'SOURCE_SNAPSHOT_REQUIRED'
    );
  }

  assertAllowedKeys(
    value,
    SOURCE_KEYS,
    'SOURCE_SNAPSHOT_FIELD_UNKNOWN'
  );

  const sourceType = requireString(
    value.sourceType,
    'SOURCE_TYPE_REQUIRED'
  ).toUpperCase();

  if (sourceType !== 'QUOTE_ILLUSTRATION') {
    throw new GmmQuoteEvidenceAdapterError(
      'SOURCE_TYPE_UNSUPPORTED',
      [sourceType]
    );
  }

  let carrierScope;

  try {
    carrierScope = createCarrierScope(
      value.carrierScope
    );
  } catch (error) {
    throw new GmmQuoteEvidenceAdapterError(
      'CARRIER_SCOPE_INVALID',
      [error.message]
    );
  }

  const carrierId = requireString(
    value.carrierId,
    'CARRIER_ID_REQUIRED'
  );

  if (
    carrierId.toLowerCase()
      !== carrierScope.carrier
  ) {
    throw new GmmQuoteEvidenceAdapterError(
      'CARRIER_SCOPE_MISMATCH',
      [
        carrierId,
        carrierScope.carrier
      ]
    );
  }

  const generatedAt = requireDate(
    value.generatedAt,
    'GENERATED_AT_INVALID'
  );
  const effectiveFrom = requireDate(
    value.effectiveFrom,
    'EFFECTIVE_FROM_INVALID'
  );

  const effectiveTo =
    value.effectiveTo === null
    || value.effectiveTo === undefined
      ? null
      : requireDate(
          value.effectiveTo,
          'EFFECTIVE_TO_INVALID'
        );

  if (
    effectiveTo !== null
    && Date.parse(effectiveTo)
      <= Date.parse(effectiveFrom)
  ) {
    throw new GmmQuoteEvidenceAdapterError(
      'EFFECTIVE_PERIOD_INVALID'
    );
  }

  return {
    quoteId: requireString(
      value.quoteId,
      'QUOTE_ID_REQUIRED'
    ),
    sourceSystem: requireString(
      value.sourceSystem,
      'SOURCE_SYSTEM_REQUIRED'
    ),
    sourceId: requireString(
      value.sourceId,
      'SOURCE_ID_REQUIRED'
    ),
    sourceType,
    carrierId,
    carrierScope,
    productId: requireString(
      value.productId,
      'PRODUCT_ID_REQUIRED'
    ),
    productVersion: requireString(
      value.productVersion,
      'PRODUCT_VERSION_REQUIRED'
    ),
    generatedAt,
    effectiveFrom,
    effectiveTo,
    country: requireString(
      value.country,
      'COUNTRY_REQUIRED'
    ).toUpperCase(),
    channel: requireString(
      value.channel,
      'CHANNEL_REQUIRED'
    ).toUpperCase(),
    currency: requireString(
      value.currency,
      'CURRENCY_REQUIRED'
    ).toUpperCase()
  };
}

function normalizeClaims(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new GmmQuoteEvidenceAdapterError(
      'QUOTE_CLAIMS_REQUIRED'
    );
  }

  const seenPaths = new Set();

  const claims = value.map(
    (claim, index) => {
      if (!isPlainObject(claim)) {
        throw new GmmQuoteEvidenceAdapterError(
          'QUOTE_CLAIM_INVALID',
          [String(index)]
        );
      }

      assertAllowedKeys(
        claim,
        CLAIM_KEYS,
        'QUOTE_CLAIM_FIELD_UNKNOWN'
      );

      const claimPath = requireString(
        claim.claimPath,
        `CLAIM_PATH_${index}_REQUIRED`
      );

      if (seenPaths.has(claimPath)) {
        throw new GmmQuoteEvidenceAdapterError(
          'DUPLICATE_CLAIM_PATH',
          [claimPath]
        );
      }

      seenPaths.add(claimPath);

      if (claim.claimValue === undefined) {
        throw new GmmQuoteEvidenceAdapterError(
          'CLAIM_VALUE_REQUIRED',
          [claimPath]
        );
      }

      const sourcePage = Number(
        claim.sourcePage
      );

      if (
        !Number.isInteger(sourcePage)
        || sourcePage <= 0
      ) {
        throw new GmmQuoteEvidenceAdapterError(
          'SOURCE_PAGE_INVALID',
          [claimPath]
        );
      }

      return {
        claimPath,
        claimValue:
          normalizeJsonValue(
            claim.claimValue
          ),
        sourcePage
      };
    }
  );

  return claims.sort(
    (left, right) =>
      left.claimPath.localeCompare(
        right.claimPath
      )
  );
}

function normalizeFixture(input) {
  if (!isPlainObject(input)) {
    throw new GmmQuoteEvidenceAdapterError(
      'GMM_QUOTE_FIXTURE_REQUIRED'
    );
  }

  assertNoSecrets(input);

  assertAllowedKeys(
    input,
    TOP_LEVEL_KEYS,
    'GMM_QUOTE_FIXTURE_FIELD_UNKNOWN'
  );

  if (input.schemaVersion !== 1) {
    throw new GmmQuoteEvidenceAdapterError(
      'GMM_QUOTE_FIXTURE_SCHEMA_UNSUPPORTED',
      [String(input.schemaVersion)]
    );
  }

  if (
    input.kind !==
      'GMM_QUOTE_CONTRACT_FIXTURE'
  ) {
    throw new GmmQuoteEvidenceAdapterError(
      'GMM_QUOTE_FIXTURE_KIND_INVALID'
    );
  }

  if (
    input.contractVersion !==
      GMM_QUOTE_CONTRACT_VERSION
  ) {
    throw new GmmQuoteEvidenceAdapterError(
      'GMM_QUOTE_CONTRACT_VERSION_UNSUPPORTED',
      [String(input.contractVersion)]
    );
  }

  return {
    schemaVersion: 1,
    kind: 'GMM_QUOTE_CONTRACT_FIXTURE',
    contractVersion:
      GMM_QUOTE_CONTRACT_VERSION,
    sourceSnapshot:
      normalizeSourceSnapshot(
        input.sourceSnapshot
      ),
    claims: normalizeClaims(input.claims)
  };
}

export function canonicalizeGmmQuoteFixture(
  input
) {
  return deepFreeze(
    normalizeFixture(input)
  );
}

export function createGmmQuoteFixtureFingerprint(
  input
) {
  const normalized = normalizeFixture(input);

  return sha256(
    canonicalJson(normalized)
  );
}

export function ingestGmmQuoteEvidence(
  input
) {
  const normalized = normalizeFixture(input);

  const fixtureFingerprint = sha256(
    canonicalJson(normalized)
  );

  const records = normalized.claims.map(
    claim =>
      createProductEvidenceRecord({
        evidenceId: evidenceId(
          normalized.sourceSnapshot.sourceId,
          claim.claimPath
        ),
        sourceId:
          normalized.sourceSnapshot.sourceId,
        sourceType:
          normalized.sourceSnapshot.sourceType,
        carrierId:
          normalized.sourceSnapshot.carrierId,
        productId:
          normalized.sourceSnapshot.productId,
        productVersion:
          normalized.sourceSnapshot.productVersion,
        claimPath: claim.claimPath,
        claimValue: claim.claimValue,
        effectiveFrom:
          normalized.sourceSnapshot.effectiveFrom,
        effectiveTo:
          normalized.sourceSnapshot.effectiveTo,
        country:
          normalized.sourceSnapshot.country,
        channel:
          normalized.sourceSnapshot.channel
      })
  );

  return deepFreeze({
    schemaVersion: 1,
    kind: 'GMM_QUOTE_EVIDENCE_BATCH',
    adapterId:
      'MOD-GMM-QUOTE-EVIDENCE-ADAPTER',
    contractVersion:
      GMM_QUOTE_CONTRACT_VERSION,
    fixtureFingerprint,
    sourceSnapshot:
      normalized.sourceSnapshot,
    records,
    trace: normalized.claims.map(
      claim => ({
        claimPath: claim.claimPath,
        sourcePage: claim.sourcePage,
        evidenceId: evidenceId(
          normalized.sourceSnapshot.sourceId,
          claim.claimPath
        )
      })
    ),
    boundaries: {
      owner:
        'GMM_QUOTE_EVIDENCE_ADAPTER',
      faithfulContractFixture: true,
      productIntelligenceOwnsTruth: true,
      adapterMayVerifyProductTruth: false,
      adapterMayIncreaseAuthority: false,
      adapterStoresSecrets: false,
      humanValidationRequired: true
    }
  });
}

export function assertGmmQuoteEvidenceBatch(
  value
) {
  if (
    !isPlainObject(value)
    || value.schemaVersion !== 1
    || value.kind !==
      'GMM_QUOTE_EVIDENCE_BATCH'
    || value.adapterId !==
      'MOD-GMM-QUOTE-EVIDENCE-ADAPTER'
    || typeof value.fixtureFingerprint
      !== 'string'
    || !/^[a-f0-9]{64}$/u.test(
      value.fixtureFingerprint
    )
    || !Array.isArray(value.records)
    || value.records.length === 0
  ) {
    throw new GmmQuoteEvidenceAdapterError(
      'GMM_QUOTE_EVIDENCE_BATCH_INVALID'
    );
  }

  return true;
}
