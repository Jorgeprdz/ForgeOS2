#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export class CapabilityGroupingError extends Error {
  constructor(code, details = []) {
    super(
      `${code}${
        details.length
          ? `:${details.join('|')}`
          : ''
      }`
    );
    this.name = 'CapabilityGroupingError';
    this.code = code;
    this.details = Object.freeze([...details]);
  }
}

const TECHNICAL_TOKENS = new Set([
  'adapter',
  'api',
  'assert',
  'audit',
  'base',
  'builder',
  'calculator',
  'calculations',
  'calculation',
  'candidate',
  'catalog',
  'cli',
  'client',
  'config',
  'connector',
  'consumer',
  'contract',
  'controller',
  'core',
  'data',
  'definition',
  'definitions',
  'discovery',
  'engine',
  'entrypoint',
  'evaluator',
  'evaluation',
  'factory',
  'fixture',
  'fixtures',
  'flow',
  'gateway',
  'handler',
  'helpers',
  'helper',
  'index',
  'integration',
  'interpreter',
  'loader',
  'main',
  'mapper',
  'migration',
  'model',
  'module',
  'normalizer',
  'orchestrator',
  'parser',
  'provider',
  'readiness',
  'registry',
  'repository',
  'resolver',
  'route',
  'runner',
  'runtime',
  'schema',
  'service',
  'snapshot',
  'spec',
  'specs',
  'state',
  'store',
  'support',
  'test',
  'tests',
  'tool',
  'tools',
  'validator',
  'validation',
  'workflow'
]);

const WEAK_GENERIC_TOKENS = new Set([
  'advisor',
  'client',
  'forge',
  'legacy',
  'manager',
  'partner',
  'policy',
  'product',
  'quote',
  'system',
  'team'
]);

