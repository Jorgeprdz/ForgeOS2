#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const MARATHON_ENGINE_VERSION = '1.1.0';

export class CapabilityIdentityError extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name = 'CapabilityIdentityError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

const HIGH_RISK_TAGS = new Set([
  'FINANCIAL_TRUTH',
  'TRUTH_CRITICAL',
  'SECURITY_BOUNDARY',
  'EXTERNAL_BOUNDARY',
  'USER_ENTRYPOINT'
]);

const EXECUTABLE_TEST_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs'
]);

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}

function canonicalize(value) {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new CapabilityIdentityError(
        'NON_FINITE_VALUE'
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter(
          key => value[key] !== undefined
        )
        .map(key => [
          key,
          canonicalize(value[key])
        ])
    );
  }

  throw new CapabilityIdentityError(
    'UNSUPPORTED_VALUE'
  );
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(file, 'utf8')
  );
}

function writeAtomic(file, content) {
  fs.mkdirSync(
    path.dirname(file),
    { recursive: true }
  );
  const temporary =
    `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, file);
}

function uniqueSorted(values) {
  return [...new Set(
    values.filter(Boolean)
  )].sort();
}

function nowIso() {
  return new Date().toISOString();
}

function emptyRegistry(groupingReport) {
  return {
    schemaVersion: 1,
    kind:
      'FORGE_CAPABILITY_IDENTITY_LOCK_REGISTRY',
    source: {
      groupingReportHash:
        groupingReport.reportHash,
      legacyHead:
        groupingReport.source?.legacyHead,
      v2BaselineHead:
        groupingReport.source?.v2Head
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
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

function loadRegistry(
  file,
  groupingReport
) {
  if (!fs.existsSync(file)) {
    return emptyRegistry(groupingReport);
  }

  const registry = readJson(file);

  if (
    registry.kind ===
      'FORGE_CAPABILITY_IDENTITY_LOCK_REGISTRY_PENDING_INITIALIZATION'
  ) {
    return emptyRegistry(groupingReport);
  }

  if (
    registry.kind !==
      'FORGE_CAPABILITY_IDENTITY_LOCK_REGISTRY'
  ) {
    throw new CapabilityIdentityError(
      'REGISTRY_KIND_INVALID'
    );
  }

  if (
    registry.source?.groupingReportHash !==
      groupingReport.reportHash
  ) {
    throw new CapabilityIdentityError(
      'REGISTRY_GROUPING_HASH_MISMATCH'
    );
  }

  return registry;
}

function selectGroups(
  groupingReport,
  registry,
  batchSize
) {
  const reviewed = new Set(
    registry.reviewedGroupIds
  );

  return groupingReport.groups
    .filter(group =>
      group.memberCount > 1
      && !reviewed.has(group.id)
    )
    .sort((left, right) =>
      right.migrationPriority
        - left.migrationPriority
      || left.id.localeCompare(right.id)
    )
    .slice(0, batchSize);
}

function testCommand(file) {
  return ['node', file];
}

function runLegacyTest({
  legacyRoot,
  file,
  timeoutMs,
  deadlineEpoch
}) {
  const extension =
    path.extname(file).toLowerCase();
  const absolute = path.join(
    legacyRoot,
    file
  );
  const remainingMs = Number.isFinite(
    deadlineEpoch
  )
    ? deadlineEpoch * 1000 - Date.now()
    : Number.POSITIVE_INFINITY;

  if (remainingMs <= 4000) {
    return {
      file,
      status: 'DEFERRED_DEADLINE',
      command: null,
      exitCode: null,
      signal: null,
      durationMs: 0,
      outputSha256: null,
      outputBytes: 0,
      outputPreview:
        'Deferred because the governed wave deadline was reached.'
    };
  }

  if (!fs.existsSync(absolute)) {
    return {
      file,
      status: 'MISSING',
      command: null,
      exitCode: null,
      signal: null,
      durationMs: 0,
      outputSha256: null,
      outputBytes: 0,
      outputPreview:
        'Tracked test path is absent from the pinned disposable checkout.'
    };
  }

  if (
    !EXECUTABLE_TEST_EXTENSIONS.has(
      extension
    )
  ) {
    return {
      file,
      status: 'UNRUNNABLE',
      command: null,
      exitCode: null,
      signal: null,
      durationMs: 0,
      outputSha256: null,
      outputBytes: 0,
      outputPreview:
        `Unsupported standalone test extension: ${extension}`
    };
  }

  const effectiveTimeoutMs = Math.max(
    1000,
    Math.min(
      timeoutMs,
      Number.isFinite(remainingMs)
        ? remainingMs - 2500
        : timeoutMs
    )
  );
  const command = testCommand(file);
  const started = Date.now();
  const isolatedHome = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'forge-marathon-home-'
    )
  );
  let result;

  try {
    result = spawnSync(
      command[0],
      command.slice(1),
      {
        cwd: legacyRoot,
        encoding: 'utf8',
        timeout: effectiveTimeoutMs,
        maxBuffer: 8 * 1024 * 1024,
        env: {
          PATH: process.env.PATH ?? '',
          HOME: isolatedHome,
          XDG_CONFIG_HOME: path.join(
            isolatedHome,
            '.config'
          ),
          TMPDIR: os.tmpdir(),
          LANG: 'C.UTF-8',
          LC_ALL: 'C.UTF-8',
          TZ: 'UTC',
          NODE_ENV: 'test',
          CI: '1',
          FORGE_OFFLINE: '1',
          NO_NETWORK: '1'
        }
      }
    );
  } finally {
    fs.rmSync(
      isolatedHome,
      {
        recursive: true,
        force: true
      }
    );
  }

  const durationMs = Date.now() - started;
  const combined = [
    result.stdout ?? '',
    result.stderr ?? '',
    result.error?.message ?? ''
  ].join('\n');
  const output = Buffer.from(
    combined,
    'utf8'
  );

  let status;

  if (
    result.error?.code === 'ETIMEDOUT'
    || result.signal === 'SIGTERM'
  ) {
    status = 'TIMEOUT';
  } else if (result.status === 0) {
    status = 'PASS';
  } else {
    status = 'FAIL';
  }

  return {
    file,
    status,
    command: command.join(' '),
    exitCode:
      Number.isInteger(result.status)
        ? result.status
        : null,
    signal: result.signal ?? null,
    durationMs,
    outputSha256:
      sha256(output),
    outputBytes: output.length,
    outputPreview:
      combined
        .replace(/\s+/gu, ' ')
        .trim()
        .slice(0, 600)
  };
}

function groupEvidenceSummary(group) {
  const scores = (
    group.mergeEvidence ?? []
  ).map(item => Number(item.score ?? 0));

  return {
    memberCount:
      Number(group.memberCount ?? 0),
    mergeEdgeCount:
      group.mergeEvidence?.length ?? 0,
    minimumMergeScore:
      scores.length > 0
        ? Math.min(...scores)
        : null,
    maximumMergeScore:
      scores.length > 0
        ? Math.max(...scores)
        : null,
    reasons: uniqueSorted(
      (group.mergeEvidence ?? [])
        .flatMap(item =>
          item.reasons ?? []
        )
    ),
    riskTags:
      uniqueSorted(group.riskTags ?? []),
    reviewReasons:
      uniqueSorted(
        group.reviewReasons ?? []
      ),
    memberDomains:
      uniqueSorted(
        group.memberDomains ?? []
      )
  };
}

function riskClassification(group) {
  const text = [
    group.name,
    group.effectiveDomain,
    ...(group.codeFiles ?? []),
    ...(group.testFiles ?? []),
    ...(group.ruleArtifacts ?? []),
    ...(group.sourceSurfaceKeys ?? [])
  ].join(' ').toLowerCase();
  const reasons = [];
  const tagged = (group.riskTags ?? [])
    .filter(tag => HIGH_RISK_TAGS.has(tag));

  if (tagged.length > 0) {
    reasons.push(
      ...tagged.map(tag => `RISK_TAG:${tag}`)
    );
  }

  const patterns = [
    ['FINANCIAL_OR_PAYMENT', /compensation|commission|bonus|payout|payment|cashflow|income|economic/u],
    ['TRUTH_OR_ELIGIBILITY', /product-truth|policy-truth|evidence|eligib|qualif|readiness|source-truth/u],
    ['SECURITY_OR_IDENTITY', /auth|identity|permission|security|credential|secret/u],
    ['EXTERNAL_BOUNDARY', /adapter|provider|connector|external|webhook|supabase|api/u],
    ['USER_ENTRYPOINT', /frontend|screen|page|view|component|user-entrypoint|app\.js/u]
  ];

  for (const [reason, pattern] of patterns) {
    if (pattern.test(text)) reasons.push(reason);
  }

  if (group.kind === 'BUSINESS') {
    reasons.push('BUSINESS_CAPABILITY');
  }

  return {
    highRisk: reasons.length > 0,
    reasons: uniqueSorted(reasons)
  };
}

function identityDecision(
  group,
  tests,
  omittedTestCount
) {
  const evidence =
    groupEvidenceSummary(group);
  const statuses = tests.map(
    item => item.status
  );
  const allPass =
    tests.length > 0
    && statuses.every(
      status => status === 'PASS'
    );
  const risk = riskClassification(group);

  if (
    evidence.memberDomains.length > 1
    || group.memberCount > 12
    || evidence.reviewReasons.includes(
      'LARGE_CLUSTER_REQUIRES_REVIEW'
    )
  ) {
    return {
      disposition: 'SPLIT_REQUIRED',
      reason:
        'The proposed component is too broad or crosses source domains.',
      identityLocked: false,
      risk
    };
  }

  if (risk.highRisk) {
    return {
      disposition:
        'HUMAN_REVIEW_REQUIRED',
      reason:
        'Business or high-risk identity cannot be auto-locked during an unattended marathon.',
      identityLocked: false,
      risk
    };
  }

  if (omittedTestCount > 0) {
    return {
      disposition:
        'HUMAN_REVIEW_REQUIRED',
      reason:
        'Not all associated legacy tests were executed.',
      identityLocked: false,
      risk
    };
  }

  if (
    evidence.minimumMergeScore !== null
    && evidence.minimumMergeScore < 11
  ) {
    return {
      disposition:
        'HUMAN_REVIEW_REQUIRED',
      reason:
        'Merge evidence is below the autonomous identity-lock threshold.',
      identityLocked: false,
      risk
    };
  }

  if (
    evidence.mergeEdgeCount <
      Math.max(1, group.memberCount - 1)
  ) {
    return {
      disposition:
        'HUMAN_REVIEW_REQUIRED',
      reason:
        'The group lacks enough recorded merge edges for its size.',
      identityLocked: false,
      risk
    };
  }

  if (!allPass) {
    return {
      disposition:
        'HUMAN_REVIEW_REQUIRED',
      reason:
        'Legacy tests were absent, failed, timed out, deferred or were not independently runnable.',
      identityLocked: false,
      risk
    };
  }

  if (
    group.effectiveDomain ===
      'unclassified'
    || group.kind !== 'INFRASTRUCTURE'
  ) {
    return {
      disposition:
        'HUMAN_REVIEW_REQUIRED',
      reason:
        'Only resolved low-risk infrastructure identities may be auto-locked unattended.',
      identityLocked: false,
      risk
    };
  }

  return {
    disposition: 'LOCKED_IDENTITY',
    reason:
      'Low-risk infrastructure identity is supported by complete associated tests and strict merge evidence.',
    identityLocked: true,
    risk
  };
}

function scenarioSeeds(group, tests) {
  const source = [
    group.name,
    ...(group.testFiles ?? []),
    ...(group.ruleArtifacts ?? []),
    ...(group.sourceSurfaceKeys ?? [])
  ].join(' ').toLowerCase();

  const seeds = new Set([
    'SUCCESS_PATH',
    'INVALID_OR_MISSING_INPUT',
    'VISIBLE_RESULT_OR_BLOCK'
  ]);

  if (
    /stale|expiry|expired|fresh/u
      .test(source)
  ) {
    seeds.add('STALE_OR_EXPIRED_STATE');
  }

  if (
    /conflict|duplicate|mismatch/u
      .test(source)
  ) {
    seeds.add('CONFLICT_OR_DUPLICATE_STATE');
  }

  if (
    /payment|payout|commission|bonus|cashflow/u
      .test(source)
  ) {
    seeds.add('PAYMENT_EVIDENCE_BOUNDARY');
    seeds.add('PARTIAL_OR_PROVISIONAL_STATE');
  }

  if (
    /eligib|qualif|readiness|gate/u
      .test(source)
  ) {
    seeds.add('ELIGIBILITY_OR_GATE_FAILURE');
  }

  if (
    /adapter|provider|external|api/u
      .test(source)
  ) {
    seeds.add('EXTERNAL_CONTRACT_FAILURE');
  }

  if (
    tests.some(item =>
      item.status !== 'PASS'
    )
  ) {
    seeds.add(
      'LEGACY_BASELINE_RECOVERY'
    );
  }

  return [...seeds].sort();
}

function skippedSafetyTest(file, risk) {
  return {
    file,
    status: 'SKIPPED_SAFETY',
    command: null,
    exitCode: null,
    signal: null,
    durationMs: 0,
    outputSha256: null,
    outputBytes: 0,
    outputPreview:
      `Test execution skipped for unattended safety: ${risk.reasons.join(', ')}`
  };
}

function reviewGroup({
  group,
  legacyRoot,
  maxTestsPerGroup,
  testTimeoutMs,
  deadlineEpoch
}) {
  const allTests =
    uniqueSorted(group.testFiles ?? []);
  const selectedTests = allTests
    .slice(0, maxTestsPerGroup);
  const omittedTestCount = Math.max(
    0,
    allTests.length - selectedTests.length
  );
  const risk = riskClassification(group);
  const tests = risk.highRisk
    ? selectedTests.map(file =>
      skippedSafetyTest(file, risk)
    )
    : selectedTests.map(file =>
      runLegacyTest({
        legacyRoot,
        file,
        timeoutMs: testTimeoutMs,
        deadlineEpoch
      })
    );
  const decision = identityDecision(
    group,
    tests,
    omittedTestCount
  );

  return {
    groupId: group.id,
    proposedName: group.name,
    domain: group.effectiveDomain,
    kind: group.kind,
    migrationPriority:
      group.migrationPriority,
    memberCount: group.memberCount,
    memberCapabilityIds:
      group.memberCapabilityIds,
    codeFiles: group.codeFiles,
    testFiles: group.testFiles,
    selectedTests,
    omittedTestCount,
    ruleArtifacts:
      group.ruleArtifacts,
    riskTags: group.riskTags,
    riskClassification:
      decision.risk,
    evidence:
      groupEvidenceSummary(group),
    tests,
    scenarioSeeds:
      scenarioSeeds(group, tests),
    disposition:
      decision.disposition,
    dispositionReason:
      decision.reason,
    identityLocked:
      decision.identityLocked,
    parityVerified: false
  };
}

function addReviewToRegistry(
  registry,
  review
) {
  registry.reviewedGroupIds.push(
    review.groupId
  );

  const identity = {
    groupId: review.groupId,
    capabilityId:
      review.identityLocked
        ? review.groupId.replace(
          /^CAP2-/u,
          'CAP-LOCKED-'
        )
        : null,
    name: review.proposedName,
    domain: review.domain,
    kind: review.kind,
    memberCount: review.memberCount,
    riskTags: review.riskTags,
    riskClassification:
      review.riskClassification,
    omittedTestCount:
      review.omittedTestCount,
    evidence: review.evidence,
    disposition:
      review.disposition,
    reason:
      review.dispositionReason,
    scenarioSeeds:
      review.scenarioSeeds,
    legacyTestSummary: {
      total: review.tests.length,
      pass:
        review.tests.filter(item =>
          item.status === 'PASS'
        ).length,
      fail:
        review.tests.filter(item =>
          item.status === 'FAIL'
        ).length,
      timeout:
        review.tests.filter(item =>
          item.status === 'TIMEOUT'
        ).length,
      missing:
        review.tests.filter(item =>
          item.status === 'MISSING'
        ).length,
      unrunnable:
        review.tests.filter(item =>
          item.status === 'UNRUNNABLE'
        ).length
    },
    parityVerified: false
  };

  if (
    review.disposition ===
      'LOCKED_IDENTITY'
  ) {
    registry.lockedIdentities.push(
      identity
    );
  } else if (
    review.disposition ===
      'SPLIT_REQUIRED'
  ) {
    registry.splitRequired.push(
      identity
    );
  } else if (
    review.disposition ===
      'MERGE_REJECTED'
  ) {
    registry.mergeRejected.push(
      identity
    );
  } else {
    registry.humanReviewRequired.push(
      identity
    );
  }

  for (const test of review.tests) {
    const field = {
      PASS: 'testPass',
      FAIL: 'testFail',
      TIMEOUT: 'testTimeout',
      MISSING: 'testMissing',
      UNRUNNABLE: 'testUnrunnable',
      DEFERRED_DEADLINE: 'testDeferred',
      SKIPPED_SAFETY: 'testSkippedSafety'
    }[test.status];

    if (field) {
      registry.totals[field] += 1;
    }
  }
}

function recalculateTotals(registry) {
  registry.reviewedGroupIds =
    uniqueSorted(
      registry.reviewedGroupIds
    );
  registry.totals.reviewedGroups =
    registry.reviewedGroupIds.length;
  registry.totals.lockedIdentities =
    registry.lockedIdentities.length;
  registry.totals.humanReviewRequired =
    registry.humanReviewRequired.length;
  registry.totals.splitRequired =
    registry.splitRequired.length;
  registry.totals.mergeRejected =
    registry.mergeRejected.length;
  registry.updatedAt = nowIso();
}

function waveId(registry) {
  return `WAVE-${String(
    registry.waves.length + 1
  ).padStart(3, '0')}`;
}

function waveMarkdown(wave) {
  const lines = [];

  lines.push(
    `# Capability Identity ${wave.waveId}`
  );
  lines.push('');
  lines.push(
    `- Legacy HEAD: \`${wave.source.legacyHead}\``
  );
  lines.push(
    `- Grouping hash: \`${wave.source.groupingReportHash}\``
  );
  lines.push(
    `- Reviewed groups: ${wave.counts.reviewedGroups}`
  );
  lines.push(
    `- Locked identities: ${wave.counts.lockedIdentities}`
  );
  lines.push(
    `- Human review: ${wave.counts.humanReviewRequired}`
  );
  lines.push(
    `- Split required: ${wave.counts.splitRequired}`
  );
  lines.push(
    '- Verified parity: 0'
  );
  lines.push('');
  lines.push('## Reviews');
  lines.push('');
  lines.push(
    '| Group | Domain | Members | Tests pass/total | Risk | Disposition |'
  );
  lines.push(
    '|---|---|---:|---:|---|---|'
  );

  for (const review of wave.reviews) {
    const pass = review.tests.filter(
      item => item.status === 'PASS'
    ).length;

    lines.push(
      `| ${review.proposedName} | ${review.domain} | ${review.memberCount} | ${pass}/${review.tests.length} | ${review.riskTags.join(', ') || '—'} | ${review.disposition} |`
    );
  }

  lines.push('');
  lines.push(
    'Identity lock does not grant functional parity.'
  );

  return `${lines.join('\n')}\n`;
}

