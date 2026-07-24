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
