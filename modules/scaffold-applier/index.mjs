import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  ContractValidationError,
  assertScaffoldReceipt,
  canonicalJson,
  isSafeRepositoryPath,
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  ScaffoldPlanError,
  verifyScaffoldPlanHash
} from '../scaffold-planner/index.mjs';

import {
  ScaffoldRenderError,
  verifyStagedScaffold
} from '../scaffold-renderer/index.mjs';

import {
  ScaffoldValidationError,
  assertValidationReportPass,
  verifyValidationReportHash
} from '../scaffold-validator/index.mjs';

import {
  ScaffoldReceiptError,
  stableReceiptJson
} from '../scaffold-receipts/index.mjs';

const SHA256_RE = /^[a-f0-9]{64}$/;
const APPROVAL_ID_RE = /^SAPPR-[A-Z0-9-]+$/;
const APPLY_ID_RE = /^SAPPLY-[A-Z0-9-]+$/;
const RECEIPT_ID_RE = /^SRCPT-[A-Z0-9-]+$/;
const APPROVAL_STATEMENT =
  'I approve only the exact locked plan, report, repository snapshot, paths, hashes, and bytes recorded in this approval.';

export class ScaffoldApplyError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldApplyError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, code) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ScaffoldApplyError(code, [String(value)]);
  }
  return value;
}

function requireSha(value, code) {
  if (typeof value !== 'string' || !SHA256_RE.test(value)) {
    throw new ScaffoldApplyError(code, [String(value)]);
  }
  return value;
}

function requireDate(value, code) {
  requireString(value, code);
  if (Number.isNaN(Date.parse(value))) {
    throw new ScaffoldApplyError(code, [value]);
  }
  return value;
}

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function realDirectory(value, code) {
  requireString(value, code);

  if (!path.isAbsolute(value)) {
    throw new ScaffoldApplyError(`${code}_MUST_BE_ABSOLUTE`, [value]);
  }

  const stat = fs.lstatSync(value);

  if (stat.isSymbolicLink()) {
    throw new ScaffoldApplyError(`${code}_MUST_NOT_BE_SYMLINK`, [value]);
  }

  if (!stat.isDirectory()) {
    throw new ScaffoldApplyError(`${code}_MUST_BE_DIRECTORY`, [value]);
  }

  return fs.realpathSync(value);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertPathInsideRepository(repositoryRoot, relativePath) {
  if (!isSafeRepositoryPath(relativePath)) {
    throw new ScaffoldApplyError('OUTPUT_PATH_UNSAFE', [relativePath]);
  }

  const absolute = path.resolve(repositoryRoot, relativePath);

  if (!isInside(repositoryRoot, absolute) || absolute === repositoryRoot) {
    throw new ScaffoldApplyError(
      'OUTPUT_PATH_ESCAPES_REPOSITORY',
      [relativePath]
    );
  }

  return absolute;
}

function listRepositoryEntries(repositoryRoot) {
  const entries = [];

  function visit(current) {
    const children = fs.readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const child of children) {
      if (current === repositoryRoot && child.name === '.git') {
        continue;
      }

      const absolute = path.join(current, child.name);
      const relative = path.relative(repositoryRoot, absolute)
        .split(path.sep)
        .join('/');
      const stat = fs.lstatSync(absolute);

      if (stat.isSymbolicLink()) {
        entries.push({
          path: relative,
          type: 'symlink',
          target: fs.readlinkSync(absolute)
        });
        continue;
      }

      if (stat.isDirectory()) {
        visit(absolute);
        continue;
      }

      if (!stat.isFile()) {
        throw new ScaffoldApplyError(
          'REPOSITORY_SPECIAL_FILE_UNSUPPORTED',
          [relative]
        );
      }

      const bytes = fs.readFileSync(absolute);
      entries.push({
        path: relative,
        type: 'file',
        bytes: bytes.length,
        mode: stat.mode & 0o777,
        sha256: sha256Bytes(bytes)
      });
    }
  }

  visit(repositoryRoot);
  return entries;
}

export function snapshotRepositoryTree(repositoryRoot) {
  const root = realDirectory(repositoryRoot, 'REPOSITORY_ROOT');
  const entries = listRepositoryEntries(root);

  return Object.freeze({
    schemaVersion: 1,
    repositoryRoot: root,
    entries: Object.freeze(entries.map(entry => Object.freeze(entry))),
    treeSha256: sha256Canonical(entries)
  });
}

