import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  createScaffoldRegistry
} from '../scaffold-registry/index.mjs';

import {
  buildScaffoldPlan
} from '../scaffold-planner/index.mjs';

import {
  removeStagingDirectory,
  renderScaffoldInMemory,
  stageRenderedScaffold
} from '../scaffold-renderer/index.mjs';

import {
  ScaffoldValidationError,
  assertValidationReportPass,
  hashStagingDirectory,
  validateRenderedScaffoldBundle,
  verifyValidationReportHash
} from './index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = name => path.join(here, 'fixtures', name);
const read = name => fs.readFileSync(fixturePath(name), 'utf8');
const readJson = name => JSON.parse(read(name));

const registryValue = readJson('registry.json');
const inputData = readJson('input.json');
const templateText = read('architecture-boundary.template.md');
const registry = createScaffoldRegistry(registryValue);
const definition = registry.resolve(
  'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0'
);
const repositorySnapshot = '9'.repeat(64);

function makeRoots() {
  const base = fs.mkdtempSync(
    path.join(os.tmpdir(), 'forge-wave4-validator-')
  );
  const repositoryRoot = path.join(base, 'repo');
  const stagingParent = path.join(base, 'staging');
  fs.mkdirSync(repositoryRoot);
  fs.mkdirSync(stagingParent);
  return { base, repositoryRoot, stagingParent };
}

function buildBundle(roots, overrides = {}) {
  const plan = buildScaffoldPlan({
    registry: registryValue,
    scaffoldReference:
      'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
    input: {
      path: '.forge21/scaffold-inputs/client-truth.json',
      data: structuredClone(inputData),
      sha256: sha256Canonical(inputData),
      schemaSha256: definition.inputSchema.sha256,
      validation: { pass: true, errors: [] }
    },
    authoritySnapshot: {
      gateId: definition.authority.gateId,
      ratified: true,
      sha256: definition.authority.snapshotSha256
    },
    sourceRef:
      '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
    registrySha256: registry.hash,
    destinationInventory: {},
    runId: '20260724T010000Z-WAVE4',
    planId: 'SPLAN-WAVE4',
    createdAt: '2026-07-24T01:00:00Z'
  });

  const renderResult = renderScaffoldInMemory({
    plan,
    registry: registryValue,
    registrySha256: registry.hash,
    inputData,
    templateText
  });

  const staged = stageRenderedScaffold({
    renderResult,
    stagingParent: roots.stagingParent,
    repositoryRoot: roots.repositoryRoot
  });

  return {
    renderResult,
    staged,
    args: {
      reportId: 'SVRPT-WAVE4',
      createdAt: '2026-07-24T01:00:05Z',
      renderResult,
      stagingDirectory: staged.stagingDirectory,
      registry: registryValue,
      registrySha256: registry.hash,
      inputData,
      templateText,
      repositoryRoot: roots.repositoryRoot,
      upstreamValidations: [
        {
          id: 'SCV-001',
          status: 'PASS',
          evidence: ['constitutionalGate=COMPLETE']
        },
        {
          id: 'SCV-006',
          status: 'PASS',
          evidence: ['inputSchemaValidation=PASS']
        }
      ],
      sideEffectSnapshot: {
        repositoryBefore: repositorySnapshot,
        repositoryAfter: repositorySnapshot,
        repositoryWrites: false,
        gitOperations: false,
        networkOperations: false,
        providerOperations: false
      },
      ...overrides
    }
  };
}

