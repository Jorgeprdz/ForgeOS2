#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const manifestPath = path.join(root, 'forge', 'modules.json');
const registryPath = path.join(root, 'governance', 'FORGE_GOVERNANCE_REGISTRY.md');
const policyPath = path.join(scriptDir, 'policy.json');
const actionsPath = path.join(scriptDir, 'module-actions.json');
const internalPrefix = '.forge21/autopilot/';

class AutopilotError extends Error {
  constructor(code, detail = '') {
    super(detail ? `${code}:${detail}` : code);
    this.name = 'AutopilotError';
    this.code = code;
    this.detail = detail;
  }
}

function normalizeRelative(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function absolute(relative) {
  return path.join(root, relative);
}

function existsFile(relative) {
  const target = absolute(relative);
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(readText(file));
  } catch (error) {
    throw new AutopilotError('INVALID_JSON', `${normalizeRelative(path.relative(root, file))}:${error.message}`);
  }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function writeTextAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, value);
  fs.renameSync(temporary, file);
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function nowStamp() {
  return new Date().toISOString().replaceAll(/[:.]/g, '-');
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function runStrict(command, options = {}) {
  const label = options.label ?? command;
  console.log(`\n=== ${label} ===`);
  console.log(`COMMAND=${command}`);
  const wrappedCommand = `set -Eeuo pipefail\ncd ${shellQuote(root)}\n${command}`;
  const result = spawnSync('bash', ['-lc', wrappedCommand], {
    cwd: os.homedir(),
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });

  if (options.capture) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.error) throw new AutopilotError('COMMAND_ERROR', `${label}:${result.error.message}`);
  if (result.status !== 0) throw new AutopilotError('COMMAND_FAILED', `${label}:status=${result.status}`);
  return {
    command,
    label,
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}

function git(args, options = {}) {
  const result = spawnSync('git', ['-C', root, ...args], {
    cwd: os.homedir(),
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe']
  });
  if (result.error) throw new AutopilotError('GIT_ERROR', result.error.message);
  if (result.status !== 0 && !options.allowFailure) {
    throw new AutopilotError('GIT_FAILED', `${args.join(' ')}:${(result.stderr || result.stdout).trim()}`);
  }
  return {
    status: result.status,
    stdout: options.raw ? (result.stdout ?? '') : (result.stdout ?? '').trim(),
    stderr: options.raw ? (result.stderr ?? '') : (result.stderr ?? '').trim()
  };
}

function currentHead() {
  return git(['rev-parse', 'HEAD']).stdout;
}

function currentBranch() {
  const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD'], { allowFailure: true });
  if (branch.status !== 0 || !branch.stdout) throw new AutopilotError('DETACHED_HEAD');
  return branch.stdout;
}

function isAncestor(commit, head) {
  if (!commit || !head) return false;
  return git(['merge-base', '--is-ancestor', commit, head], { allowFailure: true }).status === 0;
}

function statusEntries() {
  const result = git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true });
  if (!result.stdout) return [];
  return result.stdout.split('\0').filter(Boolean).map(record => {
    const status = record.slice(0, 2);
    const raw = record.slice(3);
    const arrow = raw.indexOf(' -> ');
    const file = normalizeRelative(arrow >= 0 ? raw.slice(arrow + 4) : raw);
    return { status, file };
  });
}

function relevantStatusEntries() {
  return statusEntries().filter(({ file }) => !file.startsWith(internalPrefix));
}

function listFilesRecursively(relative) {
  const start = absolute(relative);
  if (!fs.existsSync(start)) return [];
  if (fs.statSync(start).isFile()) return [normalizeRelative(relative)];
  const output = [];
  const stack = [start];
  while (stack.length > 0) {
    const directory = stack.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) stack.push(target);
      if (entry.isFile()) output.push(normalizeRelative(path.relative(root, target)));
    }
  }
  return output.sort();
}

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const equal = value.indexOf('=');
    if (equal >= 0) {
      flags.set(value.slice(2, equal), value.slice(equal + 1));
      continue;
    }
    const name = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags.set(name, next);
      index += 1;
    } else {
      flags.set(name, true);
    }
  }
  return { positional, flags };
}

function validateWeights(policy) {
  const total = Object.values(policy.weights ?? {}).reduce((sum, value) => sum + Number(value), 0);
  if (Math.abs(total - 1) > 0.000001) throw new AutopilotError('INVALID_AREA_WEIGHTS', String(total));
}

function loadInputs() {
  if (!existsFile('forge/modules.json')) throw new AutopilotError('MANIFEST_NOT_FOUND', manifestPath);
  if (!existsFile('governance/FORGE_GOVERNANCE_REGISTRY.md')) throw new AutopilotError('REGISTRY_NOT_FOUND', registryPath);
  if (!fs.existsSync(policyPath)) throw new AutopilotError('POLICY_NOT_FOUND', policyPath);

  const manifest = readJson(manifestPath);
  const registry = readText(registryPath);
  const policy = readJson(policyPath);
  const actions = readJson(actionsPath, { schemaVersion: 1, modules: {} });
  validateWeights(policy);
  return { manifest, registry, policy, actions };
}

