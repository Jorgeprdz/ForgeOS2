#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export class CapabilityMapError extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name = 'CapabilityMapError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

const BUSINESS_DOMAINS = new Set([
  'compensation',
  'policyOperations',
  'productIntelligence',
  'quoting',
  'advisorDevelopment',
  'recruitment',
  'managerTeam',
  'crmClient',
  'analyticsPlanning'
]);

const INFRASTRUCTURE_DOMAINS = new Set([
  'integrations',
  'persistence',
  'identitySecurity',
  'userExperience',
  'governance',
  'tooling'
]);

const TECHNICAL_SUFFIXES = Object.freeze([
  'calculator',
  'calculations',
  'calculation',
  'orchestrator',
  'orchestration',
  'validator',
  'validation',
  'loader',
  'resolver',
  'evaluator',
  'evaluation',
  'engine',
  'service',
  'adapter',
  'connector',
  'provider',
  'repository',
  'store',
  'controller',
  'workflow',
  'runtime',
  'handler',
  'gateway',
  'mapper',
  'normalizer',
  'parser',
  'contract',
  'schema',
  'fixture',
  'fixtures',
  'test',
  'tests',
  'spec',
  'specs',
  'index',
  'main',
  'cli'
]);

const TECHNICAL_PREFIXES = Object.freeze([
  'legacy',
  'forge',
  'module',
  'mod'
]);

const GENERIC_TOKENS = new Set([
  'partner',
  'advisor',
  'manager',
  'team',
  'product',
  'policy',
  'quote',
  'system',
  'core',
  'common',
  'shared',
  'base',
  'generic'
]);

