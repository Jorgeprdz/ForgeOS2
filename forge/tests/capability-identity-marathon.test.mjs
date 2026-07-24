import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

import {
  runWave
} from '../migration/capability-identity-marathon.mjs';

function registryFixture(report) {
  return {
    schemaVersion: 1,
    kind:
      'FORGE_CAPABILITY_IDENTITY_LOCK_REGISTRY',
    source: {
      groupingReportHash:
        report.reportHash,
      legacyHead:
        report.source.legacyHead,
      v2BaselineHead:
        report.source.v2Head
    },
    createdAt:
      '2026-07-24T00:00:00.000Z',
    updatedAt:
      '2026-07-24T00:00:00.000Z',
    safety: {
      identityLockIsNotParity: true,
      automaticHighRiskLock: false,
      automaticRewrite: false,
      automaticRetirement: false
    },
    reviewedGroupIds: [],
    lockedIdentities: [],
    humanReviewRequired: [],
    splitRequired: [],
    mergeRejected: [],
    waves: [],
    totals: {
      reviewedGroups: 0,
      lockedIdentities: 0,
      humanReviewRequired: 0,
      splitRequired: 0,
      mergeRejected: 0,
      testPass: 0,
      testFail: 0,
      testTimeout: 0,
      testMissing: 0,
      testUnrunnable: 0,
      testDeferred: 0,
      testSkippedSafety: 0
    },
    parity: {
      verifiedCapabilities: 0,
      verifiedPercentage: null
    }
  };
}

function createLegacyFixture() {
  const root = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'forge-identity-marathon-'
    )
  );

  fs.mkdirSync(
    path.join(root, 'tests'),
    { recursive: true }
  );

  fs.writeFileSync(
    path.join(
      root,
      'tests/pass-test.js'
    ),
    "process.stdout.write('PASS\\n');\n"
  );

  fs.writeFileSync(
    path.join(
      root,
      'tests/fail-test.js'
    ),
    "process.stderr.write('FAIL\\n'); process.exitCode = 1;\n"
  );

  return root;
}

function group({
  id,
  name,
  riskTags = [],
  testFiles = ['tests/pass-test.js'],
  memberCount = 2,
  memberDomains = ['tooling'],
  minimumScore = 12,
  kind = 'INFRASTRUCTURE',
  domain = 'tooling'
}) {
  return {
    id,
    name,
    effectiveDomain: domain,
    kind,
    memberCount,
    memberCapabilityIds: [
      `${id}-A`,
      `${id}-B`
    ],
    memberDomains,
    codeFiles: [],
    testFiles,
    ruleArtifacts: [],
    sourceSurfaceKeys: [name],
    riskTags,
    reviewReasons: [],
    migrationPriority: 100,
    mergeEvidence: [{
      leftId: `${id}-A`,
      rightId: `${id}-B`,
      score: minimumScore,
      reasons: [
        'DIRECT_IMPORT_WITH_FUNCTIONAL_OVERLAP'
      ]
    }]
  };
}

function reportFixture(groups) {
  return {
    kind:
      'FORGE_LEGACY_CAPABILITY_GROUPING_V2_CANDIDATE',
    reportHash: 'a'.repeat(64),
    source: {
      legacyHead: 'b'.repeat(40),
      v2Head: 'c'.repeat(40)
    },
    groups
  };
}

test(
  'locks a low-risk identity only when legacy tests pass',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id: 'CAP2-TOOLING-PARSER',
        name: 'parser'
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.counts.lockedIdentities,
      1
    );
    assert.equal(
      result.wave.reviews[0].disposition,
      'LOCKED_IDENTITY'
    );
    assert.equal(
      result.registry.parity
        .verifiedCapabilities,
      0
    );
  }
);

test(
  'high-risk financial identities always require human review',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id:
          'CAP2-COMPENSATION-BONUS',
        name: 'bonus',
        domain: 'compensation',
        kind: 'BUSINESS',
        memberDomains: [
          'compensation'
        ],
        riskTags: [
          'FINANCIAL_TRUTH'
        ]
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.counts.lockedIdentities,
      0
    );
    assert.equal(
      result.wave.reviews[0].disposition,
      'HUMAN_REVIEW_REQUIRED'
    );
  }
);

