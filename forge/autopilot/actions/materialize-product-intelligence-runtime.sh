#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${FORGE_REPO_ROOT:-$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd -P)}"

cd "$ROOT"

CONSUMER="modules/product-intelligence/quote-preparation-consumer.mjs"
CONSUMER_TEST="modules/product-intelligence/quote-preparation-consumer.test.mjs"

cat > "$CONSUMER" <<'CONSUMER_JS'
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
CONSUMER_JS

cat > "$CONSUMER_TEST" <<'CONSUMER_TEST_JS'
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QuotePreparationDecisionError,
  createQuotePreparationDecision
} from './quote-preparation-consumer.mjs';

function evidence(overrides = {}) {
  return {
    evidenceId: 'EVIDENCE-MANUAL-DEATH-2026',
    sourceId: 'SOURCE-OFFICIAL-MANUAL-2026',
    sourceType: 'OFFICIAL_PRODUCT_MANUAL',
    carrierId: 'SMNYL',
    productId: 'SMNYL-VIDA-001',
    productVersion: '2026.1',
    claimPath: 'benefits.deathCoverage',
    claimValue: {
      currency: 'MXN',
      maximumAmount: 2000000
    },
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveTo: null,
    country: 'MX',
    channel: 'ADVISOR',
    ...overrides
  };
}

function request(overrides = {}) {
  return {
    productId: 'SMNYL-VIDA-001',
    carrierId: 'SMNYL',
    productName: 'Seguro de Vida',
    productVersion: '2026.1',
    productFamily: 'LIFE',
    effectiveAt: '2026-07-15T12:00:00Z',
    productEffectiveFrom:
      '2026-01-01T00:00:00Z',
    rulePackId: 'RP-SMNYL-VIDA-2026-1',
    currency: 'MXN',
    country: 'MX',
    channel: 'ADVISOR',
    requestedClaims: [
      'benefits.deathCoverage',
      'eligibility.minimumAge'
    ],
    evidence: [
      evidence(),
      evidence({
        evidenceId: 'EVIDENCE-QUOTE-DEATH-2026',
        sourceId: 'SOURCE-QUOTE-CASE-1042',
        sourceType: 'QUOTE_ILLUSTRATION'
      }),
      evidence({
        evidenceId: 'EVIDENCE-CONDITIONS-AGE-2026',
        sourceId: 'SOURCE-GENERAL-CONDITIONS-2026',
        sourceType: 'GENERAL_CONDITIONS',
        claimPath: 'eligibility.minimumAge',
        claimValue: 18
      }),
      evidence({
        evidenceId: 'EVIDENCE-BROCHURE-AGE-2026',
        sourceId: 'SOURCE-PRODUCT-BROCHURE-2026',
        sourceType: 'PRODUCT_BROCHURE',
        claimPath: 'eligibility.minimumAge',
        claimValue: 18
      })
    ],
    ...overrides
  };
}

test(
  'consumer allows quote preparation from actionable multi-source Product Truth',
  () => {
    const decision =
      createQuotePreparationDecision(request());

    assert.equal(
      decision.decision,
      'ALLOW_QUOTE_PREPARATION'
    );
    assert.equal(decision.allowed, true);
    assert.equal(decision.actionable, true);
    assert.equal(
      decision.productTruth.actionable,
      true
    );
    assert.equal(
      decision.productTruth.facts[
        'eligibility.minimumAge'
      ],
      18
    );
    assert.equal(
      decision.productTruth.facts[
        'benefits.deathCoverage'
      ].maximumAmount,
      2000000
    );
    assert.equal(
      decision.claimResolutions.every(
        resolution =>
          resolution.evidenceState ===
          'VERIFIED'
      ),
      true
    );
    assert.equal(
      decision.boundaries.humanDecisionRequired,
      true
    );
  }
);