function statusMarkdown(
  groupingReport,
  registry
) {
  const lines = [];

  lines.push(
    '# Capability Identity Marathon Status'
  );
  lines.push('');
  lines.push(
    `- Grouping hash: \`${groupingReport.reportHash}\``
  );
  lines.push(
    `- Candidate groups: ${groupingReport.groups.length}`
  );
  lines.push(
    `- Multi-member candidates: ${groupingReport.groups.filter(item => item.memberCount > 1).length}`
  );
  lines.push(
    `- Reviewed groups: ${registry.totals.reviewedGroups}`
  );
  lines.push(
    `- Locked low-risk identities: ${registry.totals.lockedIdentities}`
  );
  lines.push(
    `- Human review required: ${registry.totals.humanReviewRequired}`
  );
  lines.push(
    `- Split required: ${registry.totals.splitRequired}`
  );
  lines.push(
    `- Legacy tests passed: ${registry.totals.testPass}`
  );
  lines.push(
    `- Legacy tests failed: ${registry.totals.testFail}`
  );
  lines.push(
    `- Legacy tests timed out: ${registry.totals.testTimeout}`
  );
  lines.push(
    `- Legacy tests missing/unrunnable: ${registry.totals.testMissing + registry.totals.testUnrunnable}`
  );
  lines.push(
    `- Legacy tests deferred by deadline: ${registry.totals.testDeferred}`
  );
  lines.push(
    `- Legacy tests skipped for unattended safety: ${registry.totals.testSkippedSafety}`
  );
  lines.push(
    '- Verified parity capabilities: 0'
  );
  lines.push('');
  lines.push('## Safety');
  lines.push('');
  lines.push(
    '- High-risk groups are never auto-locked.'
  );
  lines.push(
    '- No business rule is rewritten.'
  );
  lines.push(
    '- No legacy capability is retired.'
  );
  lines.push(
    '- Identity lock is only preparation for parity scenarios.'
  );

  return `${lines.join('\n')}\n`;
}

