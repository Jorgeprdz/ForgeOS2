#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import {
  evaluatePromotionGate,
  PROMOTION_GATE_ID
} from '../../../governance/runtime/promotion-gate.mjs';

const root = process.cwd();
const moduleId = process.argv[2] || '';
const targetState = process.argv[3] || '';

function fail(message, code = 1) {
  console.error(`FORGE_BUILD_GATE_ERROR ${message}`);
  process.exit(code);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8'
  }).trim();
}

function stateRoot() {
  const configured = process.env.FORGE_BUILD_STATE_ROOT || '.forge/build';
  return path.isAbsolute(configured)
    ? configured
    : path.join(root, configured);
}

function currentBranch() {
  if (
    process.env.FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS === '1'
  ) {
    const branch = process.env.FORGE_BUILD_TEST_BRANCH_OVERRIDE || '';
    if (!branch) {
      fail('TEST_BRANCH_OVERRIDE_EMPTY');
    }
    return branch;
  }

  return git(['branch', '--show-current']);
}

function testOverride(name, derived) {
  if (
    process.env.FORGE_BUILD_GATE_ENABLE_OVERRIDES_FOR_TESTS !== '1'
  ) {
    return derived;
  }

  const value = process.env[name];

  if (value === undefined) {
    return derived;
  }

  if (value === '1' || value === 'true') {
    return true;
  }

  if (value === '0' || value === 'false') {
    return false;
  }

  fail(`INVALID_TEST_OVERRIDE:${name}`);
}

function changedPaths() {
  const output = git(['status', '--porcelain=v1']);

  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((line) => line.slice(3).trim())
    .map((entry) => {
      const renameSeparator = ' -> ';
      return entry.includes(renameSeparator)
        ? entry.split(renameSeparator).at(-1)
        : entry;
    })
    .filter(Boolean);
}

function pathMatchesRoot(file, configuredRoot) {
  const normalizedFile = file.replaceAll('\\', '/');
  const normalizedRoot = configuredRoot
    .replaceAll('\\', '/')
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '');

  return (
    normalizedFile === normalizedRoot ||
    normalizedFile.startsWith(`${normalizedRoot}/`)
  );
}

function authorizedPathsOnly(stage, id) {
  const changed = changedPaths();

  if (changed.length === 0) {
    return true;
  }

  const integrationRoots = {
    'MOD-GOVERNANCE-GATE': [
      'governance',
      'scaffolds/contracts',
      'scaffolds/validation',
      'tools/termux/build',
      'tools/run-tests.mjs'
    ]
  };

  const allowed = [
    ...(Array.isArray(stage?.allowed_paths) ? stage.allowed_paths : []),
    ...(integrationRoots[id] || [])
  ];

  const prohibited = Array.isArray(stage?.prohibited_paths)
    ? stage.prohibited_paths
    : [];

  return changed.every((file) => {
    const explicitlyProhibited = prohibited.some((entry) =>
      pathMatchesRoot(file, entry)
    );

    if (explicitlyProhibited) {
      return false;
    }

    return allowed.some((entry) => pathMatchesRoot(file, entry));
  });
}

function validationReceiptPass(id, head) {
  const receipt = path.join(
    stateRoot(),
    'validation',
    `${id.replaceAll('/', '_')}.json`
  );

  if (!fs.existsSync(receipt)) {
    return false;
  }

  try {
    const payload = readJson(receipt);

    return (
      payload.module_id === id &&
      payload.status === 'PASS' &&
      payload.head === head
    );
  } catch {
    return false;
  }
}

function evidencePresent(id, stageId, head) {
  const canonicalEvidence = stageId
    ? path.join(root, 'scaffolds/reports', `${stageId}-evidence.json`)
    : '';

  const buildEvidence = path.join(
    stateRoot(),
    'evidence',
    `${id.replaceAll('/', '_')}.json`
  );

  const canonicalPresent =
    canonicalEvidence !== '' && fs.existsSync(canonicalEvidence);

  if (targetState === 'implementation_started') {
    return canonicalPresent;
  }

  if (!fs.existsSync(buildEvidence)) {
    return false;
  }

  try {
    const payload = readJson(buildEvidence);

    return (
      canonicalPresent &&
      payload.module_id === id &&
      payload.head === head
    );
  } catch {
    return false;
  }
}

if (!moduleId) {
  fail('MODULE_REQUIRED');
}

if (
  !['implementation_started', 'integration_pass'].includes(targetState)
) {
  fail(`UNPROTECTED_TARGET:${targetState}`);
}

const buildOrder = readJson(
  path.join(root, 'scaffolds/manifest/build-order.json')
);

const stagesDocument = readJson(
  path.join(root, 'scaffolds/manifest/rewrite-stages.json')
);

const moduleRecord = (buildOrder.modules || []).find(
  (item) => item.module_id === moduleId
);

if (!moduleRecord) {
  fail(`MODULE_NOT_FOUND:${moduleId}`);
}

const stage = (stagesDocument.stages || []).find(
  (item) => item.id === moduleRecord.stage_id
);

if (!stage) {
  fail(`STAGE_NOT_FOUND:${moduleRecord.stage_id || 'none'}`);
}

const branch = currentBranch();
const head = git(['rev-parse', 'HEAD']);

const payload = {
  stage: stage.id,
  branch,
  main_allowed: false,
  validations_passed: testOverride(
    'FORGE_BUILD_GATE_VALIDATIONS_PASSED_FOR_TESTS',
    validationReceiptPass(moduleId, head)
  ),
  evidence_present: testOverride(
    'FORGE_BUILD_GATE_EVIDENCE_PRESENT_FOR_TESTS',
    evidencePresent(moduleId, stage.id, head)
  ),
  authorized_paths_only: testOverride(
    'FORGE_BUILD_GATE_AUTHORIZED_PATHS_ONLY_FOR_TESTS',
    authorizedPathsOnly(stage, moduleId)
  )
};

const result = evaluatePromotionGate(payload);

console.log(`FORGE_BUILD_PROMOTION_GATE=${result.decision}`);
console.log(`PROMOTION_GATE_ID=${PROMOTION_GATE_ID}`);
console.log(`PROMOTION_GATE_MODULE=${moduleId}`);
console.log(`PROMOTION_GATE_STAGE=${stage.id}`);
console.log(`PROMOTION_GATE_TARGET=${targetState}`);
console.log(`PROMOTION_GATE_BRANCH=${branch}`);
console.log(
  `PROMOTION_GATE_VIOLATIONS=${result.violations.join(',') || 'none'}`
);

if (result.decision !== 'PASS') {
  process.exit(2);
}
