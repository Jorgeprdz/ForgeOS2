import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  GmmQuoteEvidenceAdapterError,
  assertGmmQuoteEvidenceBatch,
  canonicalizeGmmQuoteFixture,
  createGmmQuoteFixtureFingerprint,
  ingestGmmQuoteEvidence
} from './index.mjs';

import {
  resolveProductEvidence
} from '../product-intelligence/index.mjs';

const fixturePath = new URL(
  './fixtures/gmm-quote-contract-v1.json',
  import.meta.url
);

function fixture() {
  return JSON.parse(
    fs.readFileSync(
      fixturePath,
      'utf8'
    )
  );
}

test(
  'faithful GMM quote fixture maps deterministically to canonical Product Evidence records',
  () => {
    const first =
      ingestGmmQuoteEvidence(fixture());
    const second =
      ingestGmmQuoteEvidence(fixture());

    assert.equal(
      assertGmmQuoteEvidenceBatch(first),
      true
    );
    assert.deepEqual(first, second);
    assert.equal(
      first.fixtureFingerprint,
      createGmmQuoteFixtureFingerprint(
        fixture()
      )
    );
    assert.equal(first.records.length, 3);
    assert.equal(
      first.records.every(
        record =>
          record.sourceType ===
            'QUOTE_ILLUSTRATION'
          && record.authorityLevel === 2
          && record.carrierId === 'SMNYL'
          && record.productVersion ===
            '2026.1'
      ),
      true
    );
    assert.equal(
      Object.isFrozen(first),
      true
    );
    assert.equal(
      Object.isFrozen(first.records),
      true
    );
  }
);

test(
  'Product Intelligence consumes mapped quote evidence without upgrading quote authority',
  () => {
    const batch =
      ingestGmmQuoteEvidence(fixture());

    const deductible =
      batch.records.find(
        record =>
          record.claimPath ===
            'costSharing.deductible'
      );

    const resolution =
      resolveProductEvidence(
        {
          carrierId: 'SMNYL',
          productId: 'SMNYL-GMM-001',
          productVersion: '2026.1',
          claimPath:
            'costSharing.deductible',
          effectiveAt:
            '2026-08-01T00:00:00Z',
          country: 'MX',
          channel: 'ADVISOR'
        },
        [deductible]
      );

    assert.equal(
      resolution.evidenceState,
      'PARTIAL'
    );
    assert.equal(
      resolution.actionable,
      false
    );
    assert.deepEqual(
      resolution.prevailingEvidenceIds,
      [deductible.evidenceId]
    );
    assert.equal(
      batch.boundaries
        .productIntelligenceOwnsTruth,
      true
    );
    assert.equal(
      batch.boundaries
        .adapterMayIncreaseAuthority,
      false
    );
  }
);

test(
  'stale quote evidence remains rejected at the consumer boundary',
  () => {
    const batch =
      ingestGmmQuoteEvidence(fixture());

    const deductible =
      batch.records.find(
        record =>
          record.claimPath ===
            'costSharing.deductible'
      );

    const resolution =
      resolveProductEvidence(
        {
          carrierId: 'SMNYL',
          productId: 'SMNYL-GMM-001',
          productVersion: '2026.1',
          claimPath:
            'costSharing.deductible',
          effectiveAt:
            '2027-07-01T00:00:00Z',
          country: 'MX',
          channel: 'ADVISOR'
        },
        [deductible]
      );

    assert.equal(
      resolution.evidenceState,
      'UNKNOWN'
    );
    assert.equal(
      resolution.actionable,
      false
    );
    assert.deepEqual(
      resolution.rejectedEvidence,
      [{
        evidenceId:
          deductible.evidenceId,
        reason: 'STALE'
      }]
    );
  }
);

test(
  'duplicate claim paths fail closed instead of creating duplicate evidence',
  () => {
    const invalid = fixture();

    invalid.claims.push({
      ...invalid.claims[0],
      sourcePage: 3
    });

    assert.throws(
      () => ingestGmmQuoteEvidence(invalid),
      error =>
        error instanceof
          GmmQuoteEvidenceAdapterError
        && error.code ===
          'DUPLICATE_CLAIM_PATH'
    );
  }
);

test(
  'unsupported contract versions represent an external contract failure',
  () => {
    const invalid = fixture();
    invalid.contractVersion = '2.0.0';

    assert.throws(
      () => ingestGmmQuoteEvidence(invalid),
      error =>
        error instanceof
          GmmQuoteEvidenceAdapterError
        && error.code ===
          'GMM_QUOTE_CONTRACT_VERSION_UNSUPPORTED'
    );
  }
);

test(
  'secret-like fields are rejected before canonical mapping',
  () => {
    const invalid = fixture();

    invalid.sourceSnapshot.authorization =
      'Bearer forbidden';

    assert.throws(
      () => canonicalizeGmmQuoteFixture(
        invalid
      ),
      error =>
        error instanceof
          GmmQuoteEvidenceAdapterError
        && error.code ===
          'SECRET_MATERIAL_FORBIDDEN'
    );
  }
);

test(
  'carrier scope mismatches fail closed at the external boundary',
  () => {
    const invalid = fixture();

    invalid.sourceSnapshot.carrierScope =
      {
        carrier: 'gnp',
        market: 'mexico',
        productLine:
          'gastos-medicos-mayores'
      };

    assert.throws(
      () => ingestGmmQuoteEvidence(invalid),
      error =>
        error instanceof
          GmmQuoteEvidenceAdapterError
        && error.code ===
          'CARRIER_SCOPE_MISMATCH'
    );
  }
);
