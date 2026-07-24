import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  ContractValidationError,
  assertScaffoldExecutionPlan,
  canonicalJson,
  isSafeRepositoryPath,
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  ScaffoldRegistryError,
  createScaffoldRegistry
} from '../scaffold-registry/index.mjs';

import {
  ScaffoldPlanError,
  hashScaffoldPlan,
  verifyScaffoldPlanHash
} from '../scaffold-planner/index.mjs';

import {
  ScaffoldRenderError,
  renderScaffoldInMemory,
  verifyStagedScaffold
} from '../scaffold-renderer/index.mjs';

const SHA256_RE = /^[a-f0-9]{64}$/;
const VALIDATION_ID_RE = /^SCV-[0-9]{3}$/;
const REPORT_ID_RE = /^SVRPT-[A-Z0-9-]+$/;
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

const DEFERRED_TO_WAVE_5 = Object.freeze([
  'SCV-018',
  'SCV-020',
  'SCV-023'
]);

const DIRECT_VALIDATIONS = Object.freeze([
  'SCV-002',
  'SCV-004',
  'SCV-007',
  'SCV-009',
  'SCV-010',
  'SCV-011',
  'SCV-013',
  'SCV-014',
  'SCV-015',
  'SCV-017',
  'SCV-019',
  'SCV-024'
]);

export class ScaffoldValidationError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldValidationError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, code) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ScaffoldValidationError(code, [String(value)]);
  }
  return value;
}

function requireSha(value, code) {
  if (typeof value !== 'string' || !SHA256_RE.test(value)) {
    throw new ScaffoldValidationError(code, [String(value)]);
  }
  return value;
}

function realDirectory(value, code) {
  requireString(value, code);

  if (!path.isAbsolute(value)) {
    throw new ScaffoldValidationError(`${code}_MUST_BE_ABSOLUTE`, [value]);
  }

  const stat = fs.lstatSync(value);
  if (stat.isSymbolicLink()) {
    throw new ScaffoldValidationError(`${code}_MUST_NOT_BE_SYMLINK`, [value]);
  }
  if (!stat.isDirectory()) {
    throw new ScaffoldValidationError(`${code}_MUST_BE_DIRECTORY`, [value]);
  }

  return fs.realpathSync(value);
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function hashStagingDirectory(stagingDirectory) {
  const realStaging = realDirectory(stagingDirectory, 'STAGING_DIRECTORY');
  const entries = [];

  function visit(current) {
    const children = fs.readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const child of children) {
      const absolute = path.join(current, child.name);
      const relative = path.relative(realStaging, absolute)
        .split(path.sep)
        .join('/');
      const stat = fs.lstatSync(absolute);

      if (stat.isSymbolicLink()) {
        throw new ScaffoldValidationError(
          'STAGING_SYMLINK_DETECTED',
          [relative]
        );
      }

      if (stat.isDirectory()) {
        visit(absolute);
      } else if (stat.isFile()) {
        const bytes = fs.readFileSync(absolute);
        entries.push({
          path: relative,
          bytes: bytes.length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex')
        });
      } else {
        throw new ScaffoldValidationError(
          'STAGING_SPECIAL_FILE_DETECTED',
          [relative]
        );
      }
    }
  }

  visit(realStaging);
  return {
    directory: realStaging,
    directorySha256: sha256Canonical(entries),
    fileCount: entries.length,
    files: entries
  };
}

function derivePreRenderPlan(renderedPlan) {
  assertScaffoldExecutionPlan(renderedPlan);
  verifyScaffoldPlanHash(renderedPlan);

  const plan = structuredClone(renderedPlan);
  for (const output of plan.plannedOutputs) {
    output.expectedSha256 = null;
  }
  plan.planSha256 = hashScaffoldPlan(plan);
  verifyScaffoldPlanHash(plan);
  return plan;
}

