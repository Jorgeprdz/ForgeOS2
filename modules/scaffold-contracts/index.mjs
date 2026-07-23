import crypto from 'node:crypto';

const SOFTWARE_KINDS = new Set(['MODULE', 'SERVICE', 'TEST', 'MIGRATION', 'UI', 'DATABASE']);
const DEFINITION_KINDS = new Set(['DOCUMENTARY', ...SOFTWARE_KINDS]);
const DEFINITION_STATUSES = new Set(['REFERENCE_ONLY', 'PROPOSED', 'AUTHORIZED', 'BLOCKED', 'DEPRECATED']);
const OWNER_STATUSES = new Set(['ESTABLISHED', 'UNKNOWN_BLOCKED', 'NOT_APPLICABLE']);
const MEDIA_TYPES = new Set(['text/markdown', 'application/json', 'text/javascript', 'text/typescript', 'text/plain']);
const OUTPUT_OPERATIONS = new Set(['CREATE_ONLY', 'MODIFY_EXACT']);
const PLAN_OPERATIONS = new Set(['CREATE', 'MODIFY']);
const CONFLICT_STATES = new Set([
  'CLEAR_CREATE',
  'CLEAR_MODIFY',
  'CONFLICT_EXISTS',
  'CONFLICT_DIRTY',
  'BLOCKED_PATH',
  'BLOCKED_SYMLINK',
  'BLOCKED_AUTHORITY'
]);
const RECEIPT_STATUSES = new Set(['PASS', 'FAIL', 'BLOCKED']);
const VALIDATION_STATUSES = new Set(['PASS', 'FAIL', 'NOT_APPLICABLE']);
const BASELINE_DEFINITION_VALIDATIONS = Object.freeze([
  'SCV-001',
  'SCV-002',
  'SCV-004',
  'SCV-006',
  'SCV-007',
  'SCV-009',
  'SCV-010',
  'SCV-011',
  'SCV-013',
  'SCV-017',
  'SCV-018',
  'SCV-020',
  'SCV-024'
]);

const SHA256_RE = /^[a-f0-9]{64}$/;
const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/;
const SCAFFOLD_ID_RE = /^SCF-[A-Z0-9][A-Z0-9-]*$/;
const SCAFFOLD_REF_RE = /^SCF-[A-Z0-9][A-Z0-9-]*@[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/;
const GATE_ID_RE = /^SG-[0-9]{3}$/;
const ADR_ID_RE = /^ADR-[0-9]{3}[A-Z]?$/;
const VALIDATION_ID_RE = /^SCV-[0-9]{3}$/;
const OUTPUT_ID_RE = /^[A-Z][A-Z0-9_]*$/;
const PLAN_ID_RE = /^SPLAN-[A-Z0-9-]+$/;
const RECEIPT_ID_RE = /^SRCPT-[A-Z0-9-]+$/;
const RUN_ID_RE = /^[0-9]{8}T[0-9]{6}Z-[A-Z0-9-]+$/;

export class ContractValidationError extends Error {
  constructor(contractName, errors) {
    super(`${contractName}:${errors.join('|')}`);
    this.name = 'ContractValidationError';
    this.contractName = contractName;
    this.errors = [...errors];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function add(errors, code, path = '$') {
  errors.push(`${code}:${path}`);
}

function checkClosedObject(value, required, allowed, errors, path) {
  if (!isPlainObject(value)) {
    add(errors, 'EXPECTED_OBJECT', path);
    return false;
  }

  for (const key of required) {
    if (!Object.hasOwn(value, key)) add(errors, 'MISSING_FIELD', `${path}.${key}`);
  }

  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) add(errors, 'UNKNOWN_FIELD', `${path}.${key}`);
  }

  return true;
}

function checkString(value, errors, path, { pattern, minLength = 0, maxLength = Number.POSITIVE_INFINITY } = {}) {
  if (typeof value !== 'string') {
    add(errors, 'EXPECTED_STRING', path);
    return false;
  }
  if (value.length < minLength) add(errors, 'STRING_TOO_SHORT', path);
  if (value.length > maxLength) add(errors, 'STRING_TOO_LONG', path);
  if (pattern && !pattern.test(value)) add(errors, 'PATTERN_MISMATCH', path);
  return true;
}

function checkBoolean(value, errors, path) {
  if (typeof value !== 'boolean') {
    add(errors, 'EXPECTED_BOOLEAN', path);
    return false;
  }
  return true;
}

function checkInteger(value, errors, path, minimum = Number.MIN_SAFE_INTEGER) {
  if (!Number.isInteger(value)) {
    add(errors, 'EXPECTED_INTEGER', path);
    return false;
  }
  if (value < minimum) add(errors, 'INTEGER_BELOW_MINIMUM', path);
  return true;
}

function checkEnum(value, allowed, errors, path) {
  if (!allowed.has(value)) add(errors, 'ENUM_MISMATCH', path);
}

function checkArray(value, errors, path, { minItems = 0, unique = false } = {}) {
  if (!Array.isArray(value)) {
    add(errors, 'EXPECTED_ARRAY', path);
    return false;
  }
  if (value.length < minItems) add(errors, 'ARRAY_TOO_SHORT', path);
  if (unique) {
    const serialized = value.map(item => JSON.stringify(item));
    if (new Set(serialized).size !== serialized.length) add(errors, 'ARRAY_DUPLICATE', path);
  }
  return true;
}

function checkDateTime(value, errors, path, nullable = false) {
  if (value === null && nullable) return;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) add(errors, 'INVALID_DATE_TIME', path);
}

