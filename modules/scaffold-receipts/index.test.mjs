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
  renderScaffoldInMemory,
  stageRenderedScaffold
} from '../scaffold-renderer/index.mjs';

import {
  validateRenderedScaffoldBundle
} from '../scaffold-validator/index.mjs';

import {
  ScaffoldReceiptError,
  createPreApplyReceipt,
  removeReceiptEvidence,
  stableReceiptJson,
  verifyPreApplyReceipt,
  verifyReceiptHash,
  verifyWrittenReceipt,
  writeReceiptEvidence
} from './index.mjs';

const validatorHere = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'scaffold-validator',
  'fixtures'
);

const read = name =>
  fs.readFileSync(path.join(validatorHere, name), 'utf8');
const readJson = name => JSON.parse(read(name));

const registryValue = readJson('registry.json');
const inputData = readJson('input.json');
const templateText =
  read('architecture-boundary.template.md');
const registry = createScaffoldRegistry(registryValue);
const definition = registry.resolve(
  'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0'
);
const repositorySnapshot = '9'.repeat(64);

function makeRoots() {
  const base = fs.mkdtempSync(
    path.join(os.tmpdir(), 'forge-wave4-receipt-')
  );
  const repositoryRoot = path.join(base, 'repo');
  const stagingParent = path.join(base, 'staging');
  const evidenceParent = path.join(base, 'evidence');
  fs.mkdirSync(repositoryRoot);
  fs.mkdirSync(stagingParent);
  fs.mkdirSync(evidenceParent);
  return {
    base,
    repositoryRoot,
    stagingParent,
    evidenceParent
  };
}