test(
  'consumer blocks quote preparation when equal-authority sources conflict',
  () => {
    const conflictRequest = request({
      requestedClaims: [
        'benefits.deathCoverage'
      ],
      evidence: [
        evidence(),
        evidence({
          evidenceId:
            'EVIDENCE-CONDITIONS-DEATH-2026',
          sourceId:
            'SOURCE-GENERAL-CONDITIONS-2026',
          sourceType: 'GENERAL_CONDITIONS',
          claimValue: {
            currency: 'MXN',
            maximumAmount: 1500000
          }
        })
      ]
    });

    const decision =
      createQuotePreparationDecision(
        conflictRequest
      );

    assert.equal(
      decision.decision,
      'BLOCK_QUOTE_PREPARATION'
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.productTruth, null);
    assert.equal(
      decision.blockedClaims[0].evidenceState,
      'CONFLICTED'
    );
    assert.ok(
      decision.blockedClaims[0]
        .reasonCodes
        .includes('PRODUCT_TRUTH_CONFLICTED')
    );
  }
);

test(
  'consumer blocks stale product evidence at the requested effective time',
  () => {
    const staleRequest = request({
      requestedClaims: [
        'benefits.deathCoverage'
      ],
      evidence: [
        evidence({
          effectiveTo:
            '2026-06-01T00:00:00Z'
        }),
        evidence({
          evidenceId:
            'EVIDENCE-CONDITIONS-DEATH-STALE',
          sourceId:
            'SOURCE-GENERAL-CONDITIONS-2025',
          sourceType: 'GENERAL_CONDITIONS',
          effectiveTo:
            '2026-06-01T00:00:00Z'
        })
      ]
    });

    const decision =
      createQuotePreparationDecision(
        staleRequest
      );

    assert.equal(
      decision.decision,
      'BLOCK_QUOTE_PREPARATION'
    );
    assert.equal(
      decision.blockedClaims[0].evidenceState,
      'UNKNOWN'
    );
    assert.ok(
      decision.blockedClaims[0]
        .reasonCodes
        .includes('EVIDENCE_STALE')
    );
  }
);

test(
  'consumer rejects a flow without multiple independent product sources',
  () => {
    assert.throws(
      () =>
        createQuotePreparationDecision(
          request({
            evidence: [
              evidence(),
              evidence({
                evidenceId:
                  'EVIDENCE-MANUAL-DEATH-COPY',
                claimValue: {
                  currency: 'MXN',
                  maximumAmount: 2000000
                }
              })
            ]
          })
        ),
      error =>
        error instanceof
          QuotePreparationDecisionError
        && error.code ===
          'MULTIPLE_PRODUCT_SOURCES_REQUIRED'
    );
  }
);
CONSUMER_TEST_JS

node --input-type=module <<'UPDATE_MANIFEST'
import fs from 'node:fs';

const file = 'forge/modules.json';
const manifest = JSON.parse(
  fs.readFileSync(file, 'utf8')
);
const moduleRecord = manifest.modules.find(
  record =>
    record.id === 'MOD-PRODUCT-INTELLIGENCE'
);

if (!moduleRecord) {
  throw new Error(
    'MOD_PRODUCT_INTELLIGENCE_NOT_FOUND'
  );
}

const consumerTest =
  'modules/product-intelligence/quote-preparation-consumer.test.mjs';

moduleRecord.tests = [
  ...new Set([
    ...(moduleRecord.tests ?? []),
    consumerTest
  ])
];

moduleRecord.description =
  'Version-aware Product Truth runtime with evidence hierarchy, conflict and stale handling, plus a governed quote-preparation consumer decision.';

fs.writeFileSync(
  file,
  `${JSON.stringify(manifest, null, 2)}\n`
);
UPDATE_MANIFEST

node --check "$CONSUMER"
node --check "$CONSUMER_TEST"

printf '%s\n' \
  "PRODUCT_INTELLIGENCE_IMPLEMENTATION=PASS" \
  "CONSUMER=$CONSUMER" \
  "CONSUMER_TEST=$CONSUMER_TEST"