function checkSha(value, errors, path, nullable = false) {
  if (value === null && nullable) return;
  checkString(value, errors, path, { pattern: SHA256_RE });
}

function checkStringArray(value, errors, path, { minItems = 0, unique = false, pattern } = {}) {
  if (!checkArray(value, errors, path, { minItems, unique })) return;
  value.forEach((entry, index) => checkString(entry, errors, `${path}[${index}]`, { pattern, minLength: 1 }));
}

export function isSafeRepositoryPath(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (value.startsWith('/') || value.includes('\\') || value.includes('\0')) return false;
  if (/^[A-Za-z]:/.test(value)) return false;
  if (/[\u0000-\u001F\u007F]/u.test(value)) return false;

  const segments = value.split('/');
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) return false;
  if (segments[0] === '.git') return false;
  return true;
}

function checkRepositoryPath(value, errors, path) {
  if (!checkString(value, errors, path, { minLength: 1 })) return;
  if (!isSafeRepositoryPath(value)) add(errors, 'UNSAFE_REPOSITORY_PATH', path);
}

function checkUniqueBy(items, selector, errors, path, code) {
  const values = items.map(selector);
  if (new Set(values).size !== values.length) add(errors, code, path);
}

export function canonicalJson(value) {
  const visit = current => {
    if (Array.isArray(current)) return current.map(visit);
    if (isPlainObject(current)) {
      return Object.fromEntries(Object.keys(current).sort().map(key => [key, visit(current[key])]));
    }
    return current;
  };

  return JSON.stringify(visit(value));
}

