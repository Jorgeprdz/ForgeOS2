#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ScaffoldApplyError,
  applyApprovedScaffold,
  createApprovalRecord,
  createFinalReceipt,
  snapshotRepositoryTree,
  verifyApprovalRecord,
  verifyFinalReceipt,
  writeApplyResultEvidence,
  writeFinalReceiptEvidence
} from '../scaffold-applier/index.mjs';

function printHelp() {
  process.stdout.write(
    [
      'Forge OS 2.1 Scaffold CLI — Wave 5',
      '',
      'Commands:',
      '  snapshot --repository-root PATH',
      '  approval-create --bundle FILE --repository-root PATH',
      '    --approval-id ID --actor NAME --approved-at ISO',
      '    --confirm APPROVE_EXACT_PLAN --output FILE',
      '    [--expires-at ISO]',
      '  approval-verify --bundle FILE --repository-root PATH',
      '    --approval FILE --at ISO',
      '  apply --bundle FILE --repository-root PATH',
      '    --approval FILE --apply-id ID --applied-at ISO',
      '    --final-receipt-id ID --started-at ISO',
      '    --finished-at ISO --evidence-parent PATH',
      '  receipt-verify --receipt FILE',
      '',
      'No command commits, pushes, merges, or deploys.',
      ''
    ].join('\n')
  );
}

function parseArgs(argv) {
  const [command, ...rest] = argv;

  if (!command) {
    return { command: 'help', options: {} };
  }

  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (!token.startsWith('--')) {
      throw new ScaffoldApplyError(
        'CLI_POSITIONAL_ARGUMENT_UNSUPPORTED',
        [token]
      );
    }

    const key = token.slice(2);

    if (!key) {
      throw new ScaffoldApplyError('CLI_OPTION_NAME_REQUIRED');
    }

    if (Object.hasOwn(options, key)) {
      throw new ScaffoldApplyError(
        'CLI_DUPLICATE_OPTION',
        [key]
      );
    }

    const value = rest[index + 1];

    if (value === undefined || value.startsWith('--')) {
      throw new ScaffoldApplyError(
        'CLI_OPTION_VALUE_REQUIRED',
        [key]
      );
    }

    options[key] = value;
    index += 1;
  }

  return { command, options };
}

function requireOption(options, name) {
  const value = options[name];

  if (typeof value !== 'string' || value.length === 0) {
    throw new ScaffoldApplyError(
      'CLI_REQUIRED_OPTION_MISSING',
      [name]
    );
  }

  return value;
}

function assertOnlyOptions(options, allowed) {
  for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) {
      throw new ScaffoldApplyError(
        'CLI_UNKNOWN_OPTION',
        [key]
      );
    }
  }
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function writeJsonCreateOnly(filename, value) {
  const absolute = path.resolve(filename);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(
    absolute,
    `${JSON.stringify(value, null, 2)}\n`,
    { flag: 'wx', mode: 0o600 }
  );
  return absolute;
}

function readBundle(filename) {
  const bundle = readJson(filename);

  if (
    bundle === null ||
    typeof bundle !== 'object' ||
    Array.isArray(bundle) ||
    !bundle.validationReport ||
    !bundle.renderResult ||
    !bundle.stagingDirectory ||
    !bundle.environment
  ) {
    throw new ScaffoldApplyError(
      'CLI_BUNDLE_INVALID'
    );
  }

  return bundle;
}