test('creates a passing pre-apply validation report', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    const report = validateRenderedScaffoldBundle(bundle.args);

    assert.equal(report.status, 'PASS');
    assert.deepEqual(report.errors, []);
    assert.equal(report.phase, 'PRE_APPLY');
    assert.match(report.reportSha256, /^[a-f0-9]{64}$/);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('report includes Wave 5 deferred checks', () => {
  const roots = makeRoots();

  try {
    const report = validateRenderedScaffoldBundle(
      buildBundle(roots).args
    );

    assert.deepEqual(
      report.deferredValidations,
      ['SCV-018', 'SCV-020', 'SCV-023']
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('report covers every required plan validation', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    const report = validateRenderedScaffoldBundle(bundle.args);
    const ids = new Set(report.validations.map(item => item.id));

    for (
      const id of
      bundle.renderResult.renderedPlan.requiredValidations
    ) {
      assert.equal(ids.has(id), true, id);
    }
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('verifies validation report hash', () => {
  const roots = makeRoots();

  try {
    const report = validateRenderedScaffoldBundle(
      buildBundle(roots).args
    );
    assert.equal(verifyValidationReportHash(report), true);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('detects a tampered validation report', () => {
  const roots = makeRoots();

  try {
    const report = structuredClone(
      validateRenderedScaffoldBundle(
        buildBundle(roots).args
      )
    );
    report.sourceRef = 'tampered';

    assert.throws(
      () => verifyValidationReportHash(report),
      error =>
        error instanceof ScaffoldValidationError &&
        error.code === 'VALIDATION_REPORT_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('assert pass accepts a clean report', () => {
  const roots = makeRoots();

  try {
    const report = validateRenderedScaffoldBundle(
      buildBundle(roots).args
    );
    assert.equal(assertValidationReportPass(report).status, 'PASS');
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when constitutional gate evidence is missing', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      upstreamValidations: [
        {
          id: 'SCV-006',
          status: 'PASS',
          evidence: ['inputSchemaValidation=PASS']
        }
      ]
    });

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.errors.some(
        error =>
          error.includes(
            'SCV-001:REQUIRED_VALIDATION_EVIDENCE_MISSING'
          )
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when input-schema validation evidence is missing', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      upstreamValidations: [
        {
          id: 'SCV-001',
          status: 'PASS',
          evidence: ['constitutionalGate=COMPLETE']
        }
      ]
    });

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.errors.some(
        error =>
          error.includes(
            'SCV-006:REQUIRED_VALIDATION_EVIDENCE_MISSING'
          )
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects non-PASS upstream evidence', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      upstreamValidations: [
        {
          id: 'SCV-001',
          status: 'FAIL',
          evidence: ['blocked']
        }
      ]
    });

    assert.throws(
      () => validateRenderedScaffoldBundle(bundle.args),
      error =>
        error instanceof ScaffoldValidationError &&
        error.code === 'UPSTREAM_VALIDATION_MUST_PASS'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects duplicate upstream evidence', () => {
  const roots = makeRoots();

  try {
    const duplicate = {
      id: 'SCV-001',
      status: 'PASS',
      evidence: ['gate=PASS']
    };

    const bundle = buildBundle(roots, {
      upstreamValidations: [duplicate, duplicate]
    });

    assert.throws(
      () => validateRenderedScaffoldBundle(bundle.args),
      error =>
        error instanceof ScaffoldValidationError &&
        error.code === 'UPSTREAM_VALIDATION_DUPLICATE'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when repository snapshot changed', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      sideEffectSnapshot: {
        repositoryBefore: '9'.repeat(64),
        repositoryAfter: '8'.repeat(64),
        repositoryWrites: false,
        gitOperations: false,
        networkOperations: false,
        providerOperations: false
      }
    });

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.validations.find(
        item => item.id === 'SCV-024'
      ).status,
      'FAIL'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when a forbidden Git operation is recorded', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    bundle.args.sideEffectSnapshot.gitOperations = true;
    const report = validateRenderedScaffoldBundle(bundle.args);

    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.errors.some(
        error =>
          error.includes('FORBIDDEN_SIDE_EFFECT_RECORDED')
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when a staged file is tampered', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    fs.writeFileSync(
      bundle.staged.outputs[0].absolutePath,
      'tampered\n'
    );

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.validations.some(
        item =>
          item.status === 'FAIL' &&
          item.evidence.some(
            evidence =>
              evidence.includes(
                'STAGED_OUTPUT_HASH_MISMATCH'
              )
          )
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when staging contains an extra file', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    fs.writeFileSync(
      path.join(bundle.staged.stagingDirectory, 'EXTRA.txt'),
      'extra'
    );

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.errors.some(
        error =>
          error.includes('STAGING_FILE_SET_MISMATCH')
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when rendered text retains a placeholder', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    const tampered = structuredClone(bundle.renderResult);
    tampered.outputs[0].text = '{{unresolved}}\n';
    tampered.outputs[0].bytes =
      Buffer.byteLength(tampered.outputs[0].text);
    tampered.outputs[0].sha256 =
      'f'.repeat(64);

    const report = validateRenderedScaffoldBundle({
      ...bundle.args,
      renderResult: tampered
    });

    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.errors.some(
        error =>
          error.includes('UNRESOLVED_PLACEHOLDER')
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when template no longer matches its lock', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      templateText:
        `${templateText}\nchanged after render`
    });

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.validations.find(
        item => item.id === 'SCV-014'
      ).status,
      'FAIL'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('fails when input data no longer matches plan', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      inputData: {
        ...inputData,
        title: 'Tampered'
      }
    });

    const report = validateRenderedScaffoldBundle(bundle.args);
    assert.equal(report.status, 'FAIL');
    assert.equal(
      report.errors.some(
        error =>
          error.includes('PLAN_INPUT_HASH_MISMATCH')
      ),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('hashes a staging directory deterministically', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots);
    const first = hashStagingDirectory(
      bundle.staged.stagingDirectory
    );
    const second = hashStagingDirectory(
      bundle.staged.stagingDirectory
    );

    assert.equal(
      first.directorySha256,
      second.directorySha256
    );
    assert.equal(first.fileCount, 1);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('assert pass rejects a failed report', () => {
  const roots = makeRoots();

  try {
    const bundle = buildBundle(roots, {
      upstreamValidations: []
    });
    const report = validateRenderedScaffoldBundle(bundle.args);

    assert.throws(
      () => assertValidationReportPass(report),
      error =>
        error instanceof ScaffoldValidationError &&
        error.code === 'VALIDATION_REPORT_NOT_PASS'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});