export function compareRepositorySnapshots(before, after) {
  if (!isPlainObject(before) || !isPlainObject(after)) {
    throw new ScaffoldApplyError('REPOSITORY_SNAPSHOTS_REQUIRED');
  }

  requireSha(before.treeSha256, 'BEFORE_TREE_HASH_INVALID');
  requireSha(after.treeSha256, 'AFTER_TREE_HASH_INVALID');

  const left = new Map(
    before.entries.map(entry => [entry.path, canonicalJson(entry)])
  );
  const right = new Map(
    after.entries.map(entry => [entry.path, canonicalJson(entry)])
  );

  const paths = [...new Set([...left.keys(), ...right.keys()])].sort();
  return paths.filter(candidate => left.get(candidate) !== right.get(candidate));
}

function exactOutputs(renderResult) {
  if (
    !isPlainObject(renderResult) ||
    !Array.isArray(renderResult.outputs) ||
    renderResult.outputs.length === 0 ||
    !isPlainObject(renderResult.renderedPlan)
  ) {
    throw new ScaffoldApplyError('VALID_RENDER_RESULT_REQUIRED');
  }

  verifyScaffoldPlanHash(renderResult.renderedPlan);

  return renderResult.outputs
    .map(output => {
      if (output.operation !== 'CREATE') {
        throw new ScaffoldApplyError(
          'MODIFY_BASE_HASH_NOT_DEFINED',
          [output.path, output.operation]
        );
      }

      if (!isSafeRepositoryPath(output.path)) {
        throw new ScaffoldApplyError(
          'OUTPUT_PATH_UNSAFE',
          [output.path]
        );
      }

      requireSha(output.sha256, 'OUTPUT_HASH_INVALID');

      if (
        !Number.isInteger(output.bytes) ||
        output.bytes < 0
      ) {
        throw new ScaffoldApplyError(
          'OUTPUT_BYTE_COUNT_INVALID',
          [output.path]
        );
      }

      return {
        path: output.path,
        operation: 'CREATE',
        sha256: output.sha256,
        bytes: output.bytes
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

function verifyApprovalHashOnly(approval) {
  if (!isPlainObject(approval)) {
    throw new ScaffoldApplyError('APPROVAL_OBJECT_REQUIRED');
  }

  requireSha(approval.approvalSha256, 'APPROVAL_HASH_INVALID');

  const calculated = sha256Canonical({
    ...approval,
    approvalSha256: null
  });

  if (calculated !== approval.approvalSha256) {
    throw new ScaffoldApplyError(
      'APPROVAL_HASH_MISMATCH',
      [calculated, approval.approvalSha256]
    );
  }

  return true;
}

export function createApprovalRecord({
  approvalId,
  actor,
  actorRole = 'PROJECT_OWNER',
  approvedAt,
  expiresAt = null,
  validationReport,
  renderResult,
  repositorySnapshot,
  decision
}) {
  requireString(approvalId, 'APPROVAL_ID_REQUIRED');
  if (!APPROVAL_ID_RE.test(approvalId)) {
    throw new ScaffoldApplyError('APPROVAL_ID_INVALID', [approvalId]);
  }

  requireString(actor, 'APPROVAL_ACTOR_REQUIRED');
  if (actorRole !== 'PROJECT_OWNER') {
    throw new ScaffoldApplyError(
      'APPROVAL_ACTOR_ROLE_INVALID',
      [String(actorRole)]
    );
  }

  requireDate(approvedAt, 'APPROVED_AT_INVALID');

  if (expiresAt !== null) {
    requireDate(expiresAt, 'APPROVAL_EXPIRES_AT_INVALID');
    if (Date.parse(expiresAt) <= Date.parse(approvedAt)) {
      throw new ScaffoldApplyError(
        'APPROVAL_EXPIRY_MUST_FOLLOW_APPROVAL'
      );
    }
  }

  if (decision !== 'APPROVE_EXACT_PLAN') {
    throw new ScaffoldApplyError(
      'EXACT_APPROVAL_CONFIRMATION_REQUIRED'
    );
  }

  assertValidationReportPass(validationReport);
  verifyValidationReportHash(validationReport);

  const outputs = exactOutputs(renderResult);

  if (
    renderResult.renderedPlan.planSha256 !==
    validationReport.planSha256
  ) {
    throw new ScaffoldApplyError(
      'VALIDATION_PLAN_HASH_MISMATCH'
    );
  }

  if (
    renderResult.renderDigest !==
    validationReport.renderDigest
  ) {
    throw new ScaffoldApplyError(
      'VALIDATION_RENDER_DIGEST_MISMATCH'
    );
  }

  if (!isPlainObject(repositorySnapshot)) {
    throw new ScaffoldApplyError('REPOSITORY_SNAPSHOT_REQUIRED');
  }
  requireSha(
    repositorySnapshot.treeSha256,
    'REPOSITORY_SNAPSHOT_HASH_INVALID'
  );

  const draft = {
    schemaVersion: 1,
    approvalId,
    decision: 'APPROVE_EXACT_PLAN',
    actor,
    actorRole: 'PROJECT_OWNER',
    approvedAt,
    expiresAt,
    planId: renderResult.renderedPlan.planId,
    planSha256: renderResult.renderedPlan.planSha256,
    reportId: validationReport.reportId,
    reportSha256: validationReport.reportSha256,
    scaffold: renderResult.scaffold,
    sourceRef: validationReport.sourceRef,
    repositoryBeforeSha256: repositorySnapshot.treeSha256,
    outputs,
    statement: APPROVAL_STATEMENT,
    approvalSha256: '0'.repeat(64)
  };

  draft.approvalSha256 = sha256Canonical({
    ...draft,
    approvalSha256: null
  });

  verifyApprovalHashOnly(draft);
  return Object.freeze(draft);
}

export function verifyApprovalRecord({
  approval,
  validationReport,
  renderResult,
  repositorySnapshot,
  at
}) {
  verifyApprovalHashOnly(approval);
  requireDate(at, 'APPROVAL_VERIFICATION_TIME_INVALID');

  if (
    approval.schemaVersion !== 1 ||
    !APPROVAL_ID_RE.test(approval.approvalId ?? '') ||
    approval.decision !== 'APPROVE_EXACT_PLAN' ||
    approval.actorRole !== 'PROJECT_OWNER' ||
    approval.statement !== APPROVAL_STATEMENT
  ) {
    throw new ScaffoldApplyError('APPROVAL_STRUCTURE_INVALID');
  }

  requireString(approval.actor, 'APPROVAL_ACTOR_REQUIRED');
  requireDate(approval.approvedAt, 'APPROVED_AT_INVALID');

  if (Date.parse(at) < Date.parse(approval.approvedAt)) {
    throw new ScaffoldApplyError(
      'APPROVAL_USED_BEFORE_APPROVAL_TIME'
    );
  }

  if (
    approval.expiresAt !== null &&
    Date.parse(at) > Date.parse(approval.expiresAt)
  ) {
    throw new ScaffoldApplyError('APPROVAL_EXPIRED');
  }

  assertValidationReportPass(validationReport);
  verifyValidationReportHash(validationReport);
  const outputs = exactOutputs(renderResult);

  const bindings = [
    ['planId', renderResult.renderedPlan.planId],
    ['planSha256', renderResult.renderedPlan.planSha256],
    ['reportId', validationReport.reportId],
    ['reportSha256', validationReport.reportSha256],
    ['scaffold', renderResult.scaffold],
    ['sourceRef', validationReport.sourceRef],
    ['repositoryBeforeSha256', repositorySnapshot.treeSha256]
  ];

  for (const [field, expected] of bindings) {
    if (approval[field] !== expected) {
      throw new ScaffoldApplyError(
        'APPROVAL_BINDING_MISMATCH',
        [field, String(approval[field]), String(expected)]
      );
    }
  }

  if (
    canonicalJson(approval.outputs) !==
    canonicalJson(outputs)
  ) {
    throw new ScaffoldApplyError(
      'APPROVAL_OUTPUT_SET_MISMATCH'
    );
  }

  return true;
}

function ensureSafeParentDirectories(
  repositoryRoot,
  targetDirectory,
  createdDirectories
) {
  const relative = path.relative(repositoryRoot, targetDirectory);
  const segments = relative === '' ? [] : relative.split(path.sep);
  let current = repositoryRoot;

  for (const segment of segments) {
    current = path.join(current, segment);

    if (fs.existsSync(current)) {
      const stat = fs.lstatSync(current);

      if (stat.isSymbolicLink()) {
        throw new ScaffoldApplyError(
          'OUTPUT_PARENT_SYMLINK_BLOCKED',
          [current]
        );
      }

      if (!stat.isDirectory()) {
        throw new ScaffoldApplyError(
          'OUTPUT_PARENT_NOT_DIRECTORY',
          [current]
        );
      }

      continue;
    }

    fs.mkdirSync(current, { mode: 0o755 });
    createdDirectories.push(current);
  }
}

function removeEmptyDirectories(createdDirectories) {
  for (
    const directory of [...createdDirectories].reverse()
  ) {
    try {
      fs.rmdirSync(directory);
    } catch (error) {
      if (
        error?.code !== 'ENOTEMPTY' &&
        error?.code !== 'ENOENT'
      ) {
        throw error;
      }
    }
  }
}

function verifyApplyResultHashOnly(applyResult) {
  if (!isPlainObject(applyResult)) {
    throw new ScaffoldApplyError('APPLY_RESULT_OBJECT_REQUIRED');
  }

  requireSha(
    applyResult.applyResultSha256,
    'APPLY_RESULT_HASH_INVALID'
  );

  const calculated = sha256Canonical({
    ...applyResult,
    applyResultSha256: null
  });

  if (calculated !== applyResult.applyResultSha256) {
    throw new ScaffoldApplyError(
      'APPLY_RESULT_HASH_MISMATCH',
      [calculated, applyResult.applyResultSha256]
    );
  }

  return true;
}

export function applyApprovedScaffold({
  applyId,
  approval,
  validationReport,
  renderResult,
  stagingDirectory,
  repositoryRoot,
  appliedAt
}) {
  requireString(applyId, 'APPLY_ID_REQUIRED');
  if (!APPLY_ID_RE.test(applyId)) {
    throw new ScaffoldApplyError('APPLY_ID_INVALID', [applyId]);
  }
  requireDate(appliedAt, 'APPLIED_AT_INVALID');

  assertValidationReportPass(validationReport);
  verifyValidationReportHash(validationReport);
  verifyStagedScaffold(renderResult, stagingDirectory);

  const realRepository = realDirectory(
    repositoryRoot,
    'REPOSITORY_ROOT'
  );
  const before = snapshotRepositoryTree(realRepository);

  verifyApprovalRecord({
    approval,
    validationReport,
    renderResult,
    repositorySnapshot: before,
    at: appliedAt
  });

  const approvedOutputs = exactOutputs(renderResult);
  const stagedByPath = new Map(
    renderResult.outputs.map(output => [
      output.path,
      path.resolve(stagingDirectory, output.path)
    ])
  );

  const createdDirectories = [];
  const tempFiles = [];
  const finalFiles = [];
  let pendingRenameTarget = null;
  const transactionSuffix = crypto.randomUUID();

  try {
    for (const output of approvedOutputs) {
      const target = assertPathInsideRepository(
        realRepository,
        output.path
      );

      if (fs.existsSync(target)) {
        throw new ScaffoldApplyError(
          'CREATE_TARGET_EXISTS',
          [output.path]
        );
      }

      const parent = path.dirname(target);
      ensureSafeParentDirectories(
        realRepository,
        parent,
        createdDirectories
      );

      const stagedPath = stagedByPath.get(output.path);

      if (!stagedPath || !fs.existsSync(stagedPath)) {
        throw new ScaffoldApplyError(
          'STAGED_OUTPUT_MISSING',
          [output.path]
        );
      }

      const stagedStat = fs.lstatSync(stagedPath);

      if (
        stagedStat.isSymbolicLink() ||
        !stagedStat.isFile()
      ) {
        throw new ScaffoldApplyError(
          'STAGED_OUTPUT_NOT_REGULAR_FILE',
          [output.path]
        );
      }

      const bytes = fs.readFileSync(stagedPath);

      if (
        bytes.length !== output.bytes ||
        sha256Bytes(bytes) !== output.sha256
      ) {
        throw new ScaffoldApplyError(
          'STAGED_OUTPUT_BYTES_MISMATCH',
          [output.path]
        );
      }

      const temp = path.join(
        parent,
        `.${path.basename(target)}.forge-tmp-${transactionSuffix}`
      );

      fs.writeFileSync(
        temp,
        bytes,
        { flag: 'wx', mode: 0o644 }
      );

      const tempBytes = fs.readFileSync(temp);

      if (
        tempBytes.length !== output.bytes ||
        sha256Bytes(tempBytes) !== output.sha256
      ) {
        throw new ScaffoldApplyError(
          'TRANSACTION_FILE_VERIFY_FAILED',
          [output.path]
        );
      }

      tempFiles.push(temp);
    }

    for (let index = 0; index < approvedOutputs.length; index += 1) {
      const output = approvedOutputs[index];
      const target = assertPathInsideRepository(
        realRepository,
        output.path
      );
      const temp = tempFiles[index];

      pendingRenameTarget = target;
      fs.renameSync(temp, target);
      finalFiles.push(target);
      pendingRenameTarget = null;
    }

    for (const output of approvedOutputs) {
      const target = assertPathInsideRepository(
        realRepository,
        output.path
      );
      const stat = fs.lstatSync(target);

      if (
        stat.isSymbolicLink() ||
        !stat.isFile()
      ) {
        throw new ScaffoldApplyError(
          'APPLIED_OUTPUT_NOT_REGULAR_FILE',
          [output.path]
        );
      }

      const bytes = fs.readFileSync(target);

      if (
        bytes.length !== output.bytes ||
        sha256Bytes(bytes) !== output.sha256
      ) {
        throw new ScaffoldApplyError(
          'APPLIED_OUTPUT_VERIFY_FAILED',
          [output.path]
        );
      }
    }

    const after = snapshotRepositoryTree(realRepository);
    const changedPaths = compareRepositorySnapshots(
      before,
      after
    );
    const expectedPaths = approvedOutputs
      .map(output => output.path)
      .sort();

    if (
      canonicalJson(changedPaths) !==
      canonicalJson(expectedPaths)
    ) {
      throw new ScaffoldApplyError(
        'FINAL_DIFF_PATH_SET_MISMATCH',
        [
          `expected=${expectedPaths.join(',')}`,
          `actual=${changedPaths.join(',')}`
        ]
      );
    }

    const draft = {
      schemaVersion: 1,
      applyId,
      approvalId: approval.approvalId,
      approvalSha256: approval.approvalSha256,
      planId: renderResult.renderedPlan.planId,
      planSha256: renderResult.renderedPlan.planSha256,
      reportId: validationReport.reportId,
      reportSha256: validationReport.reportSha256,
      scaffold: renderResult.scaffold,
      appliedAt,
      repositoryBeforeSha256: before.treeSha256,
      repositoryAfterSha256: after.treeSha256,
      changedPaths,
      outputs: approvedOutputs.map(output => ({
        ...output,
        applied: true
      })),
      gitOperations: false,
      networkOperations: false,
      providerOperations: false,
      status: 'PASS',
      errors: [],
      applyResultSha256: '0'.repeat(64)
    };

    draft.applyResultSha256 = sha256Canonical({
      ...draft,
      applyResultSha256: null
    });

    verifyApplyResultHashOnly(draft);
    return Object.freeze(draft);
  } catch (error) {
    const rollbackErrors = [];

    const rollbackTargets = [
      ...(pendingRenameTarget ? [pendingRenameTarget] : []),
      ...[...finalFiles].reverse()
    ];

    for (const target of [...new Set(rollbackTargets)]) {
      try {
        fs.rmSync(target, { force: true });
      } catch (rollbackError) {
        rollbackErrors.push(
          `FINAL:${target}:${rollbackError.message}`
        );
      }
    }

    for (const temp of tempFiles) {
      try {
        fs.rmSync(temp, { force: true });
      } catch (rollbackError) {
        rollbackErrors.push(
          `TEMP:${temp}:${rollbackError.message}`
        );
      }
    }

    try {
      removeEmptyDirectories(createdDirectories);
    } catch (rollbackError) {
      rollbackErrors.push(
        `DIRECTORY:${rollbackError.message}`
      );
    }

    let rollbackStatus = 'PASS';

    try {
      const rolledBack = snapshotRepositoryTree(
        realRepository
      );

      if (rolledBack.treeSha256 !== before.treeSha256) {
        rollbackStatus = 'FAIL';
        rollbackErrors.push(
          `TREE:${rolledBack.treeSha256}:${before.treeSha256}`
        );
      }
    } catch (rollbackError) {
      rollbackStatus = 'FAIL';
      rollbackErrors.push(
        `SNAPSHOT:${rollbackError.message}`
      );
    }

    throw new ScaffoldApplyError(
      'APPLY_TRANSACTION_FAILED',
      [
        `cause=${error?.code ?? error?.name ?? 'ERROR'}`,
        `rollback=${rollbackStatus}`,
        ...rollbackErrors
      ]
    );
  }
}

export function verifyAppliedScaffold({
  applyResult,
  approval,
  validationReport,
  renderResult,
  repositoryRoot
}) {
  verifyApplyResultHashOnly(applyResult);
  verifyApprovalHashOnly(approval);
  assertValidationReportPass(validationReport);
  verifyValidationReportHash(validationReport);
  verifyScaffoldPlanHash(renderResult.renderedPlan);

  const bindings = [
    ['approvalId', approval.approvalId],
    ['approvalSha256', approval.approvalSha256],
    ['planId', renderResult.renderedPlan.planId],
    ['planSha256', renderResult.renderedPlan.planSha256],
    ['reportId', validationReport.reportId],
    ['reportSha256', validationReport.reportSha256],
    ['scaffold', renderResult.scaffold]
  ];

  for (const [field, expected] of bindings) {
    if (applyResult[field] !== expected) {
      throw new ScaffoldApplyError(
        'APPLY_RESULT_BINDING_MISMATCH',
        [field]
      );
    }
  }

  if (
    applyResult.status !== 'PASS' ||
    applyResult.errors.length !== 0 ||
    applyResult.gitOperations !== false ||
    applyResult.networkOperations !== false ||
    applyResult.providerOperations !== false
  ) {
    throw new ScaffoldApplyError(
      'APPLY_RESULT_STATUS_INVALID'
    );
  }

  const current = snapshotRepositoryTree(repositoryRoot);

  if (
    current.treeSha256 !==
    applyResult.repositoryAfterSha256
  ) {
    throw new ScaffoldApplyError(
      'APPLIED_REPOSITORY_HASH_MISMATCH',
      [current.treeSha256, applyResult.repositoryAfterSha256]
    );
  }

  const expectedOutputs = exactOutputs(renderResult);

  if (
    canonicalJson(
      applyResult.outputs.map(output => ({
        path: output.path,
        operation: output.operation,
        sha256: output.sha256,
        bytes: output.bytes
      }))
    ) !==
    canonicalJson(expectedOutputs)
  ) {
    throw new ScaffoldApplyError(
      'APPLY_RESULT_OUTPUT_SET_MISMATCH'
    );
  }

  for (const output of expectedOutputs) {
    const target = assertPathInsideRepository(
      current.repositoryRoot,
      output.path
    );
    const stat = fs.lstatSync(target);

    if (
      stat.isSymbolicLink() ||
      !stat.isFile()
    ) {
      throw new ScaffoldApplyError(
        'APPLIED_OUTPUT_NOT_REGULAR_FILE',
        [output.path]
      );
    }

    const bytes = fs.readFileSync(target);

    if (
      bytes.length !== output.bytes ||
      sha256Bytes(bytes) !== output.sha256
    ) {
      throw new ScaffoldApplyError(
        'APPLIED_OUTPUT_VERIFY_FAILED',
        [output.path]
      );
    }
  }

  const expectedPaths = expectedOutputs
    .map(output => output.path)
    .sort();

  if (
    canonicalJson(applyResult.changedPaths) !==
    canonicalJson(expectedPaths)
  ) {
    throw new ScaffoldApplyError(
      'APPLY_RESULT_CHANGED_PATHS_MISMATCH'
    );
  }

  return true;
}

function finalValidationEntries({
  validationReport,
  approval,
  applyResult
}) {
  const byId = new Map();

  for (const validation of validationReport.validations) {
    if (validation.status === 'FAIL') {
      throw new ScaffoldApplyError(
        'FAILED_VALIDATION_CANNOT_FINALIZE',
        [validation.id]
      );
    }

    byId.set(validation.id, {
      id: validation.id,
      status: 'PASS',
      evidence: [...validation.evidence]
    });
  }

  byId.set('SCV-018', {
    id: 'SCV-018',
    status: 'PASS',
    evidence: [
      `approvalId=${approval.approvalId}`,
      `approvalSha256=${approval.approvalSha256}`,
      `actor=${approval.actor}`,
      `approvedAt=${approval.approvedAt}`
    ]
  });

  byId.set('SCV-023', {
    id: 'SCV-023',
    status: 'PASS',
    evidence: [
      `repositoryBeforeSha256=${applyResult.repositoryBeforeSha256}`,
      `repositoryAfterSha256=${applyResult.repositoryAfterSha256}`,
      `changedPaths=${applyResult.changedPaths.join(',')}`
    ]
  });

  byId.set('SCV-024', {
    id: 'SCV-024',
    status: 'PASS',
    evidence: [
      `expectedRepositoryWrites=${applyResult.changedPaths.length}`,
      'gitOperations=false',
      'networkOperations=false',
      'providerOperations=false'
    ]
  });

  byId.set('SCV-020', {
    id: 'SCV-020',
    status: 'PASS',
    evidence: [
      'finalReceiptContract=PASS',
      'finalReceiptHash=CALCULATED',
      'errors=0'
    ]
  });

  return [...byId.values()]
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function createFinalReceipt({
  receiptId,
  validationReport,
  renderResult,
  approval,
  applyResult,
  repositoryRoot,
  environment,
  startedAt,
  finishedAt
}) {
  requireString(receiptId, 'RECEIPT_ID_REQUIRED');
  if (!RECEIPT_ID_RE.test(receiptId)) {
    throw new ScaffoldApplyError(
      'RECEIPT_ID_INVALID',
      [receiptId]
    );
  }

  requireDate(startedAt, 'RECEIPT_STARTED_AT_INVALID');
  requireDate(finishedAt, 'RECEIPT_FINISHED_AT_INVALID');

  if (Date.parse(finishedAt) < Date.parse(startedAt)) {
    throw new ScaffoldApplyError(
      'RECEIPT_FINISHED_BEFORE_STARTED'
    );
  }

  verifyAppliedScaffold({
    applyResult,
    approval,
    validationReport,
    renderResult,
    repositoryRoot
  });

  if (!isPlainObject(environment)) {
    throw new ScaffoldApplyError(
      'RECEIPT_ENVIRONMENT_REQUIRED'
    );
  }

  const environmentFields = [
    'engineVersion',
    'nodeVersion',
    'platform',
    'sourceRef',
    'workingTreeCleanBefore'
  ];

  for (const field of environmentFields) {
    if (!Object.hasOwn(environment, field)) {
      throw new ScaffoldApplyError(
        'RECEIPT_ENVIRONMENT_FIELD_MISSING',
        [field]
      );
    }
  }

  if (
    environment.sourceRef !==
    validationReport.sourceRef
  ) {
    throw new ScaffoldApplyError(
      'RECEIPT_SOURCE_REF_MISMATCH'
    );
  }

  const receipt = {
    schemaVersion: 1,
    receiptId,
    runId: validationReport.runId,
    planId: renderResult.renderedPlan.planId,
    planSha256: renderResult.renderedPlan.planSha256,
    scaffold: renderResult.scaffold,
    status: 'PASS',
    startedAt,
    finishedAt,
    approval: {
      required: true,
      present: true,
      actor: approval.actor,
      approvedAt: approval.approvedAt,
      planSha256: approval.planSha256
    },
    environment: {
      engineVersion: environment.engineVersion,
      nodeVersion: environment.nodeVersion,
      platform: environment.platform,
      sourceRef: environment.sourceRef,
      workingTreeCleanBefore:
        environment.workingTreeCleanBefore
    },
    outputs: applyResult.outputs.map(output => ({
      path: output.path,
      operation: output.operation,
      sha256: output.sha256,
      bytes: output.bytes,
      applied: true
    })),
    validations: finalValidationEntries({
      validationReport,
      approval,
      applyResult
    }),
    errors: [],
    receiptSha256: '0'.repeat(64)
  };

  receipt.receiptSha256 = sha256Canonical({
    ...receipt,
    receiptSha256: null
  });

  assertScaffoldReceipt(receipt);
  verifyFinalReceipt(receipt);
  return Object.freeze(receipt);
}

export function verifyFinalReceipt(receipt) {
  assertScaffoldReceipt(receipt);
  requireSha(receipt.receiptSha256, 'RECEIPT_HASH_INVALID');

  const calculated = sha256Canonical({
    ...receipt,
    receiptSha256: null
  });

  if (calculated !== receipt.receiptSha256) {
    throw new ScaffoldApplyError(
      'RECEIPT_HASH_MISMATCH',
      [calculated, receipt.receiptSha256]
    );
  }

  if (
    receipt.status !== 'PASS' ||
    receipt.errors.length !== 0 ||
    receipt.approval.present !== true ||
    receipt.outputs.some(output => output.applied !== true) ||
    receipt.validations.some(
      validation => validation.status !== 'PASS'
    )
  ) {
    throw new ScaffoldApplyError(
      'FINAL_RECEIPT_STATUS_INVALID'
    );
  }

  for (const id of ['SCV-018', 'SCV-020', 'SCV-023']) {
    if (
      !receipt.validations.some(
        validation =>
          validation.id === id &&
          validation.status === 'PASS'
      )
    ) {
      throw new ScaffoldApplyError(
        'FINAL_RECEIPT_VALIDATION_MISSING',
        [id]
      );
    }
  }

  return true;
}

function writeJsonEvidence({
  value,
  filename,
  directoryPrefix,
  evidenceParent,
  repositoryRoot,
  verifier
}) {
  const realParent = realDirectory(
    evidenceParent,
    'EVIDENCE_PARENT'
  );
  const realRepository = realDirectory(
    repositoryRoot,
    'REPOSITORY_ROOT'
  );

  if (isInside(realRepository, realParent)) {
    throw new ScaffoldApplyError(
      'EVIDENCE_PARENT_INSIDE_REPOSITORY',
      [realParent]
    );
  }

  const evidenceDirectory = fs.mkdtempSync(
    path.join(realParent, directoryPrefix)
  );

  try {
    const destination = path.join(
      evidenceDirectory,
      filename
    );
    const text = `${JSON.stringify(value, null, 2)}\n`;

    fs.writeFileSync(
      destination,
      Buffer.from(text, 'utf8'),
      { flag: 'wx', mode: 0o600 }
    );

    const bytes = fs.readFileSync(destination);
    const parsed = JSON.parse(bytes.toString('utf8'));
    verifier(parsed);

    if (canonicalJson(parsed) !== canonicalJson(value)) {
      throw new ScaffoldApplyError(
        'WRITTEN_EVIDENCE_CONTENT_MISMATCH'
      );
    }

    return Object.freeze({
      evidenceDirectory,
      evidencePath: destination,
      fileSha256: sha256Bytes(bytes),
      bytes: bytes.length,
      repositoryTouched: false
    });
  } catch (error) {
    fs.rmSync(
      evidenceDirectory,
      { recursive: true, force: true }
    );
    throw error;
  }
}

export function writeFinalReceiptEvidence({
  receipt,
  evidenceParent,
  repositoryRoot
}) {
  verifyFinalReceipt(receipt);

  return writeJsonEvidence({
    value: receipt,
    filename: `${receipt.receiptId}.json`,
    directoryPrefix: 'forge-scaffold-final-receipt-',
    evidenceParent,
    repositoryRoot,
    verifier: verifyFinalReceipt
  });
}

export function writeApplyResultEvidence({
  applyResult,
  evidenceParent,
  repositoryRoot
}) {
  verifyApplyResultHashOnly(applyResult);

  return writeJsonEvidence({
    value: applyResult,
    filename: `${applyResult.applyId}.json`,
    directoryPrefix: 'forge-scaffold-apply-result-',
    evidenceParent,
    repositoryRoot,
    verifier: verifyApplyResultHashOnly
  });
}

export {
  APPROVAL_STATEMENT,
  ContractValidationError,
  ScaffoldPlanError,
  ScaffoldReceiptError,
  ScaffoldRenderError,
  ScaffoldValidationError,
  stableReceiptJson,
  verifyApplyResultHashOnly,
  verifyApprovalHashOnly
};