function createContext(roots) {
  const plan = buildScaffoldPlan({
    registry: registryValue,
    scaffoldReference:
      'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
    input: {
      path: '.forge21/scaffold-inputs/client-truth.json',
      data: inputData,
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
    runId: '20260724T020000Z-WAVE4-RECEIPT',
    planId: 'SPLAN-WAVE4-RECEIPT',
    createdAt: '2026-07-24T02:00:00Z'
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

  const validationReport = validateRenderedScaffoldBundle({
    reportId: 'SVRPT-WAVE4-RECEIPT',
    createdAt: '2026-07-24T02:00:05Z',
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
    }
  });

  const environment = {
    engineVersion: '2.1.0',
    nodeVersion: process.version,
    platform: process.platform,
    sourceRef:
      '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
    workingTreeCleanBefore: true
  };

  const receipt = createPreApplyReceipt({
    receiptId: 'SRCPT-WAVE4-PRE-APPLY',
    validationReport,
    renderResult,
    environment,
    startedAt: '2026-07-24T02:00:00Z',
    finishedAt: '2026-07-24T02:00:06Z'
  });

  return {
    plan,
    renderResult,
    staged,
    validationReport,
    environment,
    receipt
  };
}

test('creates a contract-valid pre-apply BLOCKED receipt', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);

    assert.equal(receipt.status, 'BLOCKED');
    assert.equal(receipt.approval.present, false);
    assert.equal(
      receipt.outputs.every(output => output.applied === false),
      true
    );
    assert.deepEqual(
      receipt.errors,
      ['APPLY_NOT_EXECUTED_WAVE_5_REQUIRED']
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('pre-apply receipt maps deferred checks to NOT_APPLICABLE', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const deferred = receipt.validations.filter(
      validation =>
        validation.status === 'NOT_APPLICABLE'
    );

    assert.deepEqual(
      deferred.map(item => item.id),
      ['SCV-018', 'SCV-020', 'SCV-023']
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('verifies pre-apply receipt hash', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    assert.equal(verifyReceiptHash(receipt), true);
    assert.equal(verifyPreApplyReceipt(receipt), true);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('detects a tampered receipt', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const tampered = structuredClone(receipt);
    tampered.environment.platform = 'tampered';

    assert.throws(
      () => verifyReceiptHash(tampered),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'RECEIPT_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects invalid receipt ID', () => {
  const roots = makeRoots();

  try {
    const context = createContext(roots);

    assert.throws(
      () => createPreApplyReceipt({
        receiptId: 'bad',
        validationReport: context.validationReport,
        renderResult: context.renderResult,
        environment: context.environment,
        startedAt: '2026-07-24T02:00:00Z',
        finishedAt: '2026-07-24T02:00:06Z'
      }),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'RECEIPT_ID_INVALID'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects receipt dates in reverse order', () => {
  const roots = makeRoots();

  try {
    const context = createContext(roots);

    assert.throws(
      () => createPreApplyReceipt({
        receiptId: 'SRCPT-DATE-REVERSE',
        validationReport: context.validationReport,
        renderResult: context.renderResult,
        environment: context.environment,
        startedAt: '2026-07-24T02:00:10Z',
        finishedAt: '2026-07-24T02:00:06Z'
      }),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'RECEIPT_FINISHED_BEFORE_STARTED'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects source-ref mismatch', () => {
  const roots = makeRoots();

  try {
    const context = createContext(roots);

    assert.throws(
      () => createPreApplyReceipt({
        receiptId: 'SRCPT-SOURCE-MISMATCH',
        validationReport: context.validationReport,
        renderResult: context.renderResult,
        environment: {
          ...context.environment,
          sourceRef: 'different-ref'
        },
        startedAt: '2026-07-24T02:00:00Z',
        finishedAt: '2026-07-24T02:00:06Z'
      }),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'RECEIPT_SOURCE_REF_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects a failed validation report', () => {
  const roots = makeRoots();

  try {
    const context = createContext(roots);
    const failed = structuredClone(context.validationReport);
    failed.status = 'FAIL';
    failed.errors = ['FAILED'];
    failed.reportSha256 = sha256Canonical({
      ...failed,
      reportSha256: null
    });

    assert.throws(
      () => createPreApplyReceipt({
        receiptId: 'SRCPT-FAILED-REPORT',
        validationReport: failed,
        renderResult: context.renderResult,
        environment: context.environment,
        startedAt: '2026-07-24T02:00:00Z',
        finishedAt: '2026-07-24T02:00:06Z'
      }),
      error => error.code === 'VALIDATION_REPORT_NOT_PASS'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects plan hash mismatch between validation and render', () => {
  const roots = makeRoots();

  try {
    const context = createContext(roots);
    const report = structuredClone(context.validationReport);
    report.planSha256 = 'f'.repeat(64);
    report.reportSha256 = sha256Canonical({
      ...report,
      reportSha256: null
    });

    assert.throws(
      () => createPreApplyReceipt({
        receiptId: 'SRCPT-PLAN-MISMATCH',
        validationReport: report,
        renderResult: context.renderResult,
        environment: context.environment,
        startedAt: '2026-07-24T02:00:00Z',
        finishedAt: '2026-07-24T02:00:06Z'
      }),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'VALIDATION_PLAN_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('stable receipt JSON ends with one newline', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const text = stableReceiptJson(receipt);

    assert.equal(text.endsWith('\n'), true);
    assert.equal(text.endsWith('\n\n'), false);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('writes and verifies receipt evidence outside repository', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const evidence = writeReceiptEvidence({
      receipt,
      evidenceParent: roots.evidenceParent,
      repositoryRoot: roots.repositoryRoot
    });

    assert.equal(evidence.repositoryTouched, false);
    assert.equal(fs.existsSync(evidence.receiptPath), true);
    assert.equal(
      verifyWrittenReceipt({
        receipt,
        receiptPath: evidence.receiptPath
      }).pass,
      true
    );
    assert.equal(
      fs.readdirSync(roots.repositoryRoot).length,
      0
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('receipt evidence uses private file permissions', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const evidence = writeReceiptEvidence({
      receipt,
      evidenceParent: roots.evidenceParent,
      repositoryRoot: roots.repositoryRoot
    });

    const mode = fs.statSync(evidence.receiptPath).mode & 0o777;
    assert.equal(mode & 0o077, 0);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('creates unique receipt evidence directories', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);

    const first = writeReceiptEvidence({
      receipt,
      evidenceParent: roots.evidenceParent,
      repositoryRoot: roots.repositoryRoot
    });

    const second = writeReceiptEvidence({
      receipt,
      evidenceParent: roots.evidenceParent,
      repositoryRoot: roots.repositoryRoot
    });

    assert.notEqual(
      first.evidenceDirectory,
      second.evidenceDirectory
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects evidence parent inside repository', () => {
  const roots = makeRoots();
  const inside = path.join(roots.repositoryRoot, 'evidence');
  fs.mkdirSync(inside);

  try {
    const { receipt } = createContext(roots);

    assert.throws(
      () => writeReceiptEvidence({
        receipt,
        evidenceParent: inside,
        repositoryRoot: roots.repositoryRoot
      }),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'EVIDENCE_PARENT_INSIDE_REPOSITORY'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('detects written receipt tampering', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const evidence = writeReceiptEvidence({
      receipt,
      evidenceParent: roots.evidenceParent,
      repositoryRoot: roots.repositoryRoot
    });

    fs.writeFileSync(
      evidence.receiptPath,
      '{"tampered":true}\n'
    );

    assert.throws(
      () => verifyWrittenReceipt({
        receipt,
        receiptPath: evidence.receiptPath
      })
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('cleanup removes only prefixed evidence directories', () => {
  const roots = makeRoots();

  try {
    const { receipt } = createContext(roots);
    const evidence = writeReceiptEvidence({
      receipt,
      evidenceParent: roots.evidenceParent,
      repositoryRoot: roots.repositoryRoot
    });

    assert.equal(
      removeReceiptEvidence({
        evidenceDirectory: evidence.evidenceDirectory,
        evidenceParent: roots.evidenceParent
      }),
      true
    );

    assert.equal(
      fs.existsSync(evidence.evidenceDirectory),
      false
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('cleanup rejects unrelated directories', () => {
  const roots = makeRoots();
  const unrelated = path.join(
    roots.evidenceParent,
    'unrelated'
  );
  fs.mkdirSync(unrelated);

  try {
    assert.throws(
      () => removeReceiptEvidence({
        evidenceDirectory: unrelated,
        evidenceParent: roots.evidenceParent
      }),
      error =>
        error instanceof ScaffoldReceiptError &&
        error.code === 'EVIDENCE_CLEANUP_PREFIX_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});
