import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  ScaffoldApplyError,
  applyApprovedScaffold,
  compareRepositorySnapshots,
  createApprovalRecord,
  createFinalReceipt,
  snapshotRepositoryTree,
  verifyAppliedScaffold,
  verifyApprovalRecord,
  verifyFinalReceipt,
  writeApplyResultEvidence,
  writeFinalReceiptEvidence
} from './index.mjs';

import {
  buildContext,
  expectedText,
  makeRoots
} from './test-support.mjs';

function createApproval(roots, context, overrides = {}) {
  return createApprovalRecord({
    approvalId: 'SAPPR-WAVE5',
    actor: 'PROJECT_OWNER',
    approvedAt: '2026-07-24T03:00:06Z',
    expiresAt: null,
    validationReport: context.validationReport,
    renderResult: context.renderResult,
    repositorySnapshot:
      snapshotRepositoryTree(roots.repositoryRoot),
    decision: 'APPROVE_EXACT_PLAN',
    ...overrides
  });
}

function apply(roots, context, approval, overrides = {}) {
  return applyApprovedScaffold({
    applyId: 'SAPPLY-WAVE5',
    approval,
    validationReport: context.validationReport,
    renderResult: context.renderResult,
    stagingDirectory: context.staged.stagingDirectory,
    repositoryRoot: roots.repositoryRoot,
    appliedAt: '2026-07-24T03:00:07Z',
    ...overrides
  });
}