test(
  'failing or absent standalone tests block autonomous identity lock',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id: 'CAP2-TOOLING-FAIL',
        name: 'fail',
        testFiles: [
          'tests/fail-test.js'
        ]
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.reviews[0].disposition,
      'HUMAN_REVIEW_REQUIRED'
    );
    assert.equal(
      result.registry.totals.testFail,
      1
    );
  }
);

test(
  'large groups are split instead of auto-locked',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id: 'CAP2-TOOLING-LARGE',
        name: 'large',
        memberCount: 20
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.reviews[0].disposition,
      'SPLIT_REQUIRED'
    );
  }
);

test(
  'completed groups are not reviewed twice',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id: 'CAP2-TOOLING-PARSER',
        name: 'parser'
      })
    ]);
    const registry =
      registryFixture(report);

    const first = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    const second = runWave({
      groupingReport: report,
      registry: first.registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      second.status,
      'COMPLETE'
    );
  }
);

test(
  'scenario seeds include payment boundaries for financial names',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id:
          'CAP2-COMPENSATION-PAYOUT',
        name:
          'partner-payment-payout',
        domain: 'compensation',
        kind: 'BUSINESS',
        memberDomains: [
          'compensation'
        ],
        riskTags: [
          'FINANCIAL_TRUTH'
        ]
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.ok(
      result.wave.reviews[0]
        .scenarioSeeds.includes(
          'PAYMENT_EVIDENCE_BOUNDARY'
        )
    );
  }
);

test(
  'business identities are never auto-locked unattended even when tests pass',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id: 'CAP2-CRM-FOLLOW-UP',
        name: 'follow-up',
        domain: 'crmClient',
        kind: 'BUSINESS',
        memberDomains: ['crmClient']
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.reviews[0].disposition,
      'HUMAN_REVIEW_REQUIRED'
    );
  }
);

test(
  'omitted associated tests block autonomous identity lock',
  () => {
    const legacyRoot =
      createLegacyFixture();
    fs.writeFileSync(
      path.join(
        legacyRoot,
        'tests/pass-two-test.js'
      ),
      "process.stdout.write('PASS TWO\\n');\\n"
    );
    const report = reportFixture([
      group({
        id: 'CAP2-TOOLING-MULTI-TEST',
        name: 'multi-test',
        testFiles: [
          'tests/pass-test.js',
          'tests/pass-two-test.js'
        ]
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 1,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.reviews[0].omittedTestCount,
      1
    );
    assert.equal(
      result.wave.reviews[0].disposition,
      'HUMAN_REVIEW_REQUIRED'
    );
  }
);

test(
  'deadline stops before starting another review and preserves a clean checkpoint',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const report = reportFixture([
      group({
        id: 'CAP2-TOOLING-DEADLINE',
        name: 'deadline'
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000,
      deadlineEpoch:
        Math.floor(Date.now() / 1000)
    });

    assert.equal(
      result.status,
      'DEADLINE_REACHED'
    );
    assert.equal(
      registry.reviewedGroupIds.length,
      0
    );
  }
);

test(
  'high-risk groups do not execute legacy test code unattended',
  () => {
    const legacyRoot =
      createLegacyFixture();
    const marker = path.join(
      legacyRoot,
      'unsafe-marker.txt'
    );
    fs.writeFileSync(
      path.join(
        legacyRoot,
        'tests/high-risk-side-effect-test.js'
      ),
      `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed');\n`
    );
    const report = reportFixture([
      group({
        id: 'CAP2-COMPENSATION-SIDE-EFFECT',
        name: 'partner-payment-side-effect',
        domain: 'compensation',
        kind: 'BUSINESS',
        memberDomains: ['compensation'],
        riskTags: ['FINANCIAL_TRUTH'],
        testFiles: [
          'tests/high-risk-side-effect-test.js'
        ]
      })
    ]);
    const registry =
      registryFixture(report);

    const result = runWave({
      groupingReport: report,
      registry,
      legacyRoot,
      batchSize: 1,
      maxTestsPerGroup: 5,
      testTimeoutMs: 5000
    });

    assert.equal(
      result.wave.reviews[0].tests[0].status,
      'SKIPPED_SAFETY'
    );
    assert.equal(
      fs.existsSync(marker),
      false
    );
  }
);