export async function runCli(
  argv,
  io = {
    stdout: process.stdout,
    stderr: process.stderr
  }
) {
  const { command, options } = parseArgs(argv);

  if (
    command === 'help' ||
    command === '--help' ||
    command === '-h'
  ) {
    printHelp();
    return 0;
  }

  if (command === 'snapshot') {
    assertOnlyOptions(options, ['repository-root']);
    const repositoryRoot = requireOption(
      options,
      'repository-root'
    );
    const snapshot = snapshotRepositoryTree(repositoryRoot);
    io.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return 0;
  }

  if (command === 'approval-create') {
    assertOnlyOptions(options, [
      'bundle',
      'repository-root',
      'approval-id',
      'actor',
      'approved-at',
      'expires-at',
      'confirm',
      'output'
    ]);

    const bundle = readBundle(
      requireOption(options, 'bundle')
    );
    const repositoryRoot = requireOption(
      options,
      'repository-root'
    );
    const snapshot = snapshotRepositoryTree(
      repositoryRoot
    );

    const approval = createApprovalRecord({
      approvalId: requireOption(
        options,
        'approval-id'
      ),
      actor: requireOption(options, 'actor'),
      approvedAt: requireOption(
        options,
        'approved-at'
      ),
      expiresAt: options['expires-at'] ?? null,
      validationReport: bundle.validationReport,
      renderResult: bundle.renderResult,
      repositorySnapshot: snapshot,
      decision: requireOption(options, 'confirm')
    });

    const output = writeJsonCreateOnly(
      requireOption(options, 'output'),
      approval
    );

    io.stdout.write(
      `${JSON.stringify({
        result: 'APPROVAL_CREATED',
        approvalId: approval.approvalId,
        approvalSha256: approval.approvalSha256,
        output
      })}\n`
    );

    return 0;
  }

  if (command === 'approval-verify') {
    assertOnlyOptions(options, [
      'bundle',
      'repository-root',
      'approval',
      'at'
    ]);

    const bundle = readBundle(
      requireOption(options, 'bundle')
    );
    const approval = readJson(
      requireOption(options, 'approval')
    );
    const snapshot = snapshotRepositoryTree(
      requireOption(options, 'repository-root')
    );

    verifyApprovalRecord({
      approval,
      validationReport: bundle.validationReport,
      renderResult: bundle.renderResult,
      repositorySnapshot: snapshot,
      at: requireOption(options, 'at')
    });

    io.stdout.write(
      `${JSON.stringify({
        result: 'APPROVAL_VALID',
        approvalId: approval.approvalId,
        approvalSha256: approval.approvalSha256
      })}\n`
    );

    return 0;
  }

  if (command === 'apply') {
    assertOnlyOptions(options, [
      'bundle',
      'repository-root',
      'approval',
      'apply-id',
      'applied-at',
      'final-receipt-id',
      'started-at',
      'finished-at',
      'evidence-parent'
    ]);

    const bundle = readBundle(
      requireOption(options, 'bundle')
    );
    const repositoryRoot = requireOption(
      options,
      'repository-root'
    );
    const approval = readJson(
      requireOption(options, 'approval')
    );
    const evidenceParent = requireOption(
      options,
      'evidence-parent'
    );

    const applyResult = applyApprovedScaffold({
      applyId: requireOption(options, 'apply-id'),
      approval,
      validationReport: bundle.validationReport,
      renderResult: bundle.renderResult,
      stagingDirectory: bundle.stagingDirectory,
      repositoryRoot,
      appliedAt: requireOption(
        options,
        'applied-at'
      )
    });

    const receipt = createFinalReceipt({
      receiptId: requireOption(
        options,
        'final-receipt-id'
      ),
      validationReport: bundle.validationReport,
      renderResult: bundle.renderResult,
      approval,
      applyResult,
      repositoryRoot,
      environment: bundle.environment,
      startedAt: requireOption(
        options,
        'started-at'
      ),
      finishedAt: requireOption(
        options,
        'finished-at'
      )
    });

    const applyEvidence = writeApplyResultEvidence({
      applyResult,
      evidenceParent,
      repositoryRoot
    });

    const receiptEvidence = writeFinalReceiptEvidence({
      receipt,
      evidenceParent,
      repositoryRoot
    });

    io.stdout.write(
      `${JSON.stringify({
        result: 'APPLY_PASS',
        applyId: applyResult.applyId,
        applyResultSha256:
          applyResult.applyResultSha256,
        finalReceiptId: receipt.receiptId,
        finalReceiptSha256:
          receipt.receiptSha256,
        applyEvidence:
          applyEvidence.evidencePath,
        receiptEvidence:
          receiptEvidence.evidencePath
      })}\n`
    );

    return 0;
  }

  if (command === 'receipt-verify') {
    assertOnlyOptions(options, ['receipt']);
    const receipt = readJson(
      requireOption(options, 'receipt')
    );
    verifyFinalReceipt(receipt);

    io.stdout.write(
      `${JSON.stringify({
        result: 'FINAL_RECEIPT_VALID',
        receiptId: receipt.receiptId,
        receiptSha256: receipt.receiptSha256
      })}\n`
    );

    return 0;
  }

  throw new ScaffoldApplyError(
    'CLI_COMMAND_UNKNOWN',
    [command]
  );
}

async function main() {
  try {
    const code = await runCli(process.argv.slice(2));
    process.exitCode = code;
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        result: 'FAIL',
        code: error?.code ?? error?.name ?? 'ERROR',
        message: error?.message ?? String(error)
      })}\n`
    );
    process.exitCode = 1;
  }
}

if (
  import.meta.url ===
  pathToFileURL(process.argv[1] ?? '').href
) {
  await main();
}