export function runWave({
  groupingReport,
  registry,
  legacyRoot,
  batchSize,
  maxTestsPerGroup,
  testTimeoutMs,
  deadlineEpoch = null
}) {
  if (
    Number.isFinite(deadlineEpoch)
    && Math.floor(Date.now() / 1000)
      >= deadlineEpoch - 5
  ) {
    return {
      status: 'DEADLINE_REACHED',
      registry,
      wave: null
    };
  }

  const groups = selectGroups(
    groupingReport,
    registry,
    batchSize
  );

  if (groups.length === 0) {
    return {
      status: 'COMPLETE',
      registry,
      wave: null
    };
  }

  const id = waveId(registry);
  const reviews = [];

  for (const group of groups) {
    if (
      Number.isFinite(deadlineEpoch)
      && Math.floor(Date.now() / 1000)
        >= deadlineEpoch - 5
    ) {
      break;
    }

    reviews.push(
      reviewGroup({
        group,
        legacyRoot,
        maxTestsPerGroup,
        testTimeoutMs,
        deadlineEpoch
      })
    );
  }

  if (reviews.length === 0) {
    return {
      status: 'DEADLINE_REACHED',
      registry,
      wave: null
    };
  }

  for (const review of reviews) {
    addReviewToRegistry(
      registry,
      review
    );
  }

  recalculateTotals(registry);

  const wave = {
    schemaVersion: 1,
    kind:
      'FORGE_CAPABILITY_IDENTITY_REVIEW_WAVE',
    waveId: id,
    generatedAt: nowIso(),
    source: {
      legacyHead:
        groupingReport.source?.legacyHead,
      groupingReportHash:
        groupingReport.reportHash
    },
    safety: {
      identityLockIsNotParity: true,
      highRiskAutoLock: false,
      businessAutoLock: false,
      incompleteTestAutoLock: false,
      rewritesRules: false,
      retiresLegacy: false
    },
    counts: {
      reviewedGroups: reviews.length,
      lockedIdentities:
        reviews.filter(item =>
          item.disposition ===
            'LOCKED_IDENTITY'
        ).length,
      humanReviewRequired:
        reviews.filter(item =>
          item.disposition ===
            'HUMAN_REVIEW_REQUIRED'
        ).length,
      splitRequired:
        reviews.filter(item =>
          item.disposition ===
            'SPLIT_REQUIRED'
        ).length,
      mergeRejected:
        reviews.filter(item =>
          item.disposition ===
            'MERGE_REJECTED'
        ).length
    },
    reviews,
    parity: {
      verifiedCapabilities: 0
    }
  };

  wave.reportHash = sha256(
    canonicalJson({
      ...wave,
      generatedAt: null,
      reportHash: undefined
    })
  );

  registry.waves.push({
    waveId: id,
    reportHash: wave.reportHash,
    reviewedGroups:
      wave.counts.reviewedGroups,
    lockedIdentities:
      wave.counts.lockedIdentities,
    humanReviewRequired:
      wave.counts.humanReviewRequired,
    splitRequired:
      wave.counts.splitRequired,
    mergeRejected:
      wave.counts.mergeRejected
  });

  return {
    status: 'WAVE_COMPLETE',
    registry,
    wave
  };
}

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();

  for (
    let index = 0;
    index < argv.length;
    index += 1
  ) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      throw new CapabilityIdentityError(
        'CLI_OPTION_VALUE_REQUIRED',
        [token]
      );
    }

    if (flags.has(token.slice(2))) {
      throw new CapabilityIdentityError(
        'DUPLICATE_CLI_OPTION',
        [token]
      );
    }

    flags.set(token.slice(2), value);
    index += 1;
  }

  return { positional, flags };
}

