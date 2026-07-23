import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildContext,
  makeRoots
} from '../scaffold-applier/test-support.mjs';

import {
  runCli
} from './main.mjs';

function capture() {
  let stdout = '';
  let stderr = '';

  return {
    io: {
      stdout: {
        write(value) {
          stdout += value;
        }
      },
      stderr: {
        write(value) {
          stderr += value;
        }
      }
    },
    stdout: () => stdout,
    stderr: () => stderr
  };
}

function writeJson(filename, value) {
  fs.mkdirSync(path.dirname(filename), {
    recursive: true
  });
  fs.writeFileSync(
    filename,
    `${JSON.stringify(value, null, 2)}\n`
  );
}

test('help returns success', async () => {
  const output = capture();
  assert.equal(
    await runCli(['help'], output.io),
    0
  );
});

test('unknown command is rejected', async () => {
  const output = capture();

  await assert.rejects(
    () => runCli(['unknown'], output.io),
    error =>
      error.code === 'CLI_COMMAND_UNKNOWN'
  );
});

test('snapshot command emits repository snapshot', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const output = capture();

    assert.equal(
      await runCli([
        'snapshot',
        '--repository-root',
        roots.repositoryRoot
      ], output.io),
      0
    );

    const parsed = JSON.parse(output.stdout());
    assert.match(
      parsed.treeSha256,
      /^[a-f0-9]{64}$/
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('duplicate CLI options are rejected', async () => {
  const output = capture();

  await assert.rejects(
    () => runCli([
      'snapshot',
      '--repository-root',
      '/tmp/a',
      '--repository-root',
      '/tmp/b'
    ], output.io),
    error =>
      error.code === 'CLI_DUPLICATE_OPTION'
  );
});

test('unknown CLI options are rejected', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const output = capture();

    await assert.rejects(
      () => runCli([
        'snapshot',
        '--repository-root',
        roots.repositoryRoot,
        '--unknown',
        'x'
      ], output.io),
      error =>
        error.code === 'CLI_UNKNOWN_OPTION'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('approval-create requires exact confirmation', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const context = buildContext(roots);
    const bundlePath = path.join(
      roots.base,
      'bundle.json'
    );
    const approvalPath = path.join(
      roots.base,
      'approval.json'
    );
    writeJson(bundlePath, context.bundle);

    const output = capture();

    await assert.rejects(
      () => runCli([
        'approval-create',
        '--bundle',
        bundlePath,
        '--repository-root',
        roots.repositoryRoot,
        '--approval-id',
        'SAPPR-CLI',
        '--actor',
        'PROJECT_OWNER',
        '--approved-at',
        '2026-07-24T03:00:06Z',
        '--confirm',
        'YES',
        '--output',
        approvalPath
      ], output.io),
      error =>
        error.code ===
          'EXACT_APPROVAL_CONFIRMATION_REQUIRED'
    );

    assert.equal(
      fs.existsSync(approvalPath),
      false
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('approval-create and approval-verify succeed', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const context = buildContext(roots);
    const bundlePath = path.join(
      roots.base,
      'bundle.json'
    );
    const approvalPath = path.join(
      roots.base,
      'approval.json'
    );
    writeJson(bundlePath, context.bundle);

    const createOutput = capture();

    assert.equal(
      await runCli([
        'approval-create',
        '--bundle',
        bundlePath,
        '--repository-root',
        roots.repositoryRoot,
        '--approval-id',
        'SAPPR-CLI',
        '--actor',
        'PROJECT_OWNER',
        '--approved-at',
        '2026-07-24T03:00:06Z',
        '--confirm',
        'APPROVE_EXACT_PLAN',
        '--output',
        approvalPath
      ], createOutput.io),
      0
    );

    assert.equal(
      fs.existsSync(approvalPath),
      true
    );

    const verifyOutput = capture();

    assert.equal(
      await runCli([
        'approval-verify',
        '--bundle',
        bundlePath,
        '--repository-root',
        roots.repositoryRoot,
        '--approval',
        approvalPath,
        '--at',
        '2026-07-24T03:00:07Z'
      ], verifyOutput.io),
      0
    );

    assert.equal(
      JSON.parse(verifyOutput.stdout()).result,
      'APPROVAL_VALID'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('CLI apply performs controlled apply and writes evidence', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const context = buildContext(roots);
    const bundlePath = path.join(
      roots.base,
      'bundle.json'
    );
    const approvalPath = path.join(
      roots.base,
      'approval.json'
    );
    writeJson(bundlePath, context.bundle);

    await runCli([
      'approval-create',
      '--bundle',
      bundlePath,
      '--repository-root',
      roots.repositoryRoot,
      '--approval-id',
      'SAPPR-CLI-APPLY',
      '--actor',
      'PROJECT_OWNER',
      '--approved-at',
      '2026-07-24T03:00:06Z',
      '--confirm',
      'APPROVE_EXACT_PLAN',
      '--output',
      approvalPath
    ], capture().io);

    const output = capture();

    assert.equal(
      await runCli([
        'apply',
        '--bundle',
        bundlePath,
        '--repository-root',
        roots.repositoryRoot,
        '--approval',
        approvalPath,
        '--apply-id',
        'SAPPLY-CLI',
        '--applied-at',
        '2026-07-24T03:00:07Z',
        '--final-receipt-id',
        'SRCPT-CLI-FINAL',
        '--started-at',
        '2026-07-24T03:00:00Z',
        '--finished-at',
        '2026-07-24T03:00:08Z',
        '--evidence-parent',
        roots.evidenceParent
      ], output.io),
      0
    );

    const parsed = JSON.parse(output.stdout());

    assert.equal(parsed.result, 'APPLY_PASS');
    assert.equal(
      fs.existsSync(parsed.applyEvidence),
      true
    );
    assert.equal(
      fs.existsSync(parsed.receiptEvidence),
      true
    );

    const target = path.join(
      roots.repositoryRoot,
      context.renderResult.outputs[0].path
    );
    assert.equal(fs.existsSync(target), true);
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('receipt-verify accepts CLI final receipt evidence', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const context = buildContext(roots);
    const bundlePath = path.join(
      roots.base,
      'bundle.json'
    );
    const approvalPath = path.join(
      roots.base,
      'approval.json'
    );
    writeJson(bundlePath, context.bundle);

    await runCli([
      'approval-create',
      '--bundle',
      bundlePath,
      '--repository-root',
      roots.repositoryRoot,
      '--approval-id',
      'SAPPR-CLI-RECEIPT',
      '--actor',
      'PROJECT_OWNER',
      '--approved-at',
      '2026-07-24T03:00:06Z',
      '--confirm',
      'APPROVE_EXACT_PLAN',
      '--output',
      approvalPath
    ], capture().io);

    const applyOutput = capture();

    await runCli([
      'apply',
      '--bundle',
      bundlePath,
      '--repository-root',
      roots.repositoryRoot,
      '--approval',
      approvalPath,
      '--apply-id',
      'SAPPLY-CLI-RECEIPT',
      '--applied-at',
      '2026-07-24T03:00:07Z',
      '--final-receipt-id',
      'SRCPT-CLI-VERIFY',
      '--started-at',
      '2026-07-24T03:00:00Z',
      '--finished-at',
      '2026-07-24T03:00:08Z',
      '--evidence-parent',
      roots.evidenceParent
    ], applyOutput.io);

    const receiptPath =
      JSON.parse(applyOutput.stdout())
        .receiptEvidence;

    const verifyOutput = capture();

    assert.equal(
      await runCli([
        'receipt-verify',
        '--receipt',
        receiptPath
      ], verifyOutput.io),
      0
    );

    assert.equal(
      JSON.parse(verifyOutput.stdout()).result,
      'FINAL_RECEIPT_VALID'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});

test('approval output is create-only', async () => {
  const roots = makeRoots('forge-wave5-cli-');

  try {
    const context = buildContext(roots);
    const bundlePath = path.join(
      roots.base,
      'bundle.json'
    );
    const approvalPath = path.join(
      roots.base,
      'approval.json'
    );
    writeJson(bundlePath, context.bundle);
    fs.writeFileSync(approvalPath, 'existing');

    await assert.rejects(
      () => runCli([
        'approval-create',
        '--bundle',
        bundlePath,
        '--repository-root',
        roots.repositoryRoot,
        '--approval-id',
        'SAPPR-CLI-EXISTS',
        '--actor',
        'PROJECT_OWNER',
        '--approved-at',
        '2026-07-24T03:00:06Z',
        '--confirm',
        'APPROVE_EXACT_PLAN',
        '--output',
        approvalPath
      ], capture().io),
      error => error.code === 'EEXIST'
    );
  } finally {
    fs.rmSync(roots.base, { recursive: true, force: true });
  }
});