function normalizeUpstreamValidations(value = []) {
  if (!Array.isArray(value)) {
    throw new ScaffoldValidationError('UPSTREAM_VALIDATIONS_ARRAY_REQUIRED');
  }

  const byId = new Map();

  for (const entry of value) {
    if (!isPlainObject(entry)) {
      throw new ScaffoldValidationError('UPSTREAM_VALIDATION_OBJECT_REQUIRED');
    }
    if (!VALIDATION_ID_RE.test(entry.id ?? '')) {
      throw new ScaffoldValidationError(
        'UPSTREAM_VALIDATION_ID_INVALID',
        [String(entry.id)]
      );
    }
    if (entry.status !== 'PASS') {
      throw new ScaffoldValidationError(
        'UPSTREAM_VALIDATION_MUST_PASS',
        [entry.id, String(entry.status)]
      );
    }
    if (!Array.isArray(entry.evidence)) {
      throw new ScaffoldValidationError(
        'UPSTREAM_VALIDATION_EVIDENCE_ARRAY_REQUIRED',
        [entry.id]
      );
    }
    if (byId.has(entry.id)) {
      throw new ScaffoldValidationError(
        'UPSTREAM_VALIDATION_DUPLICATE',
        [entry.id]
      );
    }

    byId.set(entry.id, {
      id: entry.id,
      status: 'PASS',
      evidence: [...entry.evidence]
    });
  }

  return byId;
}

function validateSideEffectSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) {
    throw new ScaffoldValidationError('SIDE_EFFECT_SNAPSHOT_REQUIRED');
  }

  const required = [
    'repositoryBefore',
    'repositoryAfter',
    'repositoryWrites',
    'gitOperations',
    'networkOperations',
    'providerOperations'
  ];

  for (const field of required) {
    if (!Object.hasOwn(snapshot, field)) {
      throw new ScaffoldValidationError(
        'SIDE_EFFECT_SNAPSHOT_FIELD_MISSING',
        [field]
      );
    }
  }

  requireSha(snapshot.repositoryBefore, 'REPOSITORY_BEFORE_HASH_INVALID');
  requireSha(snapshot.repositoryAfter, 'REPOSITORY_AFTER_HASH_INVALID');

  if (snapshot.repositoryBefore !== snapshot.repositoryAfter) {
    throw new ScaffoldValidationError('REPOSITORY_SNAPSHOT_CHANGED');
  }

  for (const field of [
    'repositoryWrites',
    'gitOperations',
    'networkOperations',
    'providerOperations'
  ]) {
    if (snapshot[field] !== false) {
      throw new ScaffoldValidationError(
        'FORBIDDEN_SIDE_EFFECT_RECORDED',
        [field]
      );
    }
  }

  return [
    `repositorySnapshot=${snapshot.repositoryBefore}`,
    'repositoryWrites=false',
    'gitOperations=false',
    'networkOperations=false',
    'providerOperations=false'
  ];
}

function compareRenderResults(expected, actual) {
  if (expected.renderDigest !== actual.renderDigest) {
    throw new ScaffoldValidationError('RENDER_DIGEST_MISMATCH');
  }

  if (expected.outputs.length !== actual.outputs.length) {
    throw new ScaffoldValidationError('RENDER_OUTPUT_COUNT_MISMATCH');
  }

  for (let index = 0; index < expected.outputs.length; index += 1) {
    const left = expected.outputs[index];
    const right = actual.outputs[index];

    for (const field of [
      'outputId',
      'path',
      'operation',
      'mediaType',
      'text',
      'bytes',
      'sha256'
    ]) {
      if (left[field] !== right[field]) {
        throw new ScaffoldValidationError(
          'RENDER_OUTPUT_MISMATCH',
          [String(index), field]
        );
      }
    }
  }

  if (
    canonicalJson(expected.renderedPlan) !==
    canonicalJson(actual.renderedPlan)
  ) {
    throw new ScaffoldValidationError('RENDERED_PLAN_MISMATCH');
  }
}