const HIGH_RISK_TAGS = new Set([
  'FINANCIAL_TRUTH',
  'TRUTH_CRITICAL',
  'SECURITY_BOUNDARY',
  'EXTERNAL_BOUNDARY',
  'USER_ENTRYPOINT'
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
      throw new CapabilityMapError(
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

  throw new CapabilityMapError(
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

function normalizeTokenValue(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function tokens(value) {
  return normalizeTokenValue(value)
    .split('-')
    .filter(Boolean);
}

function stripTechnicalTokens(value) {
  const output = tokens(value);

  while (
    output.length > 1
    && TECHNICAL_PREFIXES.includes(output[0])
  ) {
    output.shift();
  }

  while (
    output.length > 1
    && TECHNICAL_SUFFIXES.includes(
      output[output.length - 1]
    )
  ) {
    output.pop();
  }

  return output;
}

function commonPrefix(tokenLists) {
  if (tokenLists.length === 0) return [];

  const shortest = Math.min(
    ...tokenLists.map(list => list.length)
  );
  const prefix = [];

  for (let index = 0; index < shortest; index += 1) {
    const value = tokenLists[0][index];
    if (
      tokenLists.every(
        list => list[index] === value
      )
    ) {
      prefix.push(value);
      continue;
    }
    break;
  }

  return prefix;
}

function commonSuffix(tokenLists) {
  if (tokenLists.length === 0) return [];

  const reversed = tokenLists.map(
    list => [...list].reverse()
  );
  return commonPrefix(reversed).reverse();
}

function surfaceBaseKey(surface) {
  const candidates = [
    surface.key,
    ...(surface.codeFiles ?? []),
    ...(surface.testFiles ?? []),
    ...(surface.ruleArtifacts ?? [])
  ].map(value => {
    const basename = path.basename(
      value,
      path.extname(value)
    );
    return stripTechnicalTokens(basename);
  }).filter(list => list.length > 0);

  const declared = stripTechnicalTokens(
    surface.key
  );

  if (declared.length >= 2) {
    return declared.join('-');
  }

  const prefix = commonPrefix(candidates);
  if (prefix.length >= 2) {
    return prefix.join('-');
  }

  const suffix = commonSuffix(candidates);
  if (suffix.length >= 2) {
    return suffix.join('-');
  }

  return (
    declared.join('-')
    || candidates[0]?.join('-')
    || 'unknown-capability'
  );
}

function canonicalCapabilityId(domain, key) {
  const domainPart = normalizeTokenValue(domain)
    .toUpperCase()
    .replaceAll('-', '_');
  const keyPart = normalizeTokenValue(key)
    .toUpperCase()
    .replaceAll('-', '_');

  return `CAP-${domainPart}-${keyPart}`;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))]
    .sort();
}

function classifyKind(domain) {
  if (BUSINESS_DOMAINS.has(domain)) {
    return 'BUSINESS';
  }

  if (INFRASTRUCTURE_DOMAINS.has(domain)) {
    return 'INFRASTRUCTURE';
  }

  return 'UNCLASSIFIED';
}

function evidenceStrength(capability) {
  let score = 0;

  if (capability.codeFiles.length > 0) score += 1;
  if (capability.testFiles.length > 0) score += 2;
  if (capability.ruleArtifacts.length > 0) score += 3;
  if (capability.entrypointCandidates.length > 0) {
    score += 2;
  }
  if (capability.orchestratorCount > 0) score += 2;
  if (capability.documents.length > 0) score += 1;

  return score;
}

function ambiguityReasons(capability) {
  const reasons = [];
  const keyTokens = tokens(capability.key);

  if (capability.kind === 'UNCLASSIFIED') {
    reasons.push('DOMAIN_UNCLASSIFIED');
  }

  if (keyTokens.length <= 1) {
    reasons.push('CAPABILITY_KEY_TOO_GENERIC');
  }

  if (
    keyTokens.length > 0
    && keyTokens.every(token =>
      GENERIC_TOKENS.has(token)
    )
  ) {
    reasons.push('GENERIC_ONLY_KEY');
  }

  if (
    capability.codeFiles.length === 0
    && capability.ruleArtifacts.length === 0
  ) {
    reasons.push('NO_IMPLEMENTATION_OR_RULE_ARTIFACT');
  }

  if (
    capability.codeFiles.length > 0
    && capability.testFiles.length === 0
  ) {
    reasons.push('NO_LEGACY_TESTS');
  }

  if (
    capability.riskTags.some(tag =>
      HIGH_RISK_TAGS.has(tag)
    )
    && capability.ruleArtifacts.length === 0
    && capability.documents.length === 0
  ) {
    reasons.push('HIGH_RISK_WITHOUT_RULE_OR_DOCUMENT');
  }

  if (capability.mergedSurfaceCount >= 12) {
    reasons.push('OVER_BROAD_MERGE_CANDIDATE');
  }

  return reasons;
}

function migrationPriority(capability) {
  let score = capability.priorityScore;

  score += capability.testFiles.length * 4;
  score += capability.ruleArtifacts.length * 6;
  score += capability.entrypointCandidates.length * 4;
  score += capability.orchestratorCount * 4;
  score += capability.riskTags.length * 3;

  if (capability.kind === 'BUSINESS') score += 8;
  if (capability.kind === 'UNCLASSIFIED') score -= 5;

  return score;
}

function normalizeSurface(surface) {
  if (!isPlainObject(surface)) {
    throw new CapabilityMapError(
      'SURFACE_INVALID'
    );
  }

  const domain = normalizeTokenValue(
    surface.domain || 'unclassified'
  ) || 'unclassified';

  return {
    key: normalizeTokenValue(
      surface.key || 'unknown-surface'
    ) || 'unknown-surface',
    domain,
    codeFiles: uniqueSorted(
      surface.codeFiles ?? []
    ),
    testFiles: uniqueSorted(
      surface.testFiles ?? []
    ),
    ruleArtifacts: uniqueSorted(
      surface.ruleArtifacts ?? []
    ),
    documents: uniqueSorted(
      surface.documents ?? []
    ),
    entrypointCandidates:
      Array.isArray(surface.entrypointCandidates)
        ? surface.entrypointCandidates
          .filter(isPlainObject)
          .map(item => ({
            path: String(item.path),
            score: Number(item.score ?? 0)
          }))
        : [],
    riskTags: uniqueSorted(
      surface.riskTags ?? []
    ),
    orchestratorCount:
      Number(surface.orchestratorCount ?? 0),
    priorityScore:
      Number(surface.priorityScore ?? 0)
  };
}

function groupSurfaces(surfaces) {
  const groups = new Map();

  for (const rawSurface of surfaces) {
    const surface = normalizeSurface(rawSurface);
    const key = surfaceBaseKey(surface);
    const compound = `${surface.domain}:${key}`;

    if (!groups.has(compound)) {
      groups.set(compound, {
        key,
        domain: surface.domain,
        sourceSurfaceKeys: [],
        codeFiles: [],
        testFiles: [],
        ruleArtifacts: [],
        documents: [],
        entrypointCandidates: [],
        riskTags: [],
        orchestratorCount: 0,
        priorityScore: 0
      });
    }

    const group = groups.get(compound);
    group.sourceSurfaceKeys.push(surface.key);
    group.codeFiles.push(...surface.codeFiles);
    group.testFiles.push(...surface.testFiles);
    group.ruleArtifacts.push(
      ...surface.ruleArtifacts
    );
    group.documents.push(...surface.documents);
    group.entrypointCandidates.push(
      ...surface.entrypointCandidates
    );
    group.riskTags.push(...surface.riskTags);
    group.orchestratorCount +=
      surface.orchestratorCount;
    group.priorityScore += surface.priorityScore;
  }

  return [...groups.values()].map(group => {
    const capability = {
      id: canonicalCapabilityId(
        group.domain,
        group.key
      ),
      key: group.key,
      domain: group.domain,
      kind: classifyKind(group.domain),
      sourceSurfaceKeys: uniqueSorted(
        group.sourceSurfaceKeys
      ),
      mergedSurfaceCount:
        uniqueSorted(group.sourceSurfaceKeys)
          .length,
      codeFiles: uniqueSorted(group.codeFiles),
      testFiles: uniqueSorted(group.testFiles),
      ruleArtifacts: uniqueSorted(
        group.ruleArtifacts
      ),
      documents: uniqueSorted(group.documents),
      entrypointCandidates:
        [...new Map(
          group.entrypointCandidates
            .map(item => [
              item.path,
              {
                path: item.path,
                score: Number(item.score ?? 0)
              }
            ])
        ).values()]
          .sort((left, right) =>
            right.score - left.score
            || left.path.localeCompare(right.path)
          ),
      riskTags: uniqueSorted(group.riskTags),
      orchestratorCount:
        group.orchestratorCount,
      priorityScore: group.priorityScore,
      parityStatus:
        'CANDIDATE_REQUIRES_CAPABILITY_REVIEW',
      v2Target: null,
      verifiedParityScenarios: 0,
      verifiedParity: false
    };

    capability.evidenceStrength =
      evidenceStrength(capability);
    capability.ambiguityReasons =
      ambiguityReasons(capability);
    capability.requiresHumanReview =
      capability.ambiguityReasons.length > 0;
    capability.migrationPriority =
      migrationPriority(capability);

    return capability;
  });
}

function detectPotentialAliases(capabilities) {
  const tokenIndex = new Map();

  for (const capability of capabilities) {
    const normalized = tokens(capability.key)
      .filter(token => !GENERIC_TOKENS.has(token))
      .sort()
      .join(':');

    if (!normalized) continue;

    if (!tokenIndex.has(normalized)) {
      tokenIndex.set(normalized, []);
    }

    tokenIndex.get(normalized).push(
      capability.id
    );
  }

  return [...tokenIndex.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([signature, ids]) => ({
      signature,
      capabilityIds: ids.sort(),
      status: 'POTENTIAL_ALIAS_REQUIRES_REVIEW'
    }))
    .sort((left, right) =>
      left.signature.localeCompare(
        right.signature
      )
    );
}

function buildDomainSummary(capabilities) {
  const map = new Map();

  for (const capability of capabilities) {
    if (!map.has(capability.domain)) {
      map.set(capability.domain, {
        domain: capability.domain,
        kind: capability.kind,
        capabilities: 0,
        businessCapabilities: 0,
        infrastructureCapabilities: 0,
        unclassifiedCapabilities: 0,
        highRiskCapabilities: 0,
        humanReviewRequired: 0,
        codeFiles: 0,
        testFiles: 0,
        ruleArtifacts: 0,
        migrationPriority: 0
      });
    }

    const summary = map.get(capability.domain);
    summary.capabilities += 1;
    summary.codeFiles += capability.codeFiles.length;
    summary.testFiles += capability.testFiles.length;
    summary.ruleArtifacts +=
      capability.ruleArtifacts.length;
    summary.migrationPriority +=
      capability.migrationPriority;

    if (capability.kind === 'BUSINESS') {
      summary.businessCapabilities += 1;
    } else if (
      capability.kind === 'INFRASTRUCTURE'
    ) {
      summary.infrastructureCapabilities += 1;
    } else {
      summary.unclassifiedCapabilities += 1;
    }

    if (capability.riskTags.length > 0) {
      summary.highRiskCapabilities += 1;
    }

    if (capability.requiresHumanReview) {
      summary.humanReviewRequired += 1;
    }
  }

  return [...map.values()].sort(
    (left, right) =>
      right.migrationPriority
      - left.migrationPriority
      || left.domain.localeCompare(right.domain)
  );
}

function assertDiscoveryReport(report) {
  if (
    !isPlainObject(report)
    || report.kind !==
      'FORGE_LEGACY_FUNCTIONAL_PARITY_BASELINE'
      && report.kind !==
        'FORGE_LEGACY_FUNCTIONAL_PARITY_DISCOVERY'
  ) {
    throw new CapabilityMapError(
      'DISCOVERY_REPORT_KIND_INVALID'
    );
  }

  if (
    !Array.isArray(
      report.inventory?.surfaces
    )
  ) {
    throw new CapabilityMapError(
      'DISCOVERY_SURFACES_REQUIRED'
    );
  }

  if (
    report.parity?.verifiedCapabilities !== 0
  ) {
    throw new CapabilityMapError(
      'DISCOVERY_ALREADY_CREDITS_PARITY'
    );
  }

  return true;
}

export function buildCapabilityMap({
  discoveryReport,
  generatedAt =
    new Date().toISOString()
}) {
  assertDiscoveryReport(discoveryReport);

  const rawSurfaces =
    discoveryReport.inventory.surfaces;
  const capabilities = groupSurfaces(
    rawSurfaces
  ).sort((left, right) =>
    right.migrationPriority
      - left.migrationPriority
    || left.domain.localeCompare(right.domain)
    || left.key.localeCompare(right.key)
  );

  const aliases =
    detectPotentialAliases(capabilities);
  const domainSummary =
    buildDomainSummary(capabilities);

  const businessCapabilities =
    capabilities.filter(
      item => item.kind === 'BUSINESS'
    );
  const infrastructureCapabilities =
    capabilities.filter(
      item => item.kind === 'INFRASTRUCTURE'
    );
  const unclassifiedCapabilities =
    capabilities.filter(
      item => item.kind === 'UNCLASSIFIED'
    );
  const humanReviewQueue =
    capabilities.filter(
      item => item.requiresHumanReview
    );

  const report = {
    schemaVersion: 1,
    kind:
      'FORGE_LEGACY_CAPABILITY_MAP_CANDIDATE',
    generatedAt,
    source: {
      discoveryReportHash:
        discoveryReport.reportHash ?? null,
      legacyHead:
        discoveryReport.legacy?.head ?? null,
      v2Head:
        discoveryReport.v2?.head ?? null,
      rawSurfaceCount: rawSurfaces.length
    },
    safety: {
      modifiesLegacy: false,
      modifiesEconomicRules: false,
      automaticParityClaims: false,
      automaticRetirementClaims: false,
      humanReviewRequiredForAmbiguity: true
    },
    counts: {
      rawSurfaces: rawSurfaces.length,
      normalizedCapabilities:
        capabilities.length,
      businessCapabilities:
        businessCapabilities.length,
      infrastructureCapabilities:
        infrastructureCapabilities.length,
      unclassifiedCapabilities:
        unclassifiedCapabilities.length,
      mergedSurfaceReduction:
        rawSurfaces.length
        - capabilities.length,
      potentialAliasGroups: aliases.length,
      humanReviewRequired:
        humanReviewQueue.length,
      parityVerifiedCapabilities: 0
    },
    domains: domainSummary,
    capabilities,
    potentialAliases: aliases,
    humanReviewQueue:
      humanReviewQueue.map(item => ({
        capabilityId: item.id,
        domain: item.domain,
        key: item.key,
        reasons: item.ambiguityReasons,
        sourceSurfaceKeys:
          item.sourceSurfaceKeys,
        migrationPriority:
          item.migrationPriority
      })),
    parity: {
      status:
        'CAPABILITY_MAP_CANDIDATE_NOT_LOCKED',
      verifiedCapabilities: 0,
      verifiedPercentage: null,
      silentEquivalenceClaims: 0
    },
    recommendation: {
      action:
        'LOCK_CAPABILITY_MAP_AND_SELECT_PARITY_SCENARIOS',
      nextQueue: capabilities
        .filter(item =>
          item.kind === 'BUSINESS'
          && !item.requiresHumanReview
        )
        .slice(0, 25)
        .map(item => ({
          capabilityId: item.id,
          domain: item.domain,
          key: item.key,
          migrationPriority:
            item.migrationPriority,
          legacyTests:
            item.testFiles.length,
          ruleArtifacts:
            item.ruleArtifacts.length,
          riskTags: item.riskTags
        }))
    }
  };

  report.reportHash = sha256(
    canonicalJson({
      ...report,
      generatedAt: null,
      reportHash: undefined
    })
  );

  return report;
}

export function renderCapabilityMapMarkdown(
  report
) {
  const lines = [];

  lines.push(
    '# Forge OS V2 — Legacy Capability Map Candidate'
  );
  lines.push('');
  lines.push(
    `- Source legacy HEAD: \`${report.source.legacyHead}\``
  );
  lines.push(
    `- Source discovery hash: \`${report.source.discoveryReportHash}\``
  );
  lines.push(
    `- Capability-map hash: \`${report.reportHash}\``
  );
  lines.push('');
  lines.push('## Honest status');
  lines.push('');
  lines.push(
    `- Status: **${report.parity.status}**`
  );
  lines.push(
    '- This document does not grant legacy parity.'
  );
  lines.push(
    '- Every ambiguous merge remains in the human-review queue.'
  );
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push(
    `- Raw technical surfaces: ${report.counts.rawSurfaces}`
  );
  lines.push(
    `- Normalized capability candidates: ${report.counts.normalizedCapabilities}`
  );
  lines.push(
    `- Business candidates: ${report.counts.businessCapabilities}`
  );
  lines.push(
    `- Infrastructure candidates: ${report.counts.infrastructureCapabilities}`
  );
  lines.push(
    `- Unclassified candidates: ${report.counts.unclassifiedCapabilities}`
  );
  lines.push(
    `- Surfaces merged: ${report.counts.mergedSurfaceReduction}`
  );
  lines.push(
    `- Potential alias groups: ${report.counts.potentialAliasGroups}`
  );
  lines.push(
    `- Human review required: ${report.counts.humanReviewRequired}`
  );
  lines.push(
    '- Parity verified: 0'
  );
  lines.push('');
  lines.push('## Domains');
  lines.push('');
  lines.push(
    '| Domain | Kind | Capabilities | High risk | Review | Code | Tests | Rules | Priority |'
  );
  lines.push(
    '|---|---|---:|---:|---:|---:|---:|---:|---:|'
  );

  for (const domain of report.domains) {
    lines.push(
      `| ${domain.domain} | ${domain.kind} | ${domain.capabilities} | ${domain.highRiskCapabilities} | ${domain.humanReviewRequired} | ${domain.codeFiles} | ${domain.testFiles} | ${domain.ruleArtifacts} | ${domain.migrationPriority} |`
    );
  }

  lines.push('');
  lines.push(
    '## Highest-priority business candidates'
  );
  lines.push('');
  lines.push(
    '| Capability | Domain | Tests | Rules | Risks | Review | Priority |'
  );
  lines.push(
    '|---|---|---:|---:|---|---|---:|'
  );

  for (
    const capability of report.capabilities
      .filter(item =>
        item.kind === 'BUSINESS'
      )
      .slice(0, 50)
  ) {
    lines.push(
      `| ${capability.key} | ${capability.domain} | ${capability.testFiles.length} | ${capability.ruleArtifacts.length} | ${capability.riskTags.join(', ') || '—'} | ${capability.requiresHumanReview ? 'YES' : 'NO'} | ${capability.migrationPriority} |`
    );
  }

  lines.push('');
  lines.push('## Next action');
  lines.push('');
  lines.push(
    '**LOCK_CAPABILITY_MAP_AND_SELECT_PARITY_SCENARIOS**'
  );
  lines.push('');
  lines.push(
    'The next stage reviews ambiguous groups, locks capability identities, and attaches legacy regression scenarios before any rewrite credit is allowed.'
  );

  return `${lines.join('\n')}\n`;
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
      throw new CapabilityMapError(
        'CLI_OPTION_VALUE_REQUIRED',
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
    throw new CapabilityMapError(
      'CLI_OPTION_REQUIRED',
      [`--${name}`]
    );
  }

  return path.resolve(value);
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), {
    recursive: true
  });
  const temporary =
    `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, file);
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
    const command = positional[0]
      ?? 'normalize';

    if (command !== 'normalize') {
      throw new CapabilityMapError(
        'UNKNOWN_COMMAND',
        [command]
      );
    }

    const inputFile =
      required(flags, 'input');
    const jsonFile =
      required(flags, 'json');
    const markdownFile =
      required(flags, 'markdown');

    const discoveryReport = JSON.parse(
      fs.readFileSync(inputFile, 'utf8')
    );

    const report = buildCapabilityMap({
      discoveryReport
    });

    writeAtomic(
      jsonFile,
      `${JSON.stringify(report, null, 2)}\n`
    );
    writeAtomic(
      markdownFile,
      renderCapabilityMapMarkdown(report)
    );

    io.stdout.write(
      'CAPABILITY_MAP_NORMALIZATION=PASS\n'
    );
    io.stdout.write(
      `RAW_SURFACES=${report.counts.rawSurfaces}\n`
    );
    io.stdout.write(
      `NORMALIZED_CAPABILITIES=${report.counts.normalizedCapabilities}\n`
    );
    io.stdout.write(
      `BUSINESS_CAPABILITIES=${report.counts.businessCapabilities}\n`
    );
    io.stdout.write(
      `INFRASTRUCTURE_CAPABILITIES=${report.counts.infrastructureCapabilities}\n`
    );
    io.stdout.write(
      `UNCLASSIFIED_CAPABILITIES=${report.counts.unclassifiedCapabilities}\n`
    );
    io.stdout.write(
      `MERGED_SURFACES=${report.counts.mergedSurfaceReduction}\n`
    );
    io.stdout.write(
      `POTENTIAL_ALIAS_GROUPS=${report.counts.potentialAliasGroups}\n`
    );
    io.stdout.write(
      `HUMAN_REVIEW_REQUIRED=${report.counts.humanReviewRequired}\n`
    );
    io.stdout.write(
      `PARITY_VERIFIED_CAPABILITIES=${report.parity.verifiedCapabilities}\n`
    );
    io.stdout.write(
      `NEXT_ACTION=${report.recommendation.action}\n`
    );
    io.stdout.write(
      `REPORT_HASH=${report.reportHash}\n`
    );
    io.stdout.write(
      `REPORT_JSON=${jsonFile}\n`
    );
    io.stdout.write(
      `REPORT_MD=${markdownFile}\n`
    );

    return 0;
  } catch (error) {
    const code =
      error instanceof CapabilityMapError
        ? error.code
        : 'UNEXPECTED_ERROR';

    io.stderr.write(
      'CAPABILITY_MAP_RESULT=FAIL\n'
    );
    io.stderr.write(
      `CAPABILITY_MAP_ERROR_CODE=${code}\n`
    );
    io.stderr.write(
      `CAPABILITY_MAP_ERROR=${error.message}\n`
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