function manifestDiagnostics(manifest) {
  const errors = [];
  const modules = Array.isArray(manifest?.modules) ? manifest.modules : [];
  if (!Array.isArray(manifest?.modules)) errors.push('MANIFEST_MODULES_NOT_ARRAY');
  const ids = new Set();
  for (const record of modules) {
    if (!record?.id || typeof record.id !== 'string') errors.push('MODULE_ID_REQUIRED');
    if (ids.has(record.id)) errors.push(`DUPLICATE_MODULE_ID:${record.id}`);
    ids.add(record.id);
    if (!record.entrypoint) errors.push(`ENTRYPOINT_REQUIRED:${record.id}`);
    if (!Array.isArray(record.tests) || record.tests.length === 0) errors.push(`TESTS_REQUIRED:${record.id}`);
  }
  for (const record of modules) {
    for (const dependency of record.dependencies ?? []) {
      if (!ids.has(dependency)) errors.push(`UNKNOWN_DEPENDENCY:${record.id}:${dependency}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(modules.map(record => [record.id, record]));
  function visit(moduleId, trail = []) {
    if (visiting.has(moduleId)) {
      errors.push(`DEPENDENCY_CYCLE:${[...trail, moduleId].join('>')}`);
      return;
    }
    if (visited.has(moduleId)) return;
    visiting.add(moduleId);
    for (const dependency of byId.get(moduleId)?.dependencies ?? []) visit(dependency, [...trail, moduleId]);
    visiting.delete(moduleId);
    visited.add(moduleId);
  }
  for (const record of modules) visit(record.id);
  return [...new Set(errors)];
}

function registeredAuthorityPaths(registry) {
  const paths = new Set();
  for (const match of registry.matchAll(/`([^`]+)`/g)) {
    const value = match[1].trim();
    if (value.includes('/') || /\.(md|txt|json)$/i.test(value)) paths.add(value.replace(/\/$/, ''));
  }
  return [...paths].filter(value => !value.includes('*'));
}

function architectureEvaluation(inputs) {
  const manifestErrors = manifestDiagnostics(inputs.manifest);
  const authorityPaths = registeredAuthorityPaths(inputs.registry);
  const missingAuthority = authorityPaths.filter(relative => !fs.existsSync(absolute(relative)));
  const governanceInputs = [...new Set(inputs.manifest.modules.flatMap(record => record.governanceInputs ?? []))];
  const missingGovernanceInputs = governanceInputs.filter(relative => !existsFile(relative));
  const adrFiles = listFilesRecursively('adr').filter(file => /\.(md|txt)$/i.test(file));
  const checks = [
    {
      id: 'A1-01',
      label: 'Registry ratificado y activo',
      pass: /Status:\s*`?RATIFIED\s*\/\s*ACTIVE`?/i.test(inputs.registry),
      detail: 'FORGE_GOVERNANCE_REGISTRY.md debe declarar RATIFIED / ACTIVE.'
    },
    {
      id: 'A1-02',
      label: 'Constitución activa disponible',
      pass: existsFile('governance/constitution/CONSTITUTION_UNIFIED.md'),
      detail: 'Debe existir la fuente constitucional registrada.'
    },
    {
      id: 'A1-03',
      label: 'Inventario ADR no vacío',
      pass: adrFiles.length > 0,
      detail: `ADR encontrados: ${adrFiles.length}`
    },
    {
      id: 'A1-04',
      label: 'Build Tree registrado y disponible',
      pass: existsFile('governance/architecture/FORGE_MASTER_BUILD_TREE.md'),
      detail: 'Debe existir el Build Tree normativo registrado.'
    },
    {
      id: 'A1-05',
      label: 'Todas las autoridades registradas existen',
      pass: missingAuthority.length === 0,
      detail: missingAuthority.length ? missingAuthority.join(', ') : `${authorityPaths.length} rutas registradas verificadas.`
    },
    {
      id: 'A1-06',
      label: 'Manifest consistente y gobernanza resoluble',
      pass: manifestErrors.length === 0 && missingGovernanceInputs.length === 0,
      detail: [...manifestErrors, ...missingGovernanceInputs.map(value => `MISSING_GOVERNANCE_INPUT:${value}`)].join(', ') || 'Sin errores.'
    }
  ];
  const passed = checks.filter(check => check.pass).length;
  return {
    checks,
    structuralPercent: checks.length ? (passed / checks.length) * 100 : 0,
    functionalPercent: checks.length ? (passed / checks.length) * 100 : 0,
    manifestErrors,
    missingAuthority,
    missingGovernanceInputs
  };
}

function classifyModule(record, policy) {
  const override = policy.moduleOverrides?.[record.id];
  if (override?.area) return override.area;
  if (record.id.startsWith(policy.classification.scaffoldIdPrefix)) return 'scaffolds';
  const haystack = `${record.id} ${record.title ?? ''} ${record.description ?? ''} ${record.entrypoint ?? ''}`.toUpperCase();
  if (policy.classification.productTokens.some(token => haystack.includes(token))) return 'productE2E';
  if (policy.classification.integrationTokens.some(token => haystack.includes(token))) return 'integrations';
  return 'runtime';
}

function loadReceipt(record) {
  const relative = `.forge21/receipts/${record.id}/latest.json`;
  const file = absolute(relative);
  if (!fs.existsSync(file)) return { exists: false, pass: false, current: false, errors: ['RECEIPT_MISSING'], relative };
  const receipt = readJson(file);
  const errors = [];
  if (receipt.moduleId !== record.id) errors.push('RECEIPT_MODULE_MISMATCH');
  if (receipt.pass !== true) errors.push('RECEIPT_PASS_FALSE');
  for (const [relativeFile, expectedHash] of Object.entries(receipt.hashes ?? {})) {
    const target = absolute(relativeFile);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      errors.push(`RECEIPT_FILE_MISSING:${relativeFile}`);
      continue;
    }
    const actual = sha256File(target);
    if (actual !== expectedHash) errors.push(`RECEIPT_HASH_STALE:${relativeFile}`);
  }
  const required = [...(record.governanceInputs ?? []), record.entrypoint, ...(record.tests ?? [])].filter(Boolean);
  for (const relativeFile of required) {
    if (!(relativeFile in (receipt.hashes ?? {}))) errors.push(`RECEIPT_HASH_NOT_COVERED:${relativeFile}`);
  }
  return {
    exists: true,
    pass: receipt.pass === true,
    current: errors.length === 0,
    errors,
    relative,
    receipt
  };
}

function sourceForPaths(paths) {
  const chunks = [];
  for (const relative of paths) {
    if (!existsFile(relative)) continue;
    chunks.push(`\n/* FILE:${relative} */\n${readText(absolute(relative))}`);
  }
  return chunks.join('\n');
}

function testAnalysis(record, override, action) {
  const testPaths = [...(record.tests ?? []), ...(action?.consumerTestPaths ?? [])];
  const source = sourceForPaths(testPaths);
  const lower = source.toLowerCase();
  const lines = source.split(/\r?\n/).length;
  const assertionCount = (source.match(/\bassert(?:\.[A-Za-z]+|\s*\()/g) ?? []).length;
  const negativePath = /assert\.(throws|rejects)|\b(rejects?|invalid|failure|fails?|error|timeout|conflict|stale|unknown|unauthorized|forbidden|collision|tamper|rollback)\b/i.test(source);
  const mockMatches = source.match(/\b(mock(?:ed|ing)?|stub(?:bed|bing)?|sinon|nock|jest\.fn|mockimplementation|fake[A-Z_]|always[-_ ]?success)\b/gim) ?? [];
  const stringValues = [...source.matchAll(/(['"`])([^'"`\n]{6,})\1/g)].map(match => match[2]).filter(value => !/^\s*(creates?|rejects?|requires?|asserts?|supports?|returns?|reports?|validates?|fails?|handles?)\b/i.test(value));
  const uniqueDataStrings = new Set(stringValues).size;
  const objectKeys = new Set([...source.matchAll(/\b([A-Za-z_$][\w$]*)\s*:/g)].map(match => match[1])).size;
  const nonTrivialData = lines >= 35 && assertionCount >= 3 && uniqueDataStrings >= 5 && objectKeys >= 4;
  const outcomeSignals = override?.requiredOutcomeSignals ?? [];
  const outcomeHits = outcomeSignals.filter(signal => lower.includes(signal.toLowerCase()));
  const domainOutcome = outcomeSignals.length === 0
    ? /\b(eligible|ineligible|actionable|decision|recommend|resolved|applies|supported|blocked|approved|rejected)\b/i.test(source)
    : outcomeHits.length >= Math.min(2, outcomeSignals.length);
  const consumerSource = sourceForPaths(action?.consumerTestPaths ?? []);
  const consumerLower = consumerSource.toLowerCase();
  const consumerSignals = override?.requiredConsumerSignals ?? [];
  const slug = normalizeRelative(path.dirname(record.entrypoint ?? '')).split('/').at(-1) ?? '';
  const consumerBoundary = (action?.consumerTestPaths ?? []).length > 0
    && (consumerLower.includes(slug.toLowerCase()) || consumerSignals.some(signal => consumerLower.includes(signal.toLowerCase())))
    && /\b(import|require|spawn|fetch|workflow|consumer|decision)\b/i.test(consumerSource);
  const scaffoldSignalMap = {
    'MOD-SCAFFOLD-CONTRACTS': /unsafe|traversal|canonical|hash|reject/i,
    'MOD-SCAFFOLD-REGISTRY': /exact|version|duplicate|unknown|registry/i,
    'MOD-SCAFFOLD-PLANNER': /determin|collision|path|plan/i,
    'MOD-SCAFFOLD-RENDERER': /render|token|staging|hash|normalize/i,
    'MOD-SCAFFOLD-VALIDATOR': /tamper|missing|extra|hash|fail|invalid/i,
    'MOD-SCAFFOLD-RECEIPTS': /tamper|receipt|hash|evidence|atomic/i,
    'MOD-SCAFFOLD-APPLIER': /mkdtemp|tmpdir|create-only|rollback|collision|apply|snapshot/i,
    'MOD-SCAFFOLD-CLI': /spawn|process|status|non-zero|cli|apply/i,
    'MOD-SCAFFOLD-CATALOG': /catalog|manifest|load|missing|family/i
  };
  const scaffoldOperation = scaffoldSignalMap[record.id]?.test(source) ?? /scaffold/i.test(source);
  return {
    testPaths,
    lines,
    assertionCount,
    uniqueDataStrings,
    objectKeys,
    nonTrivialData,
    negativePath,
    mockSignals: mockMatches.length,
    domainOutcome,
    outcomeHits,
    consumerBoundary,
    scaffoldOperation
  };
}

function artifactHashValidation(artifacts) {
  const errors = [];
  for (const artifact of artifacts ?? []) {
    if (!artifact?.path || !artifact?.sha256) {
      errors.push('EVIDENCE_ARTIFACT_INVALID');
      continue;
    }
    const target = absolute(artifact.path);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      errors.push(`EVIDENCE_ARTIFACT_MISSING:${artifact.path}`);
      continue;
    }
    if (sha256File(target) !== artifact.sha256) errors.push(`EVIDENCE_ARTIFACT_STALE:${artifact.path}`);
  }
  return errors;
}

function loadFunctionalEvidence(record, area, policy) {
  const relative = `.forge21/functional-evidence/${record.id}/latest.json`;
  const file = absolute(relative);
  if (!fs.existsSync(file)) return { exists: false, valid: false, errors: ['FUNCTIONAL_EVIDENCE_MISSING'], relative };
  const evidence = readJson(file);
  const errors = [];
  if (evidence.schemaVersion !== 1) errors.push('FUNCTIONAL_EVIDENCE_SCHEMA_UNSUPPORTED');
  if (evidence.moduleId !== record.id) errors.push('FUNCTIONAL_EVIDENCE_MODULE_MISMATCH');
  if (evidence.area !== area) errors.push('FUNCTIONAL_EVIDENCE_AREA_MISMATCH');
  if (evidence.result !== 'PASS') errors.push('FUNCTIONAL_EVIDENCE_NOT_PASS');
  const requiredChecks = policy.requiredEvidenceChecks?.[area] ?? [];
  for (const check of requiredChecks) {
    if (evidence.checks?.[check] !== true) errors.push(`FUNCTIONAL_CHECK_MISSING:${check}`);
  }
  if (!Array.isArray(evidence.commands) || evidence.commands.length === 0) errors.push('FUNCTIONAL_COMMAND_EVIDENCE_MISSING');
  for (const command of evidence.commands ?? []) {
    if (command.status !== 0) errors.push(`FUNCTIONAL_COMMAND_NOT_PASS:${command.label ?? command.command ?? 'unknown'}`);
  }
  errors.push(...artifactHashValidation(evidence.artifacts));
  const head = currentHead();
  if (!evidence.sourceCommit || !isAncestor(evidence.sourceCommit, head)) errors.push('FUNCTIONAL_EVIDENCE_COMMIT_NOT_ANCESTOR');
  if (area === 'integrations') {
    const kind = evidence.environment?.kind;
    if (!['external-real', 'faithful-contract-fixture'].includes(kind)) errors.push('EXTERNAL_ENVIRONMENT_EVIDENCE_REQUIRED');
    if (kind === 'external-real' && !evidence.environment?.instanceFingerprint) errors.push('EXTERNAL_INSTANCE_FINGERPRINT_REQUIRED');
    if (kind === 'faithful-contract-fixture' && !evidence.environment?.contractArtifact) errors.push('CONTRACT_FIXTURE_ARTIFACT_REQUIRED');
  }
  if (area === 'productE2E') {
    if (!evidence.scenario?.id) errors.push('E2E_SCENARIO_ID_REQUIRED');
    if (!Array.isArray(evidence.scenario?.actions) || evidence.scenario.actions.length < 3) errors.push('E2E_MINIMUM_THREE_ACTIONS_REQUIRED');
    if (!Array.isArray(evidence.scenario?.manualSteps) || evidence.scenario.manualSteps.length !== 0) errors.push('E2E_HIDDEN_MANUAL_STEPS');
  }
  return { exists: true, valid: errors.length === 0, errors, relative, evidence };
}

function moduleFilesExist(record) {
  const required = [record.entrypoint, ...(record.tests ?? []), ...(record.governanceInputs ?? [])].filter(Boolean);
  const missing = required.filter(relative => !existsFile(relative));
  return { pass: missing.length === 0, missing };
}

function evaluateModule(record, inputs) {
  const area = classifyModule(record, inputs.policy);
  const override = inputs.policy.moduleOverrides?.[record.id] ?? {};
  const action = inputs.actions.modules?.[record.id] ?? {};
  const files = moduleFilesExist(record);
  const receipt = loadReceipt(record);
  const tests = testAnalysis(record, override, action);
  const evidence = loadFunctionalEvidence(record, area, inputs.policy);
  const structuralPass = files.pass && receipt.current;
  let functionalPass = false;
  const reasons = [];

  if (!files.pass) reasons.push(...files.missing.map(value => `MISSING_FILE:${value}`));
  if (!receipt.current) reasons.push(...receipt.errors);

  if (area === 'scaffolds') {
    functionalPass = structuralPass
      && tests.negativePath
      && tests.assertionCount >= 2
      && tests.lines >= 25
      && tests.scaffoldOperation;
    if (!tests.negativePath) reasons.push('A2_NEGATIVE_PATH_MISSING');
    if (tests.assertionCount < 2) reasons.push('A2_ASSERTIONS_INSUFFICIENT');
    if (tests.lines < 25) reasons.push('A2_TEST_DEPTH_INSUFFICIENT');
    if (!tests.scaffoldOperation) reasons.push('A2_OPERATION_SPECIFIC_TEST_MISSING');
  } else if (area === 'runtime') {
    functionalPass = structuralPass
      && evidence.valid
      && tests.nonTrivialData
      && tests.negativePath
      && tests.mockSignals === 0
      && tests.domainOutcome
      && tests.consumerBoundary;
    if (!tests.nonTrivialData) reasons.push('A3_NON_TRIVIAL_FLOW_NOT_DETECTED');
    if (!tests.domainOutcome) reasons.push('A3_DOMAIN_OUTCOME_NOT_DETECTED');
    if (!tests.negativePath) reasons.push('A3_NEGATIVE_PATH_MISSING');
    if (tests.mockSignals > 0) reasons.push(`A3_CRITICAL_MOCK_SIGNALS:${tests.mockSignals}`);
    if (!tests.consumerBoundary) reasons.push('A3_CONSUMER_BOUNDARY_MISSING');
    if (!evidence.valid) reasons.push(...evidence.errors);
  } else if (area === 'integrations' || area === 'productE2E') {
    functionalPass = structuralPass && evidence.valid;
    if (!evidence.valid) reasons.push(...evidence.errors);
  } else {
    functionalPass = structuralPass;
  }

  const falseGreen = receipt.pass && !functionalPass;
  return {
    id: record.id,
    title: record.title ?? record.id,
    area,
    priority: Number(override.priority ?? 0),
    dependencies: record.dependencies ?? [],
    structuralPass,
    functionalPass,
    falseGreen,
    files,
    receipt,
    tests,
    evidence,
    reasons: [...new Set(reasons)]
  };
}

function areaEvaluation(area, modules, architecture, policy) {
  if (area === 'architecture') {
    return {
      area,
      label: policy.areaLabels[area],
      weight: policy.weights[area],
      moduleCount: 0,
      structuralComplete: architecture.checks.filter(check => check.pass).length,
      functionalComplete: architecture.checks.filter(check => check.pass).length,
      denominator: architecture.checks.length,
      structuralPercent: architecture.structuralPercent,
      functionalPercent: architecture.functionalPercent,
      absenceReason: null
    };
  }

  const records = modules.filter(module => module.area === area);
  const denominator = records.length;
  const structuralComplete = records.filter(module => module.structuralPass).length;
  const functionalComplete = records.filter(module => module.functionalPass).length;
  return {
    area,
    label: policy.areaLabels[area],
    weight: policy.weights[area],
    moduleCount: records.length,
    structuralComplete,
    functionalComplete,
    denominator,
    structuralPercent: denominator ? (structuralComplete / denominator) * 100 : 0,
    functionalPercent: denominator ? (functionalComplete / denominator) * 100 : 0,
    absenceReason: denominator === 0 && ['runtime', 'integrations', 'productE2E'].includes(area)
      ? 'REQUIRED_CAPABILITY_AREA_HAS_NO_DECLARED_MODULES'
      : null
  };
}

function recommendation(modules, areas, policy) {
  for (const area of policy.priorityOrder) {
    if (!['runtime', 'integrations', 'productE2E'].includes(area)) continue;
    const candidates = modules
      .filter(module => module.area === area && !module.functionalPass)
      .sort((left, right) => right.priority - left.priority
        || Number(right.structuralPass) - Number(left.structuralPass)
        || left.id.localeCompare(right.id));
    if (candidates.length > 0) {
      const selected = candidates[0];
      return {
        type: 'MODULE',
        moduleId: selected.id,
        area,
        reason: selected.falseGreen
          ? 'PASS_ESTRUCTURAL_SIN_COMPLETITUD_FUNCIONAL'
          : 'AREA_PRIORITARIA_CON_MODULO_INCOMPLETO',
        blockers: selected.reasons
      };
    }
  }
  for (const area of ['runtime', 'integrations', 'productE2E']) {
    const summary = areas.find(value => value.area === area);
    if (summary?.denominator === 0) {
      return {
        type: 'DECLARE_MODULE',
        moduleId: null,
        area,
        reason: summary.absenceReason,
        blockers: ['No existe módulo declarado para esta capacidad obligatoria.']
      };
    }
  }
  return { type: 'NONE', moduleId: null, area: null, reason: 'ALL_FUNCTIONAL_TARGETS_COMPLETE', blockers: [] };
}

function buildAudit(inputs) {
  const architecture = architectureEvaluation(inputs);
  const modules = inputs.manifest.modules.map(record => evaluateModule(record, inputs));
  const areaOrder = ['architecture', 'scaffolds', 'runtime', 'integrations', 'productE2E'];
  const areas = areaOrder.map(area => areaEvaluation(area, modules, architecture, inputs.policy));
  const globalStructural = areas.reduce((sum, area) => sum + (area.structuralPercent / 100) * area.weight, 0) * 100;
  const globalFunctional = areas.reduce((sum, area) => sum + (area.functionalPercent / 100) * area.weight, 0) * 100;
  const blocker = [...areas]
    .sort((left, right) => (right.weight * (1 - right.functionalPercent / 100)) - (left.weight * (1 - left.functionalPercent / 100)))[0];
  const next = recommendation(modules, areas, inputs.policy);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repositoryRoot: root,
    head: currentHead(),
    branch: currentBranch(),
    weights: inputs.policy.weights,
    architecture,
    modules,
    areas,
    globalStructuralPercent: globalStructural,
    globalFunctionalPercent: globalFunctional,
    blockingArea: {
      area: blocker.area,
      label: blocker.label,
      weightedGap: blocker.weight * (1 - blocker.functionalPercent / 100) * 100
    },
    falseGreens: modules.filter(module => module.falseGreen).map(module => ({
      moduleId: module.id,
      area: module.area,
      reasons: module.reasons
    })),
    recommendation: next
  };
}

function percent(value) {
  return `${value.toFixed(1)}%`;
}

function markdownReport(audit) {
  const lines = [];
  lines.push('# Forge OS V2 — Functional Autopilot Report');
  lines.push('');
  lines.push(`- Generated: ${audit.generatedAt}`);
  lines.push(`- Branch: \`${audit.branch}\``);
  lines.push(`- HEAD: \`${audit.head}\``);
  lines.push(`- Structural weighted progress: **${percent(audit.globalStructuralPercent)}**`);
  lines.push(`- Real functional weighted progress: **${percent(audit.globalFunctionalPercent)}**`);
  lines.push(`- Main blocker: **${audit.blockingArea.label}** (weighted gap ${audit.blockingArea.weightedGap.toFixed(1)} points)`);
  lines.push('');
  lines.push('## Progress by area');
  lines.push('');
  lines.push('| Area | Weight | Structural | Functional real | Complete |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const area of audit.areas) {
    lines.push(`| ${area.label} | ${(area.weight * 100).toFixed(0)}% | ${percent(area.structuralPercent)} | ${percent(area.functionalPercent)} | ${area.functionalComplete}/${area.denominator} |`);
  }
  lines.push('');
  lines.push('## False greens');
  lines.push('');
  if (audit.falseGreens.length === 0) lines.push('None detected.');
  for (const item of audit.falseGreens) {
    lines.push(`- \`${item.moduleId}\` (${item.area}): ${item.reasons.join('; ')}`);
  }
  lines.push('');
  lines.push('## Next recommendation');
  lines.push('');
  if (audit.recommendation.type === 'MODULE') {
    lines.push(`Work next on **\`${audit.recommendation.moduleId}\`** in **${audit.recommendation.area}**.`);
    lines.push(`Reason: ${audit.recommendation.reason}.`);
    lines.push(`Blocking checks: ${audit.recommendation.blockers.join('; ') || 'none'}.`);
  } else if (audit.recommendation.type === 'DECLARE_MODULE') {
    lines.push(`Declare the first module for **${audit.recommendation.area}** before progress can be credited.`);
  } else {
    lines.push('All declared functional targets are complete.');
  }
  lines.push('');
  lines.push('## Module detail');
  lines.push('');
  for (const module of audit.modules) {
    lines.push(`### ${module.id}`);
    lines.push(`- Area: ${module.area}`);
    lines.push(`- Receipt PASS: ${module.receipt.pass ? 'YES' : 'NO'}`);
    lines.push(`- Receipt current: ${module.receipt.current ? 'YES' : 'NO'}`);
    lines.push(`- Structural PASS: ${module.structuralPass ? 'YES' : 'NO'}`);
    lines.push(`- Functional real PASS: ${module.functionalPass ? 'YES' : 'NO'}`);
    lines.push(`- False green: ${module.falseGreen ? 'YES' : 'NO'}`);
    if (module.reasons.length > 0) lines.push(`- Blockers: ${module.reasons.join('; ')}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function persistReport(audit) {
  const directory = absolute('.forge21/autopilot/reports');
  const stamp = nowStamp();
  const json = path.join(directory, `${stamp}.json`);
  const markdown = path.join(directory, `${stamp}.md`);
  const latestJson = path.join(directory, 'latest.json');
  const latestMarkdown = path.join(directory, 'latest.md');
  writeJsonAtomic(json, audit);
  writeJsonAtomic(latestJson, audit);
  const report = markdownReport(audit);
  writeTextAtomic(markdown, report);
  writeTextAtomic(latestMarkdown, report);
  return {
    json: normalizeRelative(path.relative(root, json)),
    markdown: normalizeRelative(path.relative(root, markdown)),
    latestJson: normalizeRelative(path.relative(root, latestJson)),
    latestMarkdown: normalizeRelative(path.relative(root, latestMarkdown))
  };
}

function printAudit(audit, reportPaths = null) {
  console.log('============================================================');
  console.log('FORGE OS V2 — FUNCTIONAL AUTOPILOT');
  console.log('============================================================');
  for (const area of audit.areas) {
    console.log(`AREA=${area.area}`);
    console.log(`AREA_LABEL=${area.label}`);
    console.log(`AREA_WEIGHT=${(area.weight * 100).toFixed(0)}`);
    console.log(`STRUCTURAL_PROGRESS=${percent(area.structuralPercent)}`);
    console.log(`FUNCTIONAL_REAL_PROGRESS=${percent(area.functionalPercent)}`);
    console.log(`FUNCTIONAL_COMPLETE=${area.functionalComplete}/${area.denominator}`);
    if (area.absenceReason) console.log(`AREA_WARNING=${area.absenceReason}`);
    console.log('---');
  }
  console.log(`GLOBAL_STRUCTURAL=${percent(audit.globalStructuralPercent)}`);
  console.log(`GLOBAL_FUNCTIONAL_REAL=${percent(audit.globalFunctionalPercent)}`);
  console.log(`BLOCKING_AREA=${audit.blockingArea.area}`);
  console.log(`BLOCKING_AREA_LABEL=${audit.blockingArea.label}`);
  console.log(`FALSE_GREEN_COUNT=${audit.falseGreens.length}`);
  for (const item of audit.falseGreens) {
    console.log(`FALSE_GREEN=${item.moduleId}|${item.area}|${item.reasons.join(',')}`);
  }
  console.log(`NEXT_TYPE=${audit.recommendation.type}`);
  console.log(`NEXT_MODULE=${audit.recommendation.moduleId ?? 'NONE'}`);
  console.log(`NEXT_AREA=${audit.recommendation.area ?? 'NONE'}`);
  console.log(`NEXT_REASON=${audit.recommendation.reason}`);
  if (reportPaths) {
    console.log(`REPORT_JSON=${reportPaths.latestJson}`);
    console.log(`REPORT_MD=${reportPaths.latestMarkdown}`);
  }
}

function criteriaText(policy) {
  return `Forge OS V2 functional completion criteria\n\nAREA 1 — Architecture\nA1-01 Registry RATIFIED / ACTIVE.\nA1-02 Active Constitution exists.\nA1-03 ADR inventory is non-empty.\nA1-04 registered Master Build Tree exists.\nA1-05 every registered authority path resolves.\nA1-06 manifest is unique, acyclic and every governance input resolves.\n\nAREA 2 — Scaffolds\nA2-01 manifest/files/exports are structurally valid.\nA2-02 dependency graph resolves.\nA2-03 focused tests exist.\nA2-04 receipt PASS hashes current files.\nA2-05 negative path is asserted.\nA2-06 module-specific operation is exercised, not schema only.\nA2-07 full suite passes.\nA2-08 forge doctor passes.\nA2-09 module validation passes.\n\nAREA 3 — Runtime\n${policy.requiredEvidenceChecks.runtime.map(value => `- ${value}`).join('\n')}\nA contract-only producer is not complete without a real consumer boundary.\n\nAREA 4 — Integrations\n${policy.requiredEvidenceChecks.integrations.map(value => `- ${value}`).join('\n')}\nExternal evidence must be external-real or a faithful contract fixture; always-success mocks do not count.\n\nAREA 5 — Product E2E\n${policy.requiredEvidenceChecks.productE2E.map(value => `- ${value}`).join('\n')}\nA passing E2E run requires at least three user actions and manualSteps=[].\n`;
}

function snapshot(moduleId) {
  const tracked = git(['ls-files', '-z']).stdout.split('\0').filter(Boolean);
  const files = {};
  for (const relative of tracked) {
    const target = absolute(relative);
    if (fs.existsSync(target) && fs.statSync(target).isFile()) files[normalizeRelative(relative)] = sha256File(target);
  }
  const value = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    moduleId,
    branch: currentBranch(),
    head: currentHead(),
    status: relevantStatusEntries(),
    manifestHash: sha256File(manifestPath),
    registryHash: sha256File(registryPath),
    trackedFileHashes: files
  };
  const file = absolute(`.forge21/autopilot/snapshots/${nowStamp()}-${moduleId}.json`);
  writeJsonAtomic(file, value);
  console.log(`SNAPSHOT=${normalizeRelative(path.relative(root, file))}`);
  return value;
}

function pathAllowed(file, allowedRoots) {
  return allowedRoots.some(allowed => {
    const normalized = normalizeRelative(allowed).replace(/\/$/, '');
    return file === normalized || file.startsWith(`${normalized}/`);
  });
}

function auditChangedRoutes(moduleId, action, policy) {
  const entries = relevantStatusEntries();
  if (entries.length === 0) throw new AutopilotError('IMPLEMENTATION_PRODUCED_NO_CHANGES', moduleId);
  const allowedRoots = action.changedPaths ?? [];
  if (allowedRoots.length === 0) throw new AutopilotError('CHANGED_PATH_ALLOWLIST_REQUIRED', moduleId);
  const forbidden = (policy.forbiddenChangedPathPatterns ?? []).map(pattern => new RegExp(pattern, 'i'));
  const errors = [];
  for (const { file } of entries) {
    if (!pathAllowed(file, allowedRoots)) errors.push(`CHANGED_PATH_NOT_ALLOWED:${file}`);
    if (forbidden.some(pattern => pattern.test(file))) errors.push(`FORBIDDEN_CHANGED_PATH:${file}`);
  }
  if (errors.length > 0) throw new AutopilotError('ROUTE_AUDIT_FAILED', errors.join(','));
  runStrict('git diff --check', { label: 'AUDIT_DIFF_CHECK' });
  console.log(`CHANGED_PATHS=${entries.map(entry => entry.file).join(',')}`);
  return entries;
}

function createFunctionalEvidence(record, area, analysis, action, commandResult) {
  const artifactPaths = [...new Set([
    record.entrypoint,
    ...(record.tests ?? []),
    ...(action.consumerTestPaths ?? []),
    ...(action.evidence?.artifactPaths ?? [])
  ].filter(Boolean))];
  const artifacts = artifactPaths.map(relative => {
    if (!existsFile(relative)) throw new AutopilotError('FUNCTIONAL_ARTIFACT_MISSING', relative);
    return { path: relative, sha256: sha256File(absolute(relative)) };
  });

  let checks = {};
  if (area === 'runtime') {
    checks = {
      nonTrivialDomainFlow: analysis.nonTrivialData,
      domainOutcome: analysis.domainOutcome,
      negativePath: analysis.negativePath,
      criticalPathNoMock: analysis.mockSignals === 0,
      consumerBoundary: analysis.consumerBoundary,
      freshArtifacts: true
    };
  } else {
    checks = { ...(action.evidence?.checks ?? {}), freshArtifacts: true };
  }

  const evidence = {
    schemaVersion: 1,
    moduleId: record.id,
    area,
    result: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
    recordedAt: new Date().toISOString(),
    sourceCommit: currentHead(),
    checks,
    commands: [{
      command: commandResult.command,
      label: commandResult.label,
      status: commandResult.status
    }],
    artifacts,
    environment: action.evidence?.environment ?? { kind: 'local-real', runtime: `node ${process.version}`, platform: `${os.platform()}-${os.arch()}` },
    scenario: action.evidence?.scenario ?? null
  };
  const directory = absolute(`.forge21/functional-evidence/${record.id}`);
  const stamp = nowStamp();
  writeJsonAtomic(path.join(directory, `${stamp}.json`), evidence);
  writeJsonAtomic(path.join(directory, 'latest.json'), evidence);
  if (evidence.result !== 'PASS') {
    const failed = Object.entries(checks).filter(([, value]) => value !== true).map(([name]) => name);
    throw new AutopilotError('FUNCTIONAL_EVIDENCE_CHECK_FAILED', failed.join(','));
  }
  console.log(`FUNCTIONAL_EVIDENCE=.forge21/functional-evidence/${record.id}/latest.json`);
  return evidence;
}

function ensureRepoReadyForRun() {
  git(['rev-parse', '--is-inside-work-tree']);
  currentBranch();
  git(['remote', 'get-url', 'origin']);
  const dirty = relevantStatusEntries();
  if (dirty.length > 0) throw new AutopilotError('WORKTREE_NOT_CLEAN', dirty.map(entry => entry.file).join(','));
}

function selectRecord(moduleId, audit, inputs) {
  const selectedId = moduleId ?? audit.recommendation.moduleId;
  if (!selectedId) throw new AutopilotError('NO_RUNNABLE_MODULE_RECOMMENDED', audit.recommendation.reason);
  const record = inputs.manifest.modules.find(value => value.id === selectedId);
  if (!record) throw new AutopilotError('UNKNOWN_MODULE', selectedId);
  return record;
}

function focusedTestCommand(record) {
  return `${shellQuote(process.execPath)} --test ${(record.tests ?? []).map(shellQuote).join(' ')}`;
}

function commitAndPush(record, action) {
  const changed = relevantStatusEntries().map(entry => entry.file);
  if (changed.length === 0) throw new AutopilotError('NOTHING_TO_STAGE', record.id);
  runStrict(`git add -- ${changed.map(shellQuote).join(' ')}`, { label: 'STAGE_EXACT_CHANGED_PATHS' });
  const staged = git(['diff', '--cached', '--name-only', '-z']).stdout.split('\0').filter(Boolean).map(normalizeRelative);
  const expected = [...new Set(changed)].sort();
  const actual = [...new Set(staged)].sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new AutopilotError('STAGED_PATH_MISMATCH', `expected=${expected.join(',')};actual=${actual.join(',')}`);
  }
  runStrict('git diff --cached --check', { label: 'STAGED_DIFF_CHECK' });
  const branch = currentBranch();
  runStrict(`git push --dry-run origin HEAD:${shellQuote(branch)}`, { label: 'PUSH_DRY_RUN' });
  const parent = currentHead();
  const message = action.commitMessage || `feat(${record.id.toLowerCase()}): complete functional implementation`;
  runStrict(`git commit -m ${shellQuote(message)}`, { label: 'COMMIT' });
  const commit = currentHead();
  try {
    runStrict(`git push origin HEAD:${shellQuote(branch)}`, { label: 'PUSH' });
  } catch (error) {
    console.error(`PUSH_ROLLBACK_FROM=${commit}`);
    console.error(`PUSH_ROLLBACK_TO=${parent}`);
    runStrict(`git reset --soft ${shellQuote(parent)}`, { label: 'ROLLBACK_LOCAL_COMMIT' });
    runStrict('git reset', { label: 'UNSTAGE_AFTER_PUSH_FAILURE' });
    throw error;
  }
  return { parent, commit, branch };
}

async function runCycle(moduleId, flags) {
  const inputs = loadInputs();
  const initialAudit = buildAudit(inputs);
  const record = selectRecord(moduleId, initialAudit, inputs);
  const area = classifyModule(record, inputs.policy);
  const action = inputs.actions.modules?.[record.id] ?? {};
  const override = inputs.policy.moduleOverrides?.[record.id] ?? {};
  const implementationCommand = flags.get('implementation-command')
    || process.env.FORGE_AUTOPILOT_IMPLEMENT_COMMAND
    || action.implementationCommand;
  const functionalTestCommand = flags.get('functional-test-command')
    || process.env.FORGE_AUTOPILOT_FUNCTIONAL_TEST_COMMAND
    || action.functionalTestCommand;

  ensureRepoReadyForRun();
  snapshot(record.id);

  if (!implementationCommand) throw new AutopilotError('IMPLEMENTATION_COMMAND_REQUIRED', record.id);
  runStrict(implementationCommand, {
    label: `IMPLEMENTATION:${record.id}`,
    env: { FORGE_MODULE_ID: record.id, FORGE_REPO_ROOT: root }
  });
  auditChangedRoutes(record.id, action, inputs.policy);

  runStrict(focusedTestCommand(record), { label: `FOCUSED_TESTS:${record.id}` });
  runStrict('npm test', { label: 'FULL_SUITE' });
  runStrict('bash tools/forge doctor', { label: 'FORGE_DOCTOR' });
  runStrict(`bash tools/forge validate ${shellQuote(record.id)}`, { label: `MODULE_VALIDATION:${record.id}` });

  if (['runtime', 'integrations', 'productE2E'].includes(area)) {
    if (!functionalTestCommand) throw new AutopilotError('FUNCTIONAL_TEST_COMMAND_REQUIRED', record.id);
    const functionalResult = runStrict(functionalTestCommand, {
      label: `FUNCTIONAL_TEST:${record.id}`,
      capture: true,
      env: { FORGE_MODULE_ID: record.id, FORGE_REPO_ROOT: root }
    });
    const analysis = testAnalysis(record, override, action);
    createFunctionalEvidence(record, area, analysis, action, functionalResult);
  }

  auditChangedRoutes(record.id, action, inputs.policy);
  const postValidationInputs = loadInputs();
  const moduleEvaluation = evaluateModule(record, postValidationInputs);
  if (!moduleEvaluation.functionalPass) {
    throw new AutopilotError('FUNCTIONAL_COMPLETION_GATE_FAILED', moduleEvaluation.reasons.join(','));
  }

  const delivery = commitAndPush(record, action);
  const finalAudit = buildAudit(loadInputs());
  const reportPaths = persistReport(finalAudit);
  printAudit(finalAudit, reportPaths);
  console.log(`DELIVERED_MODULE=${record.id}`);
  console.log(`DELIVERED_COMMIT=${delivery.commit}`);
  console.log(`DELIVERED_BRANCH=${delivery.branch}`);
}

function usage() {
  console.log(`Forge OS V2 Functional Autopilot\n\nUsage:\n  tools/forge-autopilot audit\n  tools/forge-autopilot recommend\n  tools/forge-autopilot criteria\n  tools/forge-autopilot run [MODULE_ID] [--implementation-command CMD] [--functional-test-command CMD]\n\nThe run command is fail-closed. It never invents implementation logic: it executes an explicit implementation hook, verifies functional evidence, stages exact allowed routes, commits, pushes, and rolls back the local commit if push fails.`);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0] ?? 'audit';
  if (command === 'audit' || command === 'recommend') {
    const audit = buildAudit(loadInputs());
    const reportPaths = persistReport(audit);
    printAudit(audit, reportPaths);
    return;
  }
  if (command === 'criteria') {
    const inputs = loadInputs();
    process.stdout.write(criteriaText(inputs.policy));
    return;
  }
  if (command === 'run') {
    await runCycle(positional[1], flags);
    return;
  }
  if (command === 'help' || command === '--help' || command === '-h') {
    usage();
    return;
  }
  throw new AutopilotError('UNKNOWN_COMMAND', command);
}

main().catch(error => {
  const code = error instanceof AutopilotError ? error.code : 'UNEXPECTED_ERROR';
  console.error(`AUTOPILOT_RESULT=FAIL`);
  console.error(`AUTOPILOT_ERROR_CODE=${code}`);
  console.error(`AUTOPILOT_ERROR=${error.message}`);
  process.exitCode = 1;
});