test('repository snapshot is deterministic', () => {
  const roots = makeRoots();

  try {
    fs.writeFileSync(
      path.join(roots.repositoryRoot, 'a.txt'),
      'a'
    );

    const first = snapshotRepositoryTree(
      roots.repositoryRoot
    );
    const second = snapshotRepositoryTree(
      roots.repositoryRoot
    );

    assert.equal(first.treeSha256, second.treeSha256);
    assert.deepEqual(first.entries, second.entries);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('repository snapshot excludes .git internals', () => {
  const roots = makeRoots();

  try {
    fs.mkdirSync(path.join(roots.repositoryRoot, '.git'));
    fs.writeFileSync(
      path.join(roots.repositoryRoot, '.git', 'HEAD'),
      'ref: refs/heads/main\n'
    );

    const snapshot = snapshotRepositoryTree(
      roots.repositoryRoot
    );

    assert.equal(
      snapshot.entries.some(
        entry => entry.path.startsWith('.git/')
      ),
      false
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('snapshot comparison returns exact changed paths', () => {
  const roots = makeRoots();

  try {
    const before = snapshotRepositoryTree(
      roots.repositoryRoot
    );

    fs.writeFileSync(
      path.join(roots.repositoryRoot, 'a.txt'),
      'a'
    );

    const after = snapshotRepositoryTree(
      roots.repositoryRoot
    );

    assert.deepEqual(
      compareRepositorySnapshots(before, after),
      ['a.txt']
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('creates approval bound to exact plan and repository', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );

    assert.equal(
      approval.decision,
      'APPROVE_EXACT_PLAN'
    );
    assert.equal(
      approval.repositoryBeforeSha256,
      snapshotRepositoryTree(
        roots.repositoryRoot
      ).treeSha256
    );
    assert.match(
      approval.approvalSha256,
      /^[a-f0-9]{64}$/
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('requires exact approval confirmation', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);

    assert.throws(
      () => createApproval(
        roots,
        context,
        { decision: 'YES' }
      ),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'EXACT_APPROVAL_CONFIRMATION_REQUIRED'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('requires Project Owner role', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);

    assert.throws(
      () => createApproval(
        roots,
        context,
        { actorRole: 'AUTOMATION' }
      ),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPROVAL_ACTOR_ROLE_INVALID'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('approval expiry must follow approval time', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);

    assert.throws(
      () => createApproval(
        roots,
        context,
        { expiresAt: '2026-07-24T03:00:05Z' }
      ),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPROVAL_EXPIRY_MUST_FOLLOW_APPROVAL'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('verifies a valid approval', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );

    assert.equal(
      verifyApprovalRecord({
        approval,
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        repositorySnapshot:
          snapshotRepositoryTree(
            roots.repositoryRoot
          ),
        at: '2026-07-24T03:00:07Z'
      }),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('rejects expired approval', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context,
      { expiresAt: '2026-07-24T03:00:07Z' }
    );

    assert.throws(
      () => verifyApprovalRecord({
        approval,
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        repositorySnapshot:
          snapshotRepositoryTree(
            roots.repositoryRoot
          ),
        at: '2026-07-24T03:00:08Z'
      }),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code === 'APPROVAL_EXPIRED'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('repository change invalidates approval', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );

    fs.writeFileSync(
      path.join(roots.repositoryRoot, 'changed.txt'),
      'changed'
    );

    assert.throws(
      () => verifyApprovalRecord({
        approval,
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        repositorySnapshot:
          snapshotRepositoryTree(
            roots.repositoryRoot
          ),
        at: '2026-07-24T03:00:07Z'
      }),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPROVAL_BINDING_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('tampered approval hash is rejected', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = structuredClone(
      createApproval(roots, context)
    );
    approval.actor = 'tampered';

    assert.throws(
      () => verifyApprovalRecord({
        approval,
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        repositorySnapshot:
          snapshotRepositoryTree(
            roots.repositoryRoot
          ),
        at: '2026-07-24T03:00:07Z'
      }),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code === 'APPROVAL_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('applies approved bytes and exact path only', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );

    const target = path.join(
      roots.repositoryRoot,
      context.renderResult.outputs[0].path
    );

    assert.equal(
      fs.readFileSync(target, 'utf8'),
      expectedText
    );
    assert.deepEqual(
      result.changedPaths,
      [context.renderResult.outputs[0].path]
    );
    assert.equal(result.status, 'PASS');
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('apply result verifies against repository', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );

    assert.equal(
      verifyAppliedScaffold({
        applyResult: result,
        approval,
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        repositoryRoot: roots.repositoryRoot
      }),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('apply refuses an existing create target', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const target = path.join(
      roots.repositoryRoot,
      context.renderResult.outputs[0].path
    );

    fs.mkdirSync(path.dirname(target), {
      recursive: true
    });
    fs.writeFileSync(target, 'existing');

    const approval = createApproval(
      roots,
      context
    );

    assert.throws(
      () => apply(roots, context, approval),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPLY_TRANSACTION_FAILED' &&
        error.details.some(
          detail =>
            detail.includes(
              'cause=CREATE_TARGET_EXISTS'
            )
        ) &&
        error.details.includes('rollback=PASS')
    );

    assert.equal(
      fs.readFileSync(target, 'utf8'),
      'existing'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('apply rejects approval used before approved time', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );

    assert.throws(
      () => apply(
        roots,
        context,
        approval,
        { appliedAt: '2026-07-24T03:00:05Z' }
      ),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPROVAL_USED_BEFORE_APPROVAL_TIME'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('apply blocks symlink parent traversal', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);

    const docs = path.join(
      roots.repositoryRoot,
      'docs'
    );
    fs.symlinkSync(roots.evidenceParent, docs);

    const approval = createApproval(
      roots,
      context
    );

    assert.throws(
      () => apply(roots, context, approval),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPLY_TRANSACTION_FAILED' &&
        error.details.some(
          detail =>
            detail.includes(
              'cause=OUTPUT_PARENT_SYMLINK_BLOCKED'
            )
        ) &&
        error.details.includes('rollback=PASS')
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('staged-byte tampering blocks apply', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );

    fs.writeFileSync(
      context.staged.outputs[0].absolutePath,
      'tampered\n'
    );

    assert.throws(
      () => apply(roots, context, approval)
    );

    assert.equal(
      snapshotRepositoryTree(
        roots.repositoryRoot
      ).entries.length,
      0
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('transaction rollback restores repository after rename failure', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const before = snapshotRepositoryTree(
      roots.repositoryRoot
    );

    const originalRename = fs.renameSync;
    let calls = 0;

    fs.renameSync = (...args) => {
      calls += 1;
      originalRename(...args);
      throw Object.assign(
        new Error('injected rename failure'),
        { code: 'INJECTED_RENAME_FAILURE' }
      );
    };

    try {
      assert.throws(
        () => apply(roots, context, approval),
        error =>
          error instanceof ScaffoldApplyError &&
          error.code ===
            'APPLY_TRANSACTION_FAILED' &&
          error.details.includes('rollback=PASS')
      );
    } finally {
      fs.renameSync = originalRename;
    }

    const after = snapshotRepositoryTree(
      roots.repositoryRoot
    );

    assert.equal(
      after.treeSha256,
      before.treeSha256
    );
    assert.equal(calls, 1);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('applied file tampering is detected', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );

    const target = path.join(
      roots.repositoryRoot,
      context.renderResult.outputs[0].path
    );
    fs.writeFileSync(target, 'tampered\n');

    assert.throws(
      () => verifyAppliedScaffold({
        applyResult: result,
        approval,
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        repositoryRoot: roots.repositoryRoot
      }),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'APPLIED_REPOSITORY_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('creates final PASS receipt after verified apply', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );

    const receipt = createFinalReceipt({
      receiptId: 'SRCPT-WAVE5-FINAL',
      validationReport:
        context.validationReport,
      renderResult: context.renderResult,
      approval,
      applyResult: result,
      repositoryRoot: roots.repositoryRoot,
      environment: context.environment,
      startedAt: '2026-07-24T03:00:00Z',
      finishedAt: '2026-07-24T03:00:08Z'
    });

    assert.equal(receipt.status, 'PASS');
    assert.equal(receipt.approval.present, true);
    assert.equal(
      receipt.outputs.every(
        output => output.applied === true
      ),
      true
    );
    assert.deepEqual(receipt.errors, []);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('final receipt closes SCV-018, SCV-020, and SCV-023', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );
    const receipt = createFinalReceipt({
      receiptId: 'SRCPT-WAVE5-CLOSURES',
      validationReport:
        context.validationReport,
      renderResult: context.renderResult,
      approval,
      applyResult: result,
      repositoryRoot: roots.repositoryRoot,
      environment: context.environment,
      startedAt: '2026-07-24T03:00:00Z',
      finishedAt: '2026-07-24T03:00:08Z'
    });

    for (const id of [
      'SCV-018',
      'SCV-020',
      'SCV-023'
    ]) {
      assert.equal(
        receipt.validations.some(
          item =>
            item.id === id &&
            item.status === 'PASS'
        ),
        true,
        id
      );
    }
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('verifies final receipt hash and status', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );
    const receipt = createFinalReceipt({
      receiptId: 'SRCPT-WAVE5-VERIFY',
      validationReport:
        context.validationReport,
      renderResult: context.renderResult,
      approval,
      applyResult: result,
      repositoryRoot: roots.repositoryRoot,
      environment: context.environment,
      startedAt: '2026-07-24T03:00:00Z',
      finishedAt: '2026-07-24T03:00:08Z'
    });

    assert.equal(
      verifyFinalReceipt(receipt),
      true
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('tampered final receipt is rejected', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );
    const receipt = structuredClone(
      createFinalReceipt({
        receiptId: 'SRCPT-WAVE5-TAMPER',
        validationReport:
          context.validationReport,
        renderResult: context.renderResult,
        approval,
        applyResult: result,
        repositoryRoot: roots.repositoryRoot,
        environment: context.environment,
        startedAt: '2026-07-24T03:00:00Z',
        finishedAt: '2026-07-24T03:00:08Z'
      })
    );

    receipt.environment.platform = 'tampered';

    assert.throws(
      () => verifyFinalReceipt(receipt),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code === 'RECEIPT_HASH_MISMATCH'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('writes apply and final receipt evidence outside repository', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );
    const receipt = createFinalReceipt({
      receiptId: 'SRCPT-WAVE5-EVIDENCE',
      validationReport:
        context.validationReport,
      renderResult: context.renderResult,
      approval,
      applyResult: result,
      repositoryRoot: roots.repositoryRoot,
      environment: context.environment,
      startedAt: '2026-07-24T03:00:00Z',
      finishedAt: '2026-07-24T03:00:08Z'
    });

    const applyEvidence =
      writeApplyResultEvidence({
        applyResult: result,
        evidenceParent: roots.evidenceParent,
        repositoryRoot: roots.repositoryRoot
      });

    const receiptEvidence =
      writeFinalReceiptEvidence({
        receipt,
        evidenceParent: roots.evidenceParent,
        repositoryRoot: roots.repositoryRoot
      });

    assert.equal(
      fs.existsSync(applyEvidence.evidencePath),
      true
    );
    assert.equal(
      fs.existsSync(receiptEvidence.evidencePath),
      true
    );
    assert.equal(
      applyEvidence.repositoryTouched,
      false
    );
    assert.equal(
      receiptEvidence.repositoryTouched,
      false
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('evidence parent inside repository is rejected', () => {
  const roots = makeRoots();

  try {
    const context = buildContext(roots);
    const approval = createApproval(
      roots,
      context
    );
    const result = apply(
      roots,
      context,
      approval
    );

    const inside = path.join(
      roots.repositoryRoot,
      'evidence'
    );
    fs.mkdirSync(inside);

    assert.throws(
      () => writeApplyResultEvidence({
        applyResult: result,
        evidenceParent: inside,
        repositoryRoot: roots.repositoryRoot
      }),
      error =>
        error instanceof ScaffoldApplyError &&
        error.code ===
          'EVIDENCE_PARENT_INSIDE_REPOSITORY'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});