export function sha256Canonical(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export function validateScaffoldDefinition(value, options = {}) {
  const errors = [];
  const required = ['schemaVersion', 'id', 'version', 'title', 'kind', 'status', 'authority', 'template', 'inputSchema', 'outputs', 'pathPolicy', 'validations', 'dependencies', 'provenance'];
  if (!checkClosedObject(value, required, required, errors, '$')) return { pass: false, errors };

  if (value.schemaVersion !== 1) add(errors, 'SCHEMA_VERSION_UNSUPPORTED', '$.schemaVersion');
  checkString(value.id, errors, '$.id', { pattern: SCAFFOLD_ID_RE });
  checkString(value.version, errors, '$.version', { pattern: SEMVER_RE });
  checkString(value.title, errors, '$.title', { minLength: 3, maxLength: 160 });
  checkEnum(value.kind, DEFINITION_KINDS, errors, '$.kind');
  checkEnum(value.status, DEFINITION_STATUSES, errors, '$.status');

  const authorityFields = ['gateId', 'ratified', 'constitutionRefs', 'adrRefs', 'ownerStatus', 'snapshotSha256'];
  if (checkClosedObject(value.authority, authorityFields, authorityFields, errors, '$.authority')) {
    checkString(value.authority.gateId, errors, '$.authority.gateId', { pattern: GATE_ID_RE });
    checkBoolean(value.authority.ratified, errors, '$.authority.ratified');
    checkStringArray(value.authority.constitutionRefs, errors, '$.authority.constitutionRefs', { minItems: 1, unique: true });
    checkStringArray(value.authority.adrRefs, errors, '$.authority.adrRefs', { unique: true, pattern: ADR_ID_RE });
    checkEnum(value.authority.ownerStatus, OWNER_STATUSES, errors, '$.authority.ownerStatus');
    checkSha(value.authority.snapshotSha256, errors, '$.authority.snapshotSha256', true);

    if (value.authority.ratified && value.authority.snapshotSha256 === null) {
      add(errors, 'RATIFIED_AUTHORITY_REQUIRES_SNAPSHOT_HASH', '$.authority.snapshotSha256');
    }
    if (value.status === 'AUTHORIZED' && value.authority.ratified !== true) {
      add(errors, 'AUTHORIZED_REQUIRES_RATIFIED_GATE', '$.authority.ratified');
    }
    if (value.status === 'AUTHORIZED' && value.authority.ownerStatus === 'UNKNOWN_BLOCKED') {
      add(errors, 'AUTHORIZED_REQUIRES_KNOWN_OWNER', '$.authority.ownerStatus');
    }
    if (SOFTWARE_KINDS.has(value.kind) && value.status === 'AUTHORIZED') {
      if (value.authority.gateId !== 'SG-003' || options.softwareGateRatified !== true) {
        add(errors, 'SOFTWARE_GATE_NOT_RATIFIED', '$.authority.gateId');
      }
    }
  }

  const templateFields = ['path', 'sha256', 'renderer'];
  if (checkClosedObject(value.template, templateFields, templateFields, errors, '$.template')) {
    checkRepositoryPath(value.template.path, errors, '$.template.path');
    checkSha(value.template.sha256, errors, '$.template.sha256', true);
    if (value.template.renderer !== 'FORGE_TEXT_V1') add(errors, 'RENDERER_UNSUPPORTED', '$.template.renderer');
  }

  const schemaFields = ['path', 'sha256'];
  if (checkClosedObject(value.inputSchema, schemaFields, schemaFields, errors, '$.inputSchema')) {
    checkRepositoryPath(value.inputSchema.path, errors, '$.inputSchema.path');
    checkSha(value.inputSchema.sha256, errors, '$.inputSchema.sha256', true);
  }

  if (checkArray(value.outputs, errors, '$.outputs', { minItems: 1 })) {
    value.outputs.forEach((output, index) => {
      const path = `$.outputs[${index}]`;
      const fields = ['id', 'pathPattern', 'mediaType', 'operation'];
      if (!checkClosedObject(output, fields, fields, errors, path)) return;
      checkString(output.id, errors, `${path}.id`, { pattern: OUTPUT_ID_RE });
      checkRepositoryPath(output.pathPattern, errors, `${path}.pathPattern`);
      checkEnum(output.mediaType, MEDIA_TYPES, errors, `${path}.mediaType`);
      checkEnum(output.operation, OUTPUT_OPERATIONS, errors, `${path}.operation`);
    });
    checkUniqueBy(value.outputs, output => output.id, errors, '$.outputs', 'DUPLICATE_OUTPUT_ID');
    checkUniqueBy(value.outputs, output => output.pathPattern, errors, '$.outputs', 'DUPLICATE_OUTPUT_PATH_PATTERN');
  }

  const policyFields = ['allowSymlinks', 'allowDelete', 'allowRename', 'overwriteDefault'];
  if (checkClosedObject(value.pathPolicy, policyFields, policyFields, errors, '$.pathPolicy')) {
    if (value.pathPolicy.allowSymlinks !== false) add(errors, 'SYMLINKS_MUST_BE_DENIED', '$.pathPolicy.allowSymlinks');
    if (value.pathPolicy.allowDelete !== false) add(errors, 'DELETE_MUST_BE_DENIED', '$.pathPolicy.allowDelete');
    if (value.pathPolicy.allowRename !== false) add(errors, 'RENAME_MUST_BE_DENIED', '$.pathPolicy.allowRename');
    if (value.pathPolicy.overwriteDefault !== 'DENY') add(errors, 'OVERWRITE_DEFAULT_MUST_DENY', '$.pathPolicy.overwriteDefault');
  }

  if (checkArray(value.validations, errors, '$.validations', { minItems: 1, unique: true })) {
    value.validations.forEach((id, index) => checkString(id, errors, `$.validations[${index}]`, { pattern: VALIDATION_ID_RE }));
    for (const requiredValidation of BASELINE_DEFINITION_VALIDATIONS) {
      if (!value.validations.includes(requiredValidation)) add(errors, 'MISSING_BASELINE_VALIDATION', `$.validations.${requiredValidation}`);
    }
  }

  if (checkArray(value.dependencies, errors, '$.dependencies', { unique: true })) {
    value.dependencies.forEach((dependency, index) => checkString(dependency, errors, `$.dependencies[${index}]`, { pattern: SCAFFOLD_REF_RE }));
  }

  const provenanceFields = ['activeSources', 'historicalSources', 'classification'];
  if (checkClosedObject(value.provenance, provenanceFields, provenanceFields, errors, '$.provenance')) {
    checkStringArray(value.provenance.activeSources, errors, '$.provenance.activeSources', { minItems: 1, unique: true });
    checkStringArray(value.provenance.historicalSources, errors, '$.provenance.historicalSources', { unique: true });
    checkEnum(value.provenance.classification, new Set(['KEEP', 'REDESIGN', 'NEW']), errors, '$.provenance.classification');
  }

  return { pass: errors.length === 0, errors };
}

export function assertScaffoldDefinition(value, options = {}) {
  const result = validateScaffoldDefinition(value, options);
  if (!result.pass) throw new ContractValidationError('SCAFFOLD_DEFINITION_INVALID', result.errors);
  return value;
}

export function validateScaffoldExecutionPlan(value) {
  const errors = [];
  const required = ['schemaVersion', 'planId', 'runId', 'scaffold', 'mode', 'createdAt', 'sourceRef', 'locks', 'input', 'plannedOutputs', 'conflicts', 'requiredValidations', 'approvalRequired', 'planSha256'];
  if (!checkClosedObject(value, required, required, errors, '$')) return { pass: false, errors };

  if (value.schemaVersion !== 1) add(errors, 'SCHEMA_VERSION_UNSUPPORTED', '$.schemaVersion');
  checkString(value.planId, errors, '$.planId', { pattern: PLAN_ID_RE });
  checkString(value.runId, errors, '$.runId', { pattern: RUN_ID_RE });
  checkString(value.scaffold, errors, '$.scaffold', { pattern: SCAFFOLD_REF_RE });
  if (value.mode !== 'DRY_RUN') add(errors, 'PLAN_MODE_MUST_BE_DRY_RUN', '$.mode');
  checkDateTime(value.createdAt, errors, '$.createdAt');
  checkString(value.sourceRef, errors, '$.sourceRef', { minLength: 7 });

  const lockFields = ['authoritySha256', 'registrySha256', 'definitionSha256', 'templateSha256', 'inputSchemaSha256'];
  if (checkClosedObject(value.locks, lockFields, lockFields, errors, '$.locks')) {
    for (const field of lockFields) checkSha(value.locks[field], errors, `$.locks.${field}`);
  }

  const inputFields = ['path', 'sha256'];
  if (checkClosedObject(value.input, inputFields, inputFields, errors, '$.input')) {
    checkRepositoryPath(value.input.path, errors, '$.input.path');
    checkSha(value.input.sha256, errors, '$.input.sha256');
  }

  if (checkArray(value.plannedOutputs, errors, '$.plannedOutputs', { minItems: 1 })) {
    value.plannedOutputs.forEach((output, index) => {
      const path = `$.plannedOutputs[${index}]`;
      const fields = ['outputId', 'path', 'operation', 'conflictState', 'expectedSha256'];
      if (!checkClosedObject(output, fields, fields, errors, path)) return;
      checkString(output.outputId, errors, `${path}.outputId`, { pattern: OUTPUT_ID_RE });
      checkRepositoryPath(output.path, errors, `${path}.path`);
      checkEnum(output.operation, PLAN_OPERATIONS, errors, `${path}.operation`);
      checkEnum(output.conflictState, CONFLICT_STATES, errors, `${path}.conflictState`);
      checkSha(output.expectedSha256, errors, `${path}.expectedSha256`, true);
    });
    checkUniqueBy(value.plannedOutputs, output => output.outputId, errors, '$.plannedOutputs', 'DUPLICATE_OUTPUT_ID');
    checkUniqueBy(value.plannedOutputs, output => output.path, errors, '$.plannedOutputs', 'DUPLICATE_OUTPUT_PATH');
  }

  checkStringArray(value.conflicts, errors, '$.conflicts');
  checkStringArray(value.requiredValidations, errors, '$.requiredValidations', { minItems: 1, unique: true, pattern: VALIDATION_ID_RE });
  if (value.approvalRequired !== true) add(errors, 'HUMAN_APPROVAL_REQUIRED', '$.approvalRequired');
  checkSha(value.planSha256, errors, '$.planSha256');

  return { pass: errors.length === 0, errors };
}

export function assertScaffoldExecutionPlan(value) {
  const result = validateScaffoldExecutionPlan(value);
  if (!result.pass) throw new ContractValidationError('SCAFFOLD_EXECUTION_PLAN_INVALID', result.errors);
  return value;
}

export function assertExecutionPlanApplicable(value) {
  assertScaffoldExecutionPlan(value);
  const errors = [];
  if (value.conflicts.length !== 0) add(errors, 'PLAN_HAS_CONFLICTS', '$.conflicts');
  for (let index = 0; index < value.plannedOutputs.length; index += 1) {
    const output = value.plannedOutputs[index];
    const expectedState = output.operation === 'CREATE' ? 'CLEAR_CREATE' : 'CLEAR_MODIFY';
    if (output.conflictState !== expectedState) add(errors, 'OUTPUT_NOT_APPLICABLE', `$.plannedOutputs[${index}].conflictState`);
    if (output.expectedSha256 === null) add(errors, 'OUTPUT_HASH_REQUIRED_FOR_APPLY', `$.plannedOutputs[${index}].expectedSha256`);
  }
  if (errors.length) throw new ContractValidationError('SCAFFOLD_EXECUTION_PLAN_NOT_APPLICABLE', errors);
  return value;
}

export function validateScaffoldLock(value) {
  const errors = [];
  const required = ['schemaVersion', 'scaffold', 'issuedAt', 'authoritySha256', 'definitionSha256', 'templateSha256', 'inputSchemaSha256', 'dependencyLocks', 'allowedOutputPatterns', 'lockSha256'];
  if (!checkClosedObject(value, required, required, errors, '$')) return { pass: false, errors };

  if (value.schemaVersion !== 1) add(errors, 'SCHEMA_VERSION_UNSUPPORTED', '$.schemaVersion');
  checkString(value.scaffold, errors, '$.scaffold', { pattern: SCAFFOLD_REF_RE });
  checkDateTime(value.issuedAt, errors, '$.issuedAt');
  for (const field of ['authoritySha256', 'definitionSha256', 'templateSha256', 'inputSchemaSha256', 'lockSha256']) {
    checkSha(value[field], errors, `$.${field}`);
  }

  if (checkArray(value.dependencyLocks, errors, '$.dependencyLocks', { unique: true })) {
    value.dependencyLocks.forEach((dependency, index) => {
      const path = `$.dependencyLocks[${index}]`;
      const fields = ['id', 'version', 'sha256'];
      if (!checkClosedObject(dependency, fields, fields, errors, path)) return;
      checkString(dependency.id, errors, `${path}.id`, { pattern: SCAFFOLD_ID_RE });
      checkString(dependency.version, errors, `${path}.version`, { pattern: SEMVER_RE });
      checkSha(dependency.sha256, errors, `${path}.sha256`);
    });
    checkUniqueBy(value.dependencyLocks, item => `${item.id}@${item.version}`, errors, '$.dependencyLocks', 'DUPLICATE_DEPENDENCY_LOCK');
  }

  if (checkArray(value.allowedOutputPatterns, errors, '$.allowedOutputPatterns', { minItems: 1, unique: true })) {
    value.allowedOutputPatterns.forEach((pattern, index) => checkRepositoryPath(pattern, errors, `$.allowedOutputPatterns[${index}]`));
  }

  return { pass: errors.length === 0, errors };
}

export function assertScaffoldLock(value) {
  const result = validateScaffoldLock(value);
  if (!result.pass) throw new ContractValidationError('SCAFFOLD_LOCK_INVALID', result.errors);
  return value;
}

export function validateScaffoldReceipt(value) {
  const errors = [];
  const required = ['schemaVersion', 'receiptId', 'runId', 'planId', 'planSha256', 'scaffold', 'status', 'startedAt', 'finishedAt', 'approval', 'environment', 'outputs', 'validations', 'errors', 'receiptSha256'];
  if (!checkClosedObject(value, required, required, errors, '$')) return { pass: false, errors };

  if (value.schemaVersion !== 1) add(errors, 'SCHEMA_VERSION_UNSUPPORTED', '$.schemaVersion');
  checkString(value.receiptId, errors, '$.receiptId', { pattern: RECEIPT_ID_RE });
  checkString(value.runId, errors, '$.runId', { pattern: RUN_ID_RE });
  checkString(value.planId, errors, '$.planId', { pattern: PLAN_ID_RE });
  checkSha(value.planSha256, errors, '$.planSha256');
  checkString(value.scaffold, errors, '$.scaffold', { pattern: SCAFFOLD_REF_RE });
  checkEnum(value.status, RECEIPT_STATUSES, errors, '$.status');
  checkDateTime(value.startedAt, errors, '$.startedAt');
  checkDateTime(value.finishedAt, errors, '$.finishedAt');
  if (typeof value.startedAt === 'string' && typeof value.finishedAt === 'string' && Date.parse(value.finishedAt) < Date.parse(value.startedAt)) {
    add(errors, 'FINISHED_BEFORE_STARTED', '$.finishedAt');
  }

  const approvalFields = ['required', 'present', 'actor', 'approvedAt', 'planSha256'];
  if (checkClosedObject(value.approval, approvalFields, approvalFields, errors, '$.approval')) {
    if (value.approval.required !== true) add(errors, 'HUMAN_APPROVAL_REQUIRED', '$.approval.required');
    checkBoolean(value.approval.present, errors, '$.approval.present');
    if (value.approval.actor !== null) checkString(value.approval.actor, errors, '$.approval.actor', { minLength: 1 });
    checkDateTime(value.approval.approvedAt, errors, '$.approval.approvedAt', true);
    checkSha(value.approval.planSha256, errors, '$.approval.planSha256', true);

    if (value.approval.present) {
      if (value.approval.actor === null || value.approval.approvedAt === null || value.approval.planSha256 === null) {
        add(errors, 'APPROVAL_FIELDS_REQUIRED_WHEN_PRESENT', '$.approval');
      }
      if (value.approval.planSha256 !== value.planSha256) add(errors, 'APPROVAL_PLAN_HASH_MISMATCH', '$.approval.planSha256');
    }
    if (value.status === 'PASS' && value.approval.present !== true) add(errors, 'PASS_REQUIRES_APPROVAL', '$.approval.present');
  }

  const environmentFields = ['engineVersion', 'nodeVersion', 'platform', 'sourceRef', 'workingTreeCleanBefore'];
  if (checkClosedObject(value.environment, environmentFields, environmentFields, errors, '$.environment')) {
    checkString(value.environment.engineVersion, errors, '$.environment.engineVersion', { pattern: SEMVER_RE });
    checkString(value.environment.nodeVersion, errors, '$.environment.nodeVersion', { minLength: 2 });
    checkString(value.environment.platform, errors, '$.environment.platform', { minLength: 1 });
    checkString(value.environment.sourceRef, errors, '$.environment.sourceRef', { minLength: 7 });
    checkBoolean(value.environment.workingTreeCleanBefore, errors, '$.environment.workingTreeCleanBefore');
  }

  if (checkArray(value.outputs, errors, '$.outputs')) {
    value.outputs.forEach((output, index) => {
      const path = `$.outputs[${index}]`;
      const fields = ['path', 'operation', 'sha256', 'bytes', 'applied'];
      if (!checkClosedObject(output, fields, fields, errors, path)) return;
      checkRepositoryPath(output.path, errors, `${path}.path`);
      checkEnum(output.operation, PLAN_OPERATIONS, errors, `${path}.operation`);
      checkSha(output.sha256, errors, `${path}.sha256`);
      checkInteger(output.bytes, errors, `${path}.bytes`, 0);
      checkBoolean(output.applied, errors, `${path}.applied`);
    });
    checkUniqueBy(value.outputs, output => output.path, errors, '$.outputs', 'DUPLICATE_OUTPUT_PATH');
  }

  if (checkArray(value.validations, errors, '$.validations', { minItems: 1 })) {
    value.validations.forEach((validation, index) => {
      const path = `$.validations[${index}]`;
      const fields = ['id', 'status', 'evidence'];
      if (!checkClosedObject(validation, fields, fields, errors, path)) return;
      checkString(validation.id, errors, `${path}.id`, { pattern: VALIDATION_ID_RE });
      checkEnum(validation.status, VALIDATION_STATUSES, errors, `${path}.status`);
      checkStringArray(validation.evidence, errors, `${path}.evidence`);
    });
    checkUniqueBy(value.validations, validation => validation.id, errors, '$.validations', 'DUPLICATE_VALIDATION_ID');
  }

  checkStringArray(value.errors, errors, '$.errors');
  checkSha(value.receiptSha256, errors, '$.receiptSha256');

  if (value.status === 'PASS') {
    if (Array.isArray(value.errors) && value.errors.length !== 0) add(errors, 'PASS_RECEIPT_HAS_ERRORS', '$.errors');
    if (Array.isArray(value.validations) && value.validations.some(validation => validation.status === 'FAIL')) {
      add(errors, 'PASS_RECEIPT_HAS_FAILED_VALIDATION', '$.validations');
    }
    if (Array.isArray(value.outputs) && value.outputs.some(output => output.applied !== true)) {
      add(errors, 'PASS_RECEIPT_HAS_UNAPPLIED_OUTPUT', '$.outputs');
    }
  }

  if (value.status !== 'PASS' && Array.isArray(value.errors) && value.errors.length === 0) {
    add(errors, 'NON_PASS_RECEIPT_REQUIRES_ERROR', '$.errors');
  }

  return { pass: errors.length === 0, errors };
}

export function assertScaffoldReceipt(value) {
  const result = validateScaffoldReceipt(value);
  if (!result.pass) throw new ContractValidationError('SCAFFOLD_RECEIPT_INVALID', result.errors);
  return value;
}