function contentEvidence(renderResult) {
  const evidence = [];

  for (const output of renderResult.outputs) {
    if (!isSafeRepositoryPath(output.path)) {
      throw new ScaffoldValidationError(
        'OUTPUT_PATH_UNSAFE',
        [output.path]
      );
    }

    if (
      typeof output.text !== 'string' ||
      output.text.includes('{{') ||
      output.text.includes('}}')
    ) {
      throw new ScaffoldValidationError(
        'UNRESOLVED_PLACEHOLDER',
        [output.path]
      );
    }

    if (CONTROL_RE.test(output.text)) {
      throw new ScaffoldValidationError(
        'OUTPUT_CONTROL_CHARACTER',
        [output.path]
      );
    }

    const bytes = Buffer.from(output.text, 'utf8');
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');

    if (bytes.length !== output.bytes) {
      throw new ScaffoldValidationError(
        'OUTPUT_BYTE_COUNT_MISMATCH',
        [output.path]
      );
    }

    if (hash !== output.sha256) {
      throw new ScaffoldValidationError(
        'OUTPUT_HASH_MISMATCH',
        [output.path]
      );
    }

    evidence.push(`${output.path}:${output.sha256}:${output.bytes}`);
  }

  return evidence;
}

function makeReport({
  reportId,
  createdAt,
  renderResult,
  stagingSummary,
  validations,
  errors
}) {
  const status = errors.length === 0 ? 'PASS' : 'FAIL';
  const deferredValidations = validations
    .filter(validation => validation.status === 'DEFERRED')
    .map(validation => validation.id)
    .sort();

  const draft = {
    schemaVersion: 1,
    reportId,
    runId: renderResult.renderedPlan.runId,
    phase: 'PRE_APPLY',
    scaffold: renderResult.scaffold,
    createdAt,
    sourceRef: renderResult.renderedPlan.sourceRef,
    status,
    planSha256: renderResult.renderedPlan.planSha256,
    renderDigest: renderResult.renderDigest,
    staging: {
      directory: stagingSummary.directory,
      directorySha256: stagingSummary.directorySha256,
      fileCount: stagingSummary.fileCount
    },
    validations: validations
      .map(entry => ({
        id: entry.id,
        status: entry.status,
        evidence: [...entry.evidence]
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    deferredValidations,
    errors: [...errors],
    reportSha256: '0'.repeat(64)
  };

  draft.reportSha256 = sha256Canonical({
    ...draft,
    reportSha256: null
  });

  return Object.freeze(draft);
}

export function validateRenderedScaffoldBundle({
  reportId,
  createdAt,
  renderResult,
  stagingDirectory,
  registry: registryValue,
  registrySha256,
  inputData,
  templateText,
  repositoryRoot,
  upstreamValidations = [],
  sideEffectSnapshot,
  softwareGateRatified = false
}) {
  requireString(reportId, 'REPORT_ID_REQUIRED');
  if (!REPORT_ID_RE.test(reportId)) {
    throw new ScaffoldValidationError('REPORT_ID_INVALID', [reportId]);
  }

  requireString(createdAt, 'REPORT_CREATED_AT_REQUIRED');
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new ScaffoldValidationError('REPORT_CREATED_AT_INVALID');
  }

  requireSha(registrySha256, 'REGISTRY_HASH_INVALID');

  if (
    !isPlainObject(renderResult) ||
    renderResult.reproducibility !== 'PASS' ||
    !Array.isArray(renderResult.outputs) ||
    renderResult.outputs.length === 0 ||
    !isPlainObject(renderResult.renderedPlan)
  ) {
    throw new ScaffoldValidationError('VALID_RENDER_RESULT_REQUIRED');
  }

  const validations = [];
  const errors = [];

  function run(id, action) {
    try {
      const evidence = action();
      validations.push({
        id,
        status: 'PASS',
        evidence: Array.isArray(evidence) ? evidence : [String(evidence)]
      });
    } catch (error) {
      const code = error?.code ?? error?.name ?? 'VALIDATION_ERROR';
      const message = error?.message ?? String(error);
      validations.push({
        id,
        status: 'FAIL',
        evidence: [message]
      });
      errors.push(`${id}:${code}:${message}`);
    }
  }

  const upstream = normalizeUpstreamValidations(upstreamValidations);
  const realRepository = realDirectory(repositoryRoot, 'REPOSITORY_ROOT');
  const stagingSummary = hashStagingDirectory(stagingDirectory);

  run('SCV-004', () => {
    const registry = createScaffoldRegistry(
      registryValue,
      { softwareGateRatified }
    );

    if (registry.hash !== registrySha256) {
      throw new ScaffoldValidationError('REGISTRY_HASH_MISMATCH');
    }

    return [
      `registryId=${registry.value.registryId}`,
      `registrySha256=${registry.hash}`
    ];
  });

  let definition;
  run('SCV-002', () => {
    const registry = createScaffoldRegistry(
      registryValue,
      { softwareGateRatified }
    );
    definition = registry.resolve(renderResult.scaffold);

    if (
      definition.status !== 'AUTHORIZED' ||
      definition.authority.ratified !== true
    ) {
      throw new ScaffoldValidationError('AUTHORITY_NOT_RATIFIED');
    }

    if (
      definition.authority.snapshotSha256 !==
      renderResult.renderedPlan.locks.authoritySha256
    ) {
      throw new ScaffoldValidationError(
        'AUTHORITY_SNAPSHOT_HASH_MISMATCH'
      );
    }

    return [
      `gateId=${definition.authority.gateId}`,
      `authoritySha256=${definition.authority.snapshotSha256}`
    ];
  });

  run('SCV-007', () => {
    if (!definition) {
      throw new ScaffoldValidationError('DEFINITION_UNAVAILABLE');
    }

    if (definition.authority.ownerStatus === 'UNKNOWN_BLOCKED') {
      throw new ScaffoldValidationError('OWNER_UNKNOWN_BLOCKED');
    }

    return [`ownerStatus=${definition.authority.ownerStatus}`];
  });

  run('SCV-017', () => {
    verifyScaffoldPlanHash(renderResult.renderedPlan);

    const registry = createScaffoldRegistry(
      registryValue,
      { softwareGateRatified }
    );

    if (registry.hash !== registrySha256) {
      throw new ScaffoldValidationError('REGISTRY_HASH_MISMATCH');
    }

    const resolved = registry.resolve(renderResult.scaffold);
    const definitionHash = sha256Canonical(resolved);

    if (
      renderResult.renderedPlan.locks.registrySha256 !==
      registrySha256
    ) {
      throw new ScaffoldValidationError('PLAN_REGISTRY_LOCK_MISMATCH');
    }

    if (
      renderResult.renderedPlan.locks.definitionSha256 !==
      definitionHash
    ) {
      throw new ScaffoldValidationError('PLAN_DEFINITION_LOCK_MISMATCH');
    }

    if (
      renderResult.renderedPlan.locks.templateSha256 !==
      renderResult.templateSha256
    ) {
      throw new ScaffoldValidationError('PLAN_TEMPLATE_LOCK_MISMATCH');
    }

    if (
      renderResult.renderedPlan.input.sha256 !==
      sha256Canonical(inputData)
    ) {
      throw new ScaffoldValidationError('PLAN_INPUT_HASH_MISMATCH');
    }

    return [
      `planSha256=${renderResult.renderedPlan.planSha256}`,
      `definitionSha256=${definitionHash}`,
      `templateSha256=${renderResult.templateSha256}`,
      `inputSha256=${renderResult.inputSha256}`
    ];
  });

  run('SCV-014', () => {
    const preRenderPlan = derivePreRenderPlan(
      renderResult.renderedPlan
    );

    const reproduced = renderScaffoldInMemory({
      plan: preRenderPlan,
      registry: registryValue,
      registrySha256,
      inputData,
      templateText,
      softwareGateRatified
    });

    compareRenderResults(renderResult, reproduced);

    return [
      `renderDigest=${renderResult.renderDigest}`,
      'duplicateRender=BYTE_IDENTICAL'
    ];
  });

  run('SCV-013', () => contentEvidence(renderResult));
  run('SCV-015', () => contentEvidence(renderResult));

  run('SCV-009', () => {
    for (const output of renderResult.outputs) {
      if (!isSafeRepositoryPath(output.path)) {
        throw new ScaffoldValidationError(
          'OUTPUT_PATH_UNSAFE',
          [output.path]
        );
      }
    }
    return renderResult.outputs.map(output => `path=${output.path}`);
  });

  run('SCV-010', () => {
    const planned = renderResult.renderedPlan.plannedOutputs
      .map(output => `${output.outputId}:${output.path}:${output.expectedSha256}`)
      .sort();
    const rendered = renderResult.outputs
      .map(output => `${output.outputId}:${output.path}:${output.sha256}`)
      .sort();

    if (canonicalJson(planned) !== canonicalJson(rendered)) {
      throw new ScaffoldValidationError('PLANNED_RENDERED_SET_MISMATCH');
    }

    return rendered;
  });

  run('SCV-011', () => {
    verifyStagedScaffold(renderResult, stagingSummary.directory);
    return [
      `stagingDirectorySha256=${stagingSummary.directorySha256}`,
      `fileCount=${stagingSummary.fileCount}`
    ];
  });

  run('SCV-019', () => {
    if (isInside(realRepository, stagingSummary.directory)) {
      throw new ScaffoldValidationError(
        'STAGING_INSIDE_REPOSITORY'
      );
    }

    verifyStagedScaffold(renderResult, stagingSummary.directory);

    return [
      `repositoryRoot=${realRepository}`,
      `stagingRoot=${stagingSummary.directory}`,
      'repositoryTouched=false'
    ];
  });

  run('SCV-024', () => validateSideEffectSnapshot(sideEffectSnapshot));

  const directIds = new Set(validations.map(entry => entry.id));

  for (const id of renderResult.renderedPlan.requiredValidations) {
    if (directIds.has(id)) continue;

    if (upstream.has(id)) {
      validations.push(upstream.get(id));
      continue;
    }

    if (DEFERRED_TO_WAVE_5.includes(id)) {
      validations.push({
        id,
        status: 'DEFERRED',
        evidence: [`WAVE_5_REQUIRED:${id}`]
      });
      continue;
    }

    validations.push({
      id,
      status: 'FAIL',
      evidence: ['REQUIRED_VALIDATION_EVIDENCE_MISSING']
    });
    errors.push(`${id}:REQUIRED_VALIDATION_EVIDENCE_MISSING`);
  }

  for (const id of DEFERRED_TO_WAVE_5) {
    if (
      !validations.some(validation => validation.id === id)
    ) {
      validations.push({
        id,
        status: 'DEFERRED',
        evidence: [`WAVE_5_REQUIRED:${id}`]
      });
    }
  }

  return makeReport({
    reportId,
    createdAt,
    renderResult,
    stagingSummary,
    validations,
    errors
  });
}

export function verifyValidationReportHash(report) {
  if (!isPlainObject(report)) {
    throw new ScaffoldValidationError('VALIDATION_REPORT_OBJECT_REQUIRED');
  }

  requireSha(report.reportSha256, 'VALIDATION_REPORT_HASH_INVALID');

  const calculated = sha256Canonical({
    ...report,
    reportSha256: null
  });

  if (calculated !== report.reportSha256) {
    throw new ScaffoldValidationError(
      'VALIDATION_REPORT_HASH_MISMATCH',
      [calculated, report.reportSha256]
    );
  }

  return true;
}

export function assertValidationReportPass(report) {
  verifyValidationReportHash(report);

  if (report.status !== 'PASS') {
    throw new ScaffoldValidationError(
      'VALIDATION_REPORT_NOT_PASS',
      report.errors ?? []
    );
  }

  if (
    !Array.isArray(report.errors) ||
    report.errors.length !== 0
  ) {
    throw new ScaffoldValidationError(
      'PASS_VALIDATION_REPORT_HAS_ERRORS'
    );
  }

  if (
    report.validations.some(
      validation => validation.status === 'FAIL'
    )
  ) {
    throw new ScaffoldValidationError(
      'PASS_VALIDATION_REPORT_HAS_FAILED_CHECK'
    );
  }

  return report;
}

export {
  ContractValidationError,
  DIRECT_VALIDATIONS,
  DEFERRED_TO_WAVE_5,
  ScaffoldPlanError,
  ScaffoldRegistryError,
  ScaffoldRenderError,
  hashStagingDirectory
};