const DOMAIN_HINTS = Object.freeze({
  compensation: [
    'bonus',
    'cashflow',
    'commission',
    'compensation',
    'economic-output',
    'eligibility',
    'income',
    'payment-cadence',
    'payout',
    'qualification',
    'rule-pack'
  ],
  policyOperations: [
    'application',
    'beneficiary',
    'billing',
    'collection',
    'coverage',
    'issuance',
    'payment-status',
    'policy',
    'policy-operations',
    'premium',
    'production',
    'underwriting'
  ],
  productIntelligence: [
    'evidence',
    'product-evidence',
    'product-intelligence',
    'product-truth',
    'source-truth'
  ],
  quoting: [
    'gmm',
    'illustration',
    'proposal',
    'quotation',
    'quote',
    'quote-preview'
  ],
  advisorDevelopment: [
    'advisor-development',
    'advisor-lifecycle',
    'career',
    'coaching',
    'development',
    'training'
  ],
  recruitment: [
    'candidate',
    'contracting',
    'hiring',
    'onboarding',
    'recruiting',
    'recruitment',
    'talent'
  ],
  managerTeam: [
    'leadership',
    'manager',
    'manager-os',
    'partner-manager',
    'team',
    'team-output'
  ],
  crmClient: [
    'client',
    'crm',
    'customer',
    'follow-up',
    'lead',
    'prospect',
    'relationship'
  ],
  analyticsPlanning: [
    'analytics',
    'dashboard',
    'forecast',
    'goal',
    'metric',
    'planning',
    'scorecard'
  ],
  integrations: [
    'adapter',
    'connector',
    'external',
    'integration',
    'provider',
    'webhook'
  ],
  persistence: [
    'cache',
    'database',
    'db',
    'persistence',
    'repository',
    'storage',
    'supabase'
  ],
  identitySecurity: [
    'auth',
    'identity',
    'permission',
    'role',
    'security'
  ],
  userExperience: [
    'component',
    'frontend',
    'layout',
    'page',
    'screen',
    'ui',
    'ux',
    'view'
  ],
  governance: [
    'adr',
    'architecture',
    'constitution',
    'governance',
    'ratification'
  ],
  tooling: [
    'ci',
    'cli',
    'developer-tool',
    'script',
    'test-runner',
    'tooling'
  ]
});

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
      throw new CapabilityGroupingError(
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

  throw new CapabilityGroupingError(
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

function uniqueSorted(values) {
  return [...new Set(
    values.filter(Boolean)
  )].sort();
}

function normalize(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function tokenize(value) {
  return normalize(value)
    .split('-')
    .filter(Boolean);
}

function functionalTokens(value) {
  return tokenize(value)
    .filter(token =>
      token.length >= 2
      && !TECHNICAL_TOKENS.has(token)
      && !/^\d+$/u.test(token)
      && !/^(?:v|wave|stage|phase)\d*$/u.test(token)
    );
}

function strongTokens(value) {
  return functionalTokens(value)
    .filter(token =>
      !WEAK_GENERIC_TOKENS.has(token)
    );
}

function setIntersection(left, right) {
  return new Set(
    [...left].filter(value => right.has(value))
  );
}

function jaccard(left, right) {
  const union = new Set([
    ...left,
    ...right
  ]);

  if (union.size === 0) return 0;

  return setIntersection(left, right).size
    / union.size;
}

function sharedPrefix(left, right) {
  const size = Math.min(
    left.length,
    right.length
  );
  const output = [];

  for (let index = 0; index < size; index += 1) {
    if (left[index] !== right[index]) break;
    output.push(left[index]);
  }

  return output;
}

function dirnameLineage(file) {
  const directory = path.posix.dirname(file);
  if (directory === '.') return [];

  return directory
    .split('/')
    .filter(Boolean)
    .filter(segment =>
      ![
        'src',
        'lib',
        'modules',
        'tests',
        'test',
        'docs',
        'fixtures',
        'contracts',
        'rule-data',
        'rules'
      ].includes(segment)
    )
    .slice(0, 4)
    .flatMap(functionalTokens);
}

function artifactVocabulary(capability) {
  return new Set(
    [
      capability.key,
      ...(capability.sourceSurfaceKeys ?? []),
      ...(capability.codeFiles ?? []),
      ...(capability.testFiles ?? []),
      ...(capability.ruleArtifacts ?? []),
      ...(capability.documents ?? [])
    ].flatMap(functionalTokens)
  );
}

function artifactStrongVocabulary(capability) {
  return new Set(
    [
      capability.key,
      ...(capability.sourceSurfaceKeys ?? []),
      ...(capability.codeFiles ?? []),
      ...(capability.testFiles ?? []),
      ...(capability.ruleArtifacts ?? [])
    ].flatMap(strongTokens)
  );
}

function lineageVocabulary(capability) {
  return new Set(
    [
      ...(capability.codeFiles ?? []),
      ...(capability.testFiles ?? []),
      ...(capability.ruleArtifacts ?? [])
    ].flatMap(dirnameLineage)
  );
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

function domainEvidence(capability) {
  const text = normalize(
    [
      capability.key,
      ...(capability.sourceSurfaceKeys ?? []),
      ...(capability.codeFiles ?? []),
      ...(capability.testFiles ?? []),
      ...(capability.ruleArtifacts ?? []),
      ...(capability.documents ?? [])
    ].join(' ')
  );

  const scores = [];

  for (
    const [domain, hints]
    of Object.entries(DOMAIN_HINTS)
  ) {
    const matched = hints.filter(hint =>
      text.includes(normalize(hint))
    );

    if (matched.length > 0) {
      scores.push({
        domain,
        score: matched.length,
        matched: uniqueSorted(matched)
      });
    }
  }

  return scores.sort((left, right) =>
    right.score - left.score
    || left.domain.localeCompare(right.domain)
  );
}

function inferDomain(capability) {
  if (
    capability.domain
    && capability.domain !== 'unclassified'
  ) {
    return {
      domain: capability.domain,
      method: 'DECLARED',
      confidence: 'HIGH',
      evidence: []
    };
  }

  const evidence = domainEvidence(capability);
  const first = evidence[0];
  const second = evidence[1];

  if (
    first
    && first.score >= 2
    && (
      !second
      || first.score >= second.score + 1
    )
  ) {
    return {
      domain: first.domain,
      method: 'PATH_AND_NAME_HINTS',
      confidence:
        first.score >= 4 ? 'HIGH' : 'MEDIUM',
      evidence: first.matched
    };
  }

  return {
    domain: 'unclassified',
    method: 'UNRESOLVED',
    confidence: 'NONE',
    evidence: evidence
      .slice(0, 3)
      .map(item =>
        `${item.domain}:${item.score}`
      )
  };
}

class UnionFind {
  constructor(values) {
    this.parent = new Map(
      values.map(value => [value, value])
    );
    this.rank = new Map(
      values.map(value => [value, 0])
    );
  }

  find(value) {
    const parent = this.parent.get(value);
    if (parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }

  union(left, right) {
    let leftRoot = this.find(left);
    let rightRoot = this.find(right);

    if (leftRoot === rightRoot) return false;

    const leftRank = this.rank.get(leftRoot);
    const rightRank = this.rank.get(rightRoot);

    if (leftRank < rightRank) {
      [leftRoot, rightRoot] = [
        rightRoot,
        leftRoot
      ];
    }

    this.parent.set(rightRoot, leftRoot);

    if (leftRank === rightRank) {
      this.rank.set(
        leftRoot,
        leftRank + 1
      );
    }

    return true;
  }
}

function buildFileIndex(capabilities) {
  const index = new Map();

  for (const capability of capabilities) {
    for (
      const file of [
        ...(capability.codeFiles ?? []),
        ...(capability.testFiles ?? []),
        ...(capability.ruleArtifacts ?? []),
        ...(capability.documents ?? [])
      ]
    ) {
      if (!index.has(file)) {
        index.set(file, new Set());
      }
      index.get(file).add(capability.id);
    }
  }

  return index;
}

function buildImportPairs(
  dependencies,
  fileIndex
) {
  const pairs = new Map();

  function record(left, right) {
    if (!left || !right || left === right) return;
    const sorted = [left, right].sort();
    const key = sorted.join('|');

    if (!pairs.has(key)) {
      pairs.set(key, {
        left: sorted[0],
        right: sorted[1],
        count: 0,
        crossDomainEdges: 0,
        examples: []
      });
    }

    return pairs.get(key);
  }

  for (const edge of dependencies ?? []) {
    const sourceIds =
      fileIndex.get(edge.source);
    const targetIds =
      fileIndex.get(edge.target);

    if (!sourceIds || !targetIds) continue;

    for (const sourceId of sourceIds) {
      for (const targetId of targetIds) {
        const pair = record(
          sourceId,
          targetId
        );
        if (!pair) continue;

        pair.count += 1;

        if (
          edge.sourceDomain
          && edge.targetDomain
          && edge.sourceDomain !==
            edge.targetDomain
        ) {
          pair.crossDomainEdges += 1;
        }

        if (pair.examples.length < 5) {
          pair.examples.push({
            source: edge.source,
            target: edge.target
          });
        }
      }
    }
  }

  return pairs;
}

function pairEvidence(
  left,
  right,
  importPair
) {
  const leftWords = artifactVocabulary(left);
  const rightWords = artifactVocabulary(right);
  const leftStrong =
    artifactStrongVocabulary(left);
  const rightStrong =
    artifactStrongVocabulary(right);
  const leftLineage =
    lineageVocabulary(left);
  const rightLineage =
    lineageVocabulary(right);

  const sharedWords =
    [...setIntersection(
      leftWords,
      rightWords
    )].sort();
  const sharedStrong =
    [...setIntersection(
      leftStrong,
      rightStrong
    )].sort();
  const sharedLineage =
    [...setIntersection(
      leftLineage,
      rightLineage
    )].sort();

  const keyPrefix = sharedPrefix(
    functionalTokens(left.key),
    functionalTokens(right.key)
  );
  const keySimilarity = jaccard(
    new Set(functionalTokens(left.key)),
    new Set(functionalTokens(right.key))
  );
  const strongSimilarity = jaccard(
    leftStrong,
    rightStrong
  );

  const sameDomain =
    left.effectiveDomain ===
      right.effectiveDomain
    && left.effectiveDomain !==
      'unclassified';

  const reasons = [];
  let score = 0;

  if (
    sameDomain
    && sharedStrong.length >= 2
    && keyPrefix.length >= 2
  ) {
    score += 7;
    reasons.push(
      'SAME_DOMAIN_FUNCTIONAL_PREFIX'
    );
  }

  if (
    sameDomain
    && sharedStrong.length >= 3
    && strongSimilarity >= 0.5
  ) {
    score += 6;
    reasons.push(
      'SAME_DOMAIN_STRONG_TOKEN_SIMILARITY'
    );
  }

  if (
    sameDomain
    && sharedLineage.length >= 2
    && sharedStrong.length >= 2
  ) {
    score += 5;
    reasons.push(
      'SAME_DOMAIN_SHARED_LINEAGE'
    );
  }

  if (
    importPair?.count >= 1
    && sameDomain
    && sharedStrong.length >= 1
  ) {
    score += 5
      + Math.min(importPair.count, 3);
    reasons.push(
      'DIRECT_IMPORT_WITH_FUNCTIONAL_OVERLAP'
    );
  }

  if (
    importPair?.count >= 2
    && sameDomain
  ) {
    score += 4;
    reasons.push(
      'MULTIPLE_DIRECT_IMPORT_EDGES'
    );
  }

  if (
    sameDomain
    && keySimilarity >= 0.7
    && sharedWords.length >= 3
  ) {
    score += 4;
    reasons.push(
      'HIGH_KEY_SIMILARITY'
    );
  }

  const hasRuleOrTestAffinity =
    (
      left.ruleArtifacts?.length > 0
      || right.ruleArtifacts?.length > 0
      || left.testFiles?.length > 0
      || right.testFiles?.length > 0
    )
    && sharedStrong.length >= 2;

  if (sameDomain && hasRuleOrTestAffinity) {
    score += 3;
    reasons.push(
      'TEST_OR_RULE_AFFINITY'
    );
  }

  if (!sameDomain) {
    score -= 8;
  }

  return {
    score,
    reasons: uniqueSorted(reasons),
    sharedWords,
    sharedStrong,
    sharedLineage,
    keyPrefix,
    keySimilarity,
    strongSimilarity,
    importCount: importPair?.count ?? 0,
    importExamples:
      importPair?.examples ?? []
  };
}

function safeClusterName(members) {
  const tokenLists = members
    .map(member =>
      functionalTokens(member.key)
    )
    .filter(list => list.length > 0);

  if (tokenLists.length === 0) {
    return 'unknown-capability-group';
  }

  let prefix = tokenLists[0];

  for (
    const list of tokenLists.slice(1)
  ) {
    prefix = sharedPrefix(prefix, list);
    if (prefix.length === 0) break;
  }

  if (prefix.length >= 2) {
    return prefix.join('-');
  }

  const frequencies = new Map();

  for (const list of tokenLists) {
    for (const token of new Set(list)) {
      if (
        TECHNICAL_TOKENS.has(token)
        || WEAK_GENERIC_TOKENS.has(token)
      ) {
        continue;
      }

      frequencies.set(
        token,
        (frequencies.get(token) ?? 0) + 1
      );
    }
  }

  const threshold = Math.max(
    2,
    Math.ceil(members.length * 0.6)
  );
  const shared = [...frequencies.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((left, right) =>
      right[1] - left[1]
      || left[0].localeCompare(right[0])
    )
    .map(([token]) => token)
    .slice(0, 5);

  if (shared.length > 0) {
    return shared.join('-');
  }

  return members
    .map(member => member.key)
    .sort((left, right) =>
      left.length - right.length
      || left.localeCompare(right)
    )[0];
}

function canonicalGroupId(domain, name) {
  return `CAP2-${normalize(domain)
    .toUpperCase()
    .replaceAll('-', '_')}-${normalize(name)
    .toUpperCase()
    .replaceAll('-', '_')}`;
}

function clusterReviewReasons(group) {
  const reasons = [];

  if (group.effectiveDomain === 'unclassified') {
    reasons.push('DOMAIN_UNRESOLVED');
  }

  if (group.memberCount > 20) {
    reasons.push('LARGE_CLUSTER_REQUIRES_REVIEW');
  }

  if (
    group.memberCount > 1
    && group.mergeEvidence.length === 0
  ) {
    reasons.push('MERGE_WITHOUT_RECORDED_EVIDENCE');
  }

  if (
    group.riskTags.length > 0
    && group.testFiles.length === 0
  ) {
    reasons.push('HIGH_RISK_WITHOUT_LEGACY_TESTS');
  }

  if (
    group.riskTags.includes('FINANCIAL_TRUTH')
    && group.ruleArtifacts.length === 0
  ) {
    reasons.push('FINANCIAL_TRUTH_WITHOUT_RULE_ARTIFACT');
  }

  if (
    group.memberDomains.length > 1
  ) {
    reasons.push('MULTIPLE_SOURCE_DOMAINS');
  }

  return reasons;
}

function runLegacyGit(repository, args, encoding = 'utf8') {
  if (!repository) {
    throw new CapabilityGroupingError(
      'LEGACY_REPOSITORY_REQUIRED'
    );
  }

  const result = spawnSync(
    'git',
    ['-C', repository, ...args],
    {
      encoding,
      maxBuffer: 128 * 1024 * 1024
    }
  );

  if (result.error || result.status !== 0) {
    throw new CapabilityGroupingError(
      'LEGACY_GIT_COMMAND_FAILED',
      [
        args.join(' '),
        result.error?.message
          ?? String(result.stderr ?? '').trim()
      ]
    );
  }

  return result.stdout;
}

function legacyTrackedPaths(repository) {
  const output = runLegacyGit(
    repository,
    ['ls-tree', '-r', '-z', '--name-only', 'HEAD'],
    'buffer'
  );

  return new Set(
    Buffer.from(output)
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
  );
}

function legacyBlobText(repository, file) {
  const result = spawnSync(
    'git',
    ['-C', repository, 'show', `HEAD:${file}`],
    {
      encoding: 'buffer',
      maxBuffer: 8 * 1024 * 1024
    }
  );

  if (result.status !== 0) return null;

  const buffer = Buffer.from(result.stdout);
  if (
    buffer.length > 1024 * 1024
    || buffer.includes(0)
  ) {
    return null;
  }

  return buffer.toString('utf8');
}

function resolveLegacyImport(sourceFile, specifier, trackedPaths) {
  if (!specifier.startsWith('.')) return null;

  const base = path.posix.normalize(
    path.posix.join(
      path.posix.dirname(sourceFile),
      specifier
    )
  );

  const candidates = [
    base,
    ...['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json']
      .map(extension => `${base}${extension}`),
    ...['index.js', 'index.mjs', 'index.cjs', 'index.ts', 'index.tsx']
      .map(name => `${base}/${name}`)
  ];

  return candidates.find(candidate => trackedPaths.has(candidate)) ?? null;
}

function buildLegacyDependencyEdges(repository, capabilities) {
  const trackedPaths = legacyTrackedPaths(repository);
  const domainByFile = new Map();

  for (const capability of capabilities) {
    for (const file of [
      ...(capability.codeFiles ?? []),
      ...(capability.testFiles ?? []),
      ...(capability.ruleArtifacts ?? []),
      ...(capability.documents ?? [])
    ]) {
      if (!domainByFile.has(file)) {
        domainByFile.set(
          file,
          capability.effectiveDomain
            ?? capability.domain
            ?? 'unclassified'
        );
      }
    }
  }

  const sourceFiles = uniqueSorted(
    capabilities.flatMap(capability => capability.codeFiles ?? [])
  ).filter(file =>
    ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']
      .includes(path.extname(file).toLowerCase())
  );

  const edgeMap = new Map();
  const patterns = [
    /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/gu,
    /import\s+['"]([^'"]+)['"]/gu
  ];

  for (const sourceFile of sourceFiles) {
    const text = legacyBlobText(repository, sourceFile);
    if (text === null) continue;

    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const target = resolveLegacyImport(
          sourceFile,
          match[1],
          trackedPaths
        );
        if (!target) continue;

        const key = `${sourceFile}\0${target}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: sourceFile,
            target,
            specifier: match[1],
            sourceDomain: domainByFile.get(sourceFile) ?? 'unclassified',
            targetDomain: domainByFile.get(target) ?? 'unclassified'
          });
        }
      }
    }
  }

  return [...edgeMap.values()].sort((left, right) =>
    left.source.localeCompare(right.source)
    || left.target.localeCompare(right.target)
  );
}

function resolveDependencyEdges(
  discoveryReport,
  legacyRepository,
  capabilities
) {
  if (Array.isArray(discoveryReport.inventory?.dependencies)) {
    return {
      source: 'DISCOVERY_TOP_LEVEL_DEPENDENCIES',
      edges: discoveryReport.inventory.dependencies
    };
  }

  return {
    source: 'LEGACY_GIT_HEAD_BLOBS',
    edges: buildLegacyDependencyEdges(
      legacyRepository,
      capabilities
    )
  };
}

function assertInputs(discovery, candidate) {
  if (
    !Array.isArray(candidate.capabilities)
  ) {
    throw new CapabilityGroupingError(
      'CANDIDATE_CAPABILITIES_REQUIRED'
    );
  }

  if (
    candidate.parity?.verifiedCapabilities !== 0
  ) {
    throw new CapabilityGroupingError(
      'CANDIDATE_ALREADY_CREDITS_PARITY'
    );
  }
}

export function buildCapabilityGroupingV2({
  discoveryReport,
  candidateMap,
  legacyRepository = null,
  generatedAt =
    new Date().toISOString()
}) {
  assertInputs(
    discoveryReport,
    candidateMap
  );

  const capabilities =
    candidateMap.capabilities.map(
      capability => {
        const inferred =
          inferDomain(capability);

        return {
          ...capability,
          declaredDomain:
            capability.domain
            ?? 'unclassified',
          effectiveDomain:
            inferred.domain,
          domainInference: inferred,
          vocabulary:
            [...artifactVocabulary(capability)]
              .sort(),
          strongVocabulary:
            [...artifactStrongVocabulary(
              capability
            )].sort(),
          lineageVocabulary:
            [...lineageVocabulary(capability)]
              .sort()
        };
      }
    );

  const byId = new Map(
    capabilities.map(item => [
      item.id,
      item
    ])
  );
  const fileIndex =
    buildFileIndex(capabilities);
  const dependencyGraph =
    resolveDependencyEdges(
      discoveryReport,
      legacyRepository,
      capabilities
    );
  const importPairs =
    buildImportPairs(
      dependencyGraph.edges,
      fileIndex
    );
  const union = new UnionFind(
    capabilities.map(item => item.id)
  );
  const mergeDecisions = [];
  const rejectedEdges = [];

  const candidatePairs = new Set(
    importPairs.keys()
  );

  const signatureIndex = new Map();

  for (const capability of capabilities) {
    const signature = [
      capability.effectiveDomain,
      ...capability.strongVocabulary
        .slice()
        .sort()
    ].join('|');

    if (
      capability.strongVocabulary.length >= 2
    ) {
      if (!signatureIndex.has(signature)) {
        signatureIndex.set(signature, []);
      }
      signatureIndex.get(signature)
        .push(capability.id);
    }
  }

  for (const ids of signatureIndex.values()) {
    for (
      let leftIndex = 0;
      leftIndex < ids.length;
      leftIndex += 1
    ) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < ids.length;
        rightIndex += 1
      ) {
        candidatePairs.add(
          [ids[leftIndex], ids[rightIndex]]
            .sort()
            .join('|')
        );
      }
    }
  }

  const lineageIndex = new Map();

  for (const capability of capabilities) {
    for (
      const lineageToken
      of capability.lineageVocabulary
    ) {
      if (!lineageIndex.has(lineageToken)) {
        lineageIndex.set(
          lineageToken,
          []
        );
      }
      lineageIndex.get(lineageToken)
        .push(capability.id);
    }
  }

  for (const ids of lineageIndex.values()) {
    if (ids.length > 60) continue;

    for (
      let leftIndex = 0;
      leftIndex < ids.length;
      leftIndex += 1
    ) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < ids.length;
        rightIndex += 1
      ) {
        candidatePairs.add(
          [ids[leftIndex], ids[rightIndex]]
            .sort()
            .join('|')
        );
      }
    }
  }

  for (const key of candidatePairs) {
    const [leftId, rightId] =
      key.split('|');
    const left = byId.get(leftId);
    const right = byId.get(rightId);

    if (!left || !right) continue;

    const evidence = pairEvidence(
      left,
      right,
      importPairs.get(key)
    );

    const eligible =
      evidence.score >= 9
      && left.effectiveDomain ===
        right.effectiveDomain
      && left.effectiveDomain !==
        'unclassified'
      && evidence.reasons.length >= 1;

    if (eligible) {
      union.union(leftId, rightId);
      mergeDecisions.push({
        leftId,
        rightId,
        score: evidence.score,
        reasons: evidence.reasons,
        sharedStrong:
          evidence.sharedStrong,
        sharedLineage:
          evidence.sharedLineage,
        importCount:
          evidence.importCount,
        importExamples:
          evidence.importExamples
      });
    } else if (
      evidence.score >= 5
      || evidence.importCount > 0
    ) {
      rejectedEdges.push({
        leftId,
        rightId,
        score: evidence.score,
        reasons: evidence.reasons,
        leftDomain:
          left.effectiveDomain,
        rightDomain:
          right.effectiveDomain,
        sharedStrong:
          evidence.sharedStrong,
        importCount:
          evidence.importCount,
        status:
          'REVIEW_NOT_AUTO_MERGED'
      });
    }
  }

  const clusters = new Map();

  for (const capability of capabilities) {
    const root = union.find(capability.id);

    if (!clusters.has(root)) {
      clusters.set(root, []);
    }

    clusters.get(root).push(capability);
  }

  const groups = [...clusters.values()]
    .map(members => {
      const memberIds = members
        .map(item => item.id)
        .sort();
      const domains = uniqueSorted(
        members.map(item =>
          item.effectiveDomain
        )
      );
      const effectiveDomain =
        domains.length === 1
          ? domains[0]
          : 'unclassified';
      const name =
        safeClusterName(members);
      const mergeEvidence =
        mergeDecisions.filter(item =>
          memberIds.includes(item.leftId)
          && memberIds.includes(item.rightId)
        );

      const group = {
        id: canonicalGroupId(
          effectiveDomain,
          name
        ),
        name,
        effectiveDomain,
        kind:
          classifyKind(effectiveDomain),
        memberCount: members.length,
        memberCapabilityIds: memberIds,
        memberDomains: domains,
        sourceSurfaceKeys: uniqueSorted(
          members.flatMap(item =>
            item.sourceSurfaceKeys ?? []
          )
        ),
        codeFiles: uniqueSorted(
          members.flatMap(item =>
            item.codeFiles ?? []
          )
        ),
        testFiles: uniqueSorted(
          members.flatMap(item =>
            item.testFiles ?? []
          )
        ),
        ruleArtifacts: uniqueSorted(
          members.flatMap(item =>
            item.ruleArtifacts ?? []
          )
        ),
        documents: uniqueSorted(
          members.flatMap(item =>
            item.documents ?? []
          )
        ),
        entrypointCandidates:
          uniqueSorted(
            members.flatMap(item =>
              (item.entrypointCandidates ?? [])
                .map(entry =>
                  entry.path
                )
            )
          ),
        riskTags: uniqueSorted(
          members.flatMap(item =>
            item.riskTags ?? []
          )
        ),
        mergeEvidence,
        domainInference: members.map(
          item => ({
            capabilityId: item.id,
            declaredDomain:
              item.declaredDomain,
            effectiveDomain:
              item.effectiveDomain,
            method:
              item.domainInference.method,
            confidence:
              item.domainInference.confidence,
            evidence:
              item.domainInference.evidence
          })
        ),
        parityStatus:
          'GROUPED_CANDIDATE_NOT_LOCKED',
        parityVerified: false,
        verifiedParityScenarios: 0
      };

      group.reviewReasons =
        clusterReviewReasons(group);
      group.requiresHumanReview =
        group.reviewReasons.length > 0
        || group.memberCount > 1;
      group.migrationPriority =
        members.reduce(
          (sum, item) =>
            sum
            + Number(
              item.migrationPriority
              ?? item.priorityScore
              ?? 0
            ),
          0
        )
        + group.riskTags.length * 5
        + group.testFiles.length * 2
        + group.ruleArtifacts.length * 4;

      return group;
    })
    .sort((left, right) =>
      right.migrationPriority
        - left.migrationPriority
      || left.effectiveDomain.localeCompare(
        right.effectiveDomain
      )
      || left.name.localeCompare(right.name)
    );

  const inferredDomainCapabilities =
    capabilities.filter(item =>
      item.declaredDomain ===
        'unclassified'
      && item.effectiveDomain !==
        'unclassified'
    );

  const unresolvedCapabilities =
    capabilities.filter(item =>
      item.effectiveDomain ===
        'unclassified'
    );

  const multiMemberGroups =
    groups.filter(item =>
      item.memberCount > 1
    );

  const domainSummary = new Map();

  for (const group of groups) {
    if (
      !domainSummary.has(
        group.effectiveDomain
      )
    ) {
      domainSummary.set(
        group.effectiveDomain,
        {
          domain:
            group.effectiveDomain,
          kind: group.kind,
          groups: 0,
          multiMemberGroups: 0,
          memberCapabilities: 0,
          codeFiles: 0,
          testFiles: 0,
          ruleArtifacts: 0,
          riskGroups: 0,
          humanReviewRequired: 0,
          migrationPriority: 0
        }
      );
    }

    const summary =
      domainSummary.get(
        group.effectiveDomain
      );
    summary.groups += 1;
    summary.memberCapabilities +=
      group.memberCount;
    summary.codeFiles +=
      group.codeFiles.length;
    summary.testFiles +=
      group.testFiles.length;
    summary.ruleArtifacts +=
      group.ruleArtifacts.length;
    summary.migrationPriority +=
      group.migrationPriority;

    if (group.memberCount > 1) {
      summary.multiMemberGroups += 1;
    }
    if (group.riskTags.length > 0) {
      summary.riskGroups += 1;
    }
    if (group.requiresHumanReview) {
      summary.humanReviewRequired += 1;
    }
  }

  const report = {
    schemaVersion: 1,
    kind:
      'FORGE_LEGACY_CAPABILITY_GROUPING_V2_CANDIDATE',
    generatedAt,
    source: {
      legacyHead:
        discoveryReport.legacy?.head
        ?? candidateMap.source?.legacyHead
        ?? null,
      discoveryReportHash:
        discoveryReport.reportHash
        ?? null,
      capabilityMapHash:
        candidateMap.reportHash
        ?? null,
      v2Head:
        candidateMap.source?.v2Head
        ?? discoveryReport.v2?.head
        ?? null,
      dependencyGraphSource:
        dependencyGraph.source,
      dependencyEdgeCount:
        dependencyGraph.edges.length
    },
    safety: {
      modifiesLegacy: false,
      modifiesRules: false,
      grantsParity: false,
      retiresCapabilities: false,
      mergesRequireEvidence: true,
      crossDomainAutoMerge: false
    },
    thresholds: {
      minimumAutoMergeScore: 9,
      unclassifiedAutoMerge: false,
      crossDomainAutoMerge: false,
      maximumLineageBucket: 60
    },
    counts: {
      rawSurfaces:
        candidateMap.counts?.rawSurfaces
        ?? discoveryReport.inventory
          ?.surfaceCount
        ?? null,
      inputCapabilityCandidates:
        capabilities.length,
      proposedGroups: groups.length,
      groupedReduction:
        capabilities.length - groups.length,
      multiMemberGroups:
        multiMemberGroups.length,
      groupedMembers:
        multiMemberGroups.reduce(
          (sum, group) =>
            sum + group.memberCount,
          0
        ),
      dependencyEdges:
        dependencyGraph.edges.length,
      acceptedMergeEdges:
        mergeDecisions.length,
      reviewEdges:
        rejectedEdges.length,
      inferredDomainCapabilities:
        inferredDomainCapabilities.length,
      unresolvedUnclassifiedCapabilities:
        unresolvedCapabilities.length,
      humanReviewGroups:
        groups.filter(item =>
          item.requiresHumanReview
        ).length,
      parityVerifiedCapabilities: 0
    },
    domains: [...domainSummary.values()]
      .sort((left, right) =>
        right.migrationPriority
          - left.migrationPriority
        || left.domain.localeCompare(
          right.domain
        )
      ),
    groups,
    acceptedMergeEdges:
      mergeDecisions.sort(
        (left, right) =>
          right.score - left.score
          || left.leftId.localeCompare(
            right.leftId
          )
      ),
    reviewEdges: rejectedEdges
      .sort((left, right) =>
        right.score - left.score
        || left.leftId.localeCompare(
          right.leftId
        )
      )
      .slice(0, 1000),
    inferredDomains:
      inferredDomainCapabilities.map(
        item => ({
          capabilityId: item.id,
          key: item.key,
          inferredDomain:
            item.effectiveDomain,
          method:
            item.domainInference.method,
          confidence:
            item.domainInference.confidence,
          evidence:
            item.domainInference.evidence
        })
      ),
    unresolvedQueue:
      unresolvedCapabilities
        .map(item => ({
          capabilityId: item.id,
          key: item.key,
          sourceSurfaceKeys:
            item.sourceSurfaceKeys,
          codeFiles:
            item.codeFiles,
          testFiles:
            item.testFiles,
          ruleArtifacts:
            item.ruleArtifacts,
          domainEvidence:
            item.domainInference.evidence,
          migrationPriority:
            item.migrationPriority
            ?? item.priorityScore
            ?? 0
        }))
        .sort((left, right) =>
          right.migrationPriority
            - left.migrationPriority
          || left.key.localeCompare(
            right.key
          )
        ),
    parity: {
      status:
        'GROUPING_V2_CANDIDATE_NOT_LOCKED',
      verifiedCapabilities: 0,
      verifiedPercentage: null,
      silentEquivalenceClaims: 0
    },
    recommendation: {
      action:
        'REVIEW_HIGH_CONFIDENCE_GROUPS_AND_LOCK_CAPABILITY_IDENTITIES',
      firstReviewQueue: groups
        .filter(item =>
          item.kind === 'BUSINESS'
          && item.memberCount > 1
        )
        .slice(0, 30)
        .map(item => ({
          groupId: item.id,
          name: item.name,
          domain:
            item.effectiveDomain,
          memberCount:
            item.memberCount,
          testFiles:
            item.testFiles.length,
          ruleArtifacts:
            item.ruleArtifacts.length,
          riskTags:
            item.riskTags,
          migrationPriority:
            item.migrationPriority
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

export function renderGroupingMarkdown(
  report
) {
  const lines = [];

  lines.push(
    '# Forge OS V2 — Capability Grouping V2 Candidate'
  );
  lines.push('');
  lines.push(
    `- Legacy HEAD: \`${report.source.legacyHead}\``
  );
  lines.push(
    `- Input capability-map hash: \`${report.source.capabilityMapHash}\``
  );
  lines.push(
    `- Grouping report hash: \`${report.reportHash}\``
  );
  lines.push(
    `- Dependency graph source: \`${report.source.dependencyGraphSource}\``
  );
  lines.push(
    `- Dependency edges: ${report.source.dependencyEdgeCount}`
  );
  lines.push('');
  lines.push('## Honest status');
  lines.push('');
  lines.push(
    `- Status: **${report.parity.status}**`
  );
  lines.push(
    '- Grouping proposals are not parity claims.'
  );
  lines.push(
    '- Cross-domain and unresolved candidates are never automatically merged.'
  );
  lines.push('');
  lines.push('## Reduction');
  lines.push('');
  lines.push(
    `- Input candidates: ${report.counts.inputCapabilityCandidates}`
  );
  lines.push(
    `- Proposed groups: ${report.counts.proposedGroups}`
  );
  lines.push(
    `- Grouped reduction: ${report.counts.groupedReduction}`
  );
  lines.push(
    `- Multi-member groups: ${report.counts.multiMemberGroups}`
  );
  lines.push(
    `- Members inside grouped proposals: ${report.counts.groupedMembers}`
  );
  lines.push(
    `- Accepted evidence edges: ${report.counts.acceptedMergeEdges}`
  );
  lines.push(
    `- Inferred domain candidates: ${report.counts.inferredDomainCapabilities}`
  );
  lines.push(
    `- Unresolved unclassified: ${report.counts.unresolvedUnclassifiedCapabilities}`
  );
  lines.push(
    '- Verified parity capabilities: 0'
  );
  lines.push('');
  lines.push('## Domain summary');
  lines.push('');
  lines.push(
    '| Domain | Kind | Groups | Multi-member | Members | Tests | Rules | Review | Priority |'
  );
  lines.push(
    '|---|---|---:|---:|---:|---:|---:|---:|---:|'
  );

  for (const domain of report.domains) {
    lines.push(
      `| ${domain.domain} | ${domain.kind} | ${domain.groups} | ${domain.multiMemberGroups} | ${domain.memberCapabilities} | ${domain.testFiles} | ${domain.ruleArtifacts} | ${domain.humanReviewRequired} | ${domain.migrationPriority} |`
    );
  }

  lines.push('');
  lines.push(
    '## Highest-priority grouped business proposals'
  );
  lines.push('');
  lines.push(
    '| Group | Domain | Members | Tests | Rules | Risks | Priority |'
  );
  lines.push(
    '|---|---|---:|---:|---:|---|---:|'
  );

  for (
    const group of report.groups
      .filter(item =>
        item.kind === 'BUSINESS'
        && item.memberCount > 1
      )
      .slice(0, 50)
  ) {
    lines.push(
      `| ${group.name} | ${group.effectiveDomain} | ${group.memberCount} | ${group.testFiles.length} | ${group.ruleArtifacts.length} | ${group.riskTags.join(', ') || '—'} | ${group.migrationPriority} |`
    );
  }

  lines.push('');
  lines.push('## Next governed action');
  lines.push('');
  lines.push(
    '**REVIEW_HIGH_CONFIDENCE_GROUPS_AND_LOCK_CAPABILITY_IDENTITIES**'
  );
  lines.push('');
  lines.push(
    'The next stage locks only reviewed capability identities, then attaches parity scenarios before rewrite credit is possible.'
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
      throw new CapabilityGroupingError(
        'CLI_OPTION_VALUE_REQUIRED',
        [token]
      );
    }

    if (flags.has(token.slice(2))) {
      throw new CapabilityGroupingError(
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
    throw new CapabilityGroupingError(
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
    const command =
      positional[0] ?? 'group';

    if (command !== 'group') {
      throw new CapabilityGroupingError(
        'UNKNOWN_COMMAND',
        [command]
      );
    }

    const discoveryFile =
      required(flags, 'discovery');
    const candidateFile =
      required(flags, 'candidate');
    const jsonFile =
      required(flags, 'json');
    const markdownFile =
      required(flags, 'markdown');
    const legacyRepository =
      flags.get('legacy-root')
        ? path.resolve(flags.get('legacy-root'))
        : null;

    const discoveryReport = JSON.parse(
      fs.readFileSync(
        discoveryFile,
        'utf8'
      )
    );
    const candidateMap = JSON.parse(
      fs.readFileSync(
        candidateFile,
        'utf8'
      )
    );

    const report =
      buildCapabilityGroupingV2({
        discoveryReport,
        candidateMap,
        legacyRepository
      });

    writeAtomic(
      jsonFile,
      `${JSON.stringify(report, null, 2)}\n`
    );
    writeAtomic(
      markdownFile,
      renderGroupingMarkdown(report)
    );

    io.stdout.write(
      'CAPABILITY_GROUPING_V2=PASS\n'
    );
    io.stdout.write(
      `INPUT_CAPABILITIES=${report.counts.inputCapabilityCandidates}\n`
    );
    io.stdout.write(
      `PROPOSED_GROUPS=${report.counts.proposedGroups}\n`
    );
    io.stdout.write(
      `GROUPED_REDUCTION=${report.counts.groupedReduction}\n`
    );
    io.stdout.write(
      `MULTI_MEMBER_GROUPS=${report.counts.multiMemberGroups}\n`
    );
    io.stdout.write(
      `GROUPED_MEMBERS=${report.counts.groupedMembers}\n`
    );
    io.stdout.write(
      `DEPENDENCY_GRAPH_SOURCE=${report.source.dependencyGraphSource}\n`
    );
    io.stdout.write(
      `DEPENDENCY_EDGES=${report.counts.dependencyEdges}\n`
    );
    io.stdout.write(
      `ACCEPTED_MERGE_EDGES=${report.counts.acceptedMergeEdges}\n`
    );
    io.stdout.write(
      `INFERRED_DOMAIN_CAPABILITIES=${report.counts.inferredDomainCapabilities}\n`
    );
    io.stdout.write(
      `UNRESOLVED_UNCLASSIFIED=${report.counts.unresolvedUnclassifiedCapabilities}\n`
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
      error instanceof CapabilityGroupingError
        ? error.code
        : 'UNEXPECTED_ERROR';

    io.stderr.write(
      'CAPABILITY_GROUPING_V2_RESULT=FAIL\n'
    );
    io.stderr.write(
      `CAPABILITY_GROUPING_V2_ERROR_CODE=${code}\n`
    );
    io.stderr.write(
      `CAPABILITY_GROUPING_V2_ERROR=${error.message}\n`
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
