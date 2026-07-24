import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  ContractValidationError,
  assertScaffoldReceipt,
  canonicalJson,
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  ScaffoldValidationError,
  assertValidationReportPass,
  verifyValidationReportHash
} from '../scaffold-validator/index.mjs';

const SHA256_RE = /^[a-f0-9]{64}$/;
const RECEIPT_ID_RE = /^SRCPT-[A-Z0-9-]+$/;

export class ScaffoldReceiptError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldReceiptError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, code) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ScaffoldReceiptError(code, [String(value)]);
  }
  return value;
}

function requireSha(value, code) {
  if (typeof value !== 'string' || !SHA256_RE.test(value)) {
    throw new ScaffoldReceiptError(code, [String(value)]);
  }
  return value;
}

function realDirectory(value, code) {
  requireString(value, code);

  if (!path.isAbsolute(value)) {
    throw new ScaffoldReceiptError(`${code}_MUST_BE_ABSOLUTE`, [value]);
  }

  const stat = fs.lstatSync(value);

  if (stat.isSymbolicLink()) {
    throw new ScaffoldReceiptError(`${code}_MUST_NOT_BE_SYMLINK`, [value]);
  }

  if (!stat.isDirectory()) {
    throw new ScaffoldReceiptError(`${code}_MUST_BE_DIRECTORY`, [value]);
  }

  return fs.realpathSync(value);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function stableReceiptJson(receipt) {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function createPreApplyReceipt({
  receiptId,
  validationReport,
  renderResult,
  environment,
  startedAt,
  finishedAt
}) {
  requireString(receiptId, 'RECEIPT_ID_REQUIRED');
  if (!RECEIPT_ID_RE.test(receiptId)) {
    throw new ScaffoldReceiptError('RECEIPT_ID_INVALID', [receiptId]);
  }

  requireString(startedAt, 'RECEIPT_STARTED_AT_REQUIRED');
  requireString(finishedAt, 'RECEIPT_FINISHED_AT_REQUIRED');

  if (
    Number.isNaN(Date.parse(startedAt)) ||
    Number.isNaN(Date.parse(finishedAt))
  ) {
    throw new ScaffoldReceiptError('RECEIPT_DATE_INVALID');
  }

  if (Date.parse(finishedAt) < Date.parse(startedAt)) {
    throw new ScaffoldReceiptError('RECEIPT_FINISHED_BEFORE_STARTED');
  }

  assertValidationReportPass(validationReport);

  if (
    !isPlainObject(renderResult) ||
    !isPlainObject(renderResult.renderedPlan) ||
    renderResult.reproducibility !== 'PASS'
  ) {
    throw new ScaffoldReceiptError('VALID_RENDER_RESULT_REQUIRED');
  }

  if (
    renderResult.renderedPlan.planSha256 !==
    validationReport.planSha256
  ) {
    throw new ScaffoldReceiptError(
      'VALIDATION_PLAN_HASH_MISMATCH'
    );
  }

  if (
    renderResult.renderDigest !==
    validationReport.renderDigest
  ) {
    throw new ScaffoldReceiptError(
      'VALIDATION_RENDER_DIGEST_MISMATCH'
    );
  }

  if (!isPlainObject(environment)) {
    throw new ScaffoldReceiptError('RECEIPT_ENVIRONMENT_REQUIRED');
  }

  const requiredEnvironment = [
    'engineVersion',
    'nodeVersion',
    'platform',
    'sourceRef',
    'workingTreeCleanBefore'
  ];

  for (const field of requiredEnvironment) {
    if (!Object.hasOwn(environment, field)) {
      throw new ScaffoldReceiptError(
        'RECEIPT_ENVIRONMENT_FIELD_MISSING',
        [field]
      );
    }
  }

  if (
    environment.sourceRef !==
    validationReport.sourceRef
  ) {
    throw new ScaffoldReceiptError(
      'RECEIPT_SOURCE_REF_MISMATCH'
    );
  }

  const validationEntries = validationReport.validations
    .map(validation => ({
      id: validation.id,
      status:
        validation.status === 'DEFERRED'
          ? 'NOT_APPLICABLE'
          : validation.status,
      evidence: [
        ...validation.evidence,
        ...(validation.status === 'DEFERRED'
          ? ['PRE_APPLY_DEFERRED_TO_WAVE_5']
          : [])
      ]
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  const draft = {
    schemaVersion: 1,
    receiptId,
    runId: validationReport.runId,
    planId: renderResult.renderedPlan.planId,
    planSha256: validationReport.planSha256,
    scaffold: validationReport.scaffold,
    status: 'BLOCKED',
    startedAt,
    finishedAt,
    approval: {
      required: true,
      present: false,
      actor: null,
      approvedAt: null,
      planSha256: null
    },
    environment: {
      engineVersion: environment.engineVersion,
      nodeVersion: environment.nodeVersion,
      platform: environment.platform,
      sourceRef: environment.sourceRef,
      workingTreeCleanBefore:
        environment.workingTreeCleanBefore
    },
    outputs: renderResult.outputs.map(output => ({
      path: output.path,
      operation: output.operation,
      sha256: output.sha256,
      bytes: output.bytes,
      applied: false
    })),
    validations: validationEntries,
    errors: [
      'APPLY_NOT_EXECUTED_WAVE_5_REQUIRED'
    ],
    receiptSha256: '0'.repeat(64)
  };

  draft.receiptSha256 = sha256Canonical({
    ...draft,
    receiptSha256: null
  });

  assertScaffoldReceipt(draft);
  return Object.freeze(draft);
}

export function verifyReceiptHash(receipt) {
  assertScaffoldReceipt(receipt);
  requireSha(receipt.receiptSha256, 'RECEIPT_HASH_INVALID');

  const calculated = sha256Canonical({
    ...receipt,
    receiptSha256: null
  });

  if (calculated !== receipt.receiptSha256) {
    throw new ScaffoldReceiptError(
      'RECEIPT_HASH_MISMATCH',
      [calculated, receipt.receiptSha256]
    );
  }

  return true;
}

export function verifyPreApplyReceipt(receipt) {
  verifyReceiptHash(receipt);

  if (receipt.status !== 'BLOCKED') {
    throw new ScaffoldReceiptError(
      'PRE_APPLY_RECEIPT_MUST_BE_BLOCKED'
    );
  }

  if (
    !receipt.errors.includes(
      'APPLY_NOT_EXECUTED_WAVE_5_REQUIRED'
    )
  ) {
    throw new ScaffoldReceiptError(
      'PRE_APPLY_PENDING_APPLY_ERROR_REQUIRED'
    );
  }

  if (
    receipt.approval.present !== false ||
    receipt.outputs.some(output => output.applied !== false)
  ) {
    throw new ScaffoldReceiptError(
      'PRE_APPLY_RECEIPT_CLAIMS_APPLY_OR_APPROVAL'
    );
  }

  return true;
}

export function writeReceiptEvidence({
  receipt,
  evidenceParent,
  repositoryRoot
}) {
  verifyPreApplyReceipt(receipt);

  const realParent = realDirectory(
    evidenceParent,
    'EVIDENCE_PARENT'
  );
  const realRepository = realDirectory(
    repositoryRoot,
    'REPOSITORY_ROOT'
  );

  if (isInside(realRepository, realParent)) {
    throw new ScaffoldReceiptError(
      'EVIDENCE_PARENT_INSIDE_REPOSITORY',
      [realParent]
    );
  }

  const evidenceDirectory = fs.mkdtempSync(
    path.join(realParent, 'forge-scaffold-receipt-')
  );

  try {
    const filename = `${receipt.receiptId}.json`;
    const destination = path.join(
      evidenceDirectory,
      filename
    );
    const text = stableReceiptJson(receipt);

    fs.writeFileSync(
      destination,
      Buffer.from(text, 'utf8'),
      {
        flag: 'wx',
        mode: 0o600
      }
    );

    const bytes = fs.readFileSync(destination);
    const fileSha256 = crypto
      .createHash('sha256')
      .update(bytes)
      .digest('hex');

    const parsed = JSON.parse(bytes.toString('utf8'));
    verifyPreApplyReceipt(parsed);

    if (canonicalJson(parsed) !== canonicalJson(receipt)) {
      throw new ScaffoldReceiptError(
        'WRITTEN_RECEIPT_CONTENT_MISMATCH'
      );
    }

    return Object.freeze({
      schemaVersion: 1,
      evidenceDirectory,
      receiptPath: destination,
      receiptSha256: receipt.receiptSha256,
      fileSha256,
      bytes: bytes.length,
      repositoryTouched: false
    });
  } catch (error) {
    fs.rmSync(evidenceDirectory, {
      recursive: true,
      force: true
    });
    throw error;
  }
}

export function verifyWrittenReceipt({
  receipt,
  receiptPath
}) {
  verifyPreApplyReceipt(receipt);
  requireString(receiptPath, 'RECEIPT_PATH_REQUIRED');

  const stat = fs.lstatSync(receiptPath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new ScaffoldReceiptError(
      'RECEIPT_PATH_MUST_BE_REGULAR_FILE'
    );
  }

  const bytes = fs.readFileSync(receiptPath);
  const parsed = JSON.parse(bytes.toString('utf8'));
  verifyPreApplyReceipt(parsed);

  if (canonicalJson(parsed) !== canonicalJson(receipt)) {
    throw new ScaffoldReceiptError(
      'WRITTEN_RECEIPT_CONTENT_MISMATCH'
    );
  }

  return Object.freeze({
    pass: true,
    fileSha256: crypto
      .createHash('sha256')
      .update(bytes)
      .digest('hex'),
    bytes: bytes.length
  });
}

export function removeReceiptEvidence({
  evidenceDirectory,
  evidenceParent
}) {
  const realParent = realDirectory(
    evidenceParent,
    'EVIDENCE_PARENT'
  );
  const realEvidence = realDirectory(
    evidenceDirectory,
    'EVIDENCE_DIRECTORY'
  );

  if (
    !isInside(realParent, realEvidence) ||
    realParent === realEvidence
  ) {
    throw new ScaffoldReceiptError(
      'EVIDENCE_CLEANUP_OUTSIDE_PARENT'
    );
  }

  if (
    !path.basename(realEvidence)
      .startsWith('forge-scaffold-receipt-')
  ) {
    throw new ScaffoldReceiptError(
      'EVIDENCE_CLEANUP_PREFIX_MISMATCH'
    );
  }

  fs.rmSync(realEvidence, {
    recursive: true,
    force: false
  });

  return true;
}

export {
  ContractValidationError,
  ScaffoldValidationError,
  stableReceiptJson,
  verifyValidationReportHash
};