function required(flags, name) {
  const value = flags.get(name);

  if (!value) {
    throw new CapabilityIdentityError(
      'CLI_OPTION_REQUIRED',
      [`--${name}`]
    );
  }

  return path.resolve(value);
}

export function runCli(
  argv = process.argv.slice(2),
  io = {
    stdout: process.stdout,
    stderr: process.stderr
  }
) {
  try {
    const { positional, flags } =
      parseArgs(argv);
    const command =
      positional[0] ?? 'run-wave';

    if (command !== 'run-wave') {
      throw new CapabilityIdentityError(
        'UNKNOWN_COMMAND',
        [command]
      );
    }

    const groupingFile =
      required(flags, 'grouping');
    const registryFile =
      required(flags, 'registry');
    const legacyRoot =
      required(flags, 'legacy-root');
    const wavesDirectory =
      required(flags, 'waves-dir');
    const docsWavesDirectory =
      required(flags, 'docs-waves-dir');
    const statusMarkdownFile =
      required(flags, 'status-markdown');
    const batchSize = Number(
      flags.get('batch-size') ?? 8
    );
    const maxTestsPerGroup = Number(
      flags.get('max-tests-per-group')
        ?? 5
    );
    const testTimeoutMs = Number(
      flags.get('test-timeout-ms')
        ?? 45000
    );
    const deadlineEpoch = flags.has(
      'deadline-epoch'
    )
      ? Number(flags.get('deadline-epoch'))
      : null;

    const groupingReport =
      readJson(groupingFile);
    const registry = loadRegistry(
      registryFile,
      groupingReport
    );

    const result = runWave({
      groupingReport,
      registry,
      legacyRoot,
      batchSize,
      maxTestsPerGroup,
      testTimeoutMs,
      deadlineEpoch
    });

    if (
      result.status ===
        'DEADLINE_REACHED'
    ) {
      io.stdout.write(
        'IDENTITY_WAVE_STATUS=DEADLINE_REACHED\n'
      );
      io.stdout.write(
        `REVIEWED_GROUPS=${registry.totals.reviewedGroups}\n`
      );
      return 0;
    }

    if (result.status === 'COMPLETE') {
      io.stdout.write(
        'IDENTITY_WAVE_STATUS=COMPLETE\n'
      );
      io.stdout.write(
        `REVIEWED_GROUPS=${registry.totals.reviewedGroups}\n`
      );
      return 0;
    }

    const waveJsonFile = path.join(
      wavesDirectory,
      `${result.wave.waveId}.json`
    );
    const waveMarkdownFile = path.join(
      docsWavesDirectory,
      `${result.wave.waveId}.md`
    );

    writeAtomic(
      registryFile,
      `${JSON.stringify(
        result.registry,
        null,
        2
      )}\n`
    );
    writeAtomic(
      waveJsonFile,
      `${JSON.stringify(
        result.wave,
        null,
        2
      )}\n`
    );
    writeAtomic(
      waveMarkdownFile,
      waveMarkdown(result.wave)
    );
    writeAtomic(
      statusMarkdownFile,
      statusMarkdown(
        groupingReport,
        result.registry
      )
    );

    io.stdout.write(
      'IDENTITY_WAVE_STATUS=PASS\n'
    );
    io.stdout.write(
      `WAVE_ID=${result.wave.waveId}\n`
    );
    io.stdout.write(
      `REVIEWED_GROUPS=${result.wave.counts.reviewedGroups}\n`
    );
    io.stdout.write(
      `LOCKED_IDENTITIES=${result.wave.counts.lockedIdentities}\n`
    );
    io.stdout.write(
      `HUMAN_REVIEW_REQUIRED=${result.wave.counts.humanReviewRequired}\n`
    );
    io.stdout.write(
      `SPLIT_REQUIRED=${result.wave.counts.splitRequired}\n`
    );
    io.stdout.write(
      `MERGE_REJECTED=${result.wave.counts.mergeRejected}\n`
    );
    io.stdout.write(
      `WAVE_HASH=${result.wave.reportHash}\n`
    );
    io.stdout.write(
      `WAVE_JSON=${waveJsonFile}\n`
    );
    io.stdout.write(
      `WAVE_MD=${waveMarkdownFile}\n`
    );
    io.stdout.write(
      `TOTAL_REVIEWED=${result.registry.totals.reviewedGroups}\n`
    );
    io.stdout.write(
      `TOTAL_LOCKED=${result.registry.totals.lockedIdentities}\n`
    );
    io.stdout.write(
      'PARITY_VERIFIED_CAPABILITIES=0\n'
    );

    return 0;
  } catch (error) {
    const code =
      error instanceof CapabilityIdentityError
        ? error.code
        : 'UNEXPECTED_ERROR';

    io.stderr.write(
      'IDENTITY_WAVE_STATUS=FAIL\n'
    );
    io.stderr.write(
      `IDENTITY_WAVE_ERROR_CODE=${code}\n`
    );
    io.stderr.write(
      `IDENTITY_WAVE_ERROR=${error.message}\n`
    );

    return 1;
  }
}

const isMain =
  process.argv[1]
  && path.resolve(process.argv[1])
    === path.resolve(
      fileURLToPath(import.meta.url)
    );

if (isMain) {
  process.exitCode = runCli();
}
