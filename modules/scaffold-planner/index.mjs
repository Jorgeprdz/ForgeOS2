import {
  ContractValidationError,
  assertScaffoldExecutionPlan,
  isSafeRepositoryPath,
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  ScaffoldRegistryError,
  createScaffoldRegistry,
  scaffoldRef
} from '../scaffold-registry/index.mjs';

const TOKEN_RE = /\{\{([a-z][a-z0-9_]*)\}\}/g;
const SHA256_RE = /^[a-f0-9]{64}$/;

export class ScaffoldPlanError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldPlanError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireSha(value, code) {
  if (typeof value !== 'string' || !SHA256_RE.test(value)) {
    throw new ScaffoldPlanError(code, [String(value)]);
  }
  return value;
}

function requireString(value, code) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ScaffoldPlanError(code, [String(value)]);
  }
  return value;
}

function assertInputEnvelope(input, definition) {
  if (!isPlainObject(input)) {
    throw new ScaffoldPlanError('INPUT_ENVELOPE_REQUIRED');
  }

  for (const field of ['path', 'data', 'sha256', 'schemaSha256', 'validation']) {
    if (!Object.hasOwn(input, field)) {
      throw new ScaffoldPlanError('INPUT_ENVELOPE_FIELD_MISSING', [field]);
    }
  }

  if (!isSafeRepositoryPath(input.path)) {
    throw new ScaffoldPlanError('INPUT_PATH_UNSAFE', [input.path]);
  }

  requireSha(input.sha256, 'INPUT_HASH_INVALID');
  requireSha(input.schemaSha256, 'INPUT_SCHEMA_HASH_INVALID');

  if (!isPlainObject(input.data)) {
    throw new ScaffoldPlanError('INPUT_DATA_OBJECT_REQUIRED');
  }

  if (!isPlainObject(input.validation) || input.validation.pass !== true) {
    throw new ScaffoldPlanError('INPUT_VALIDATION_REQUIRED');
  }

  if (!Array.isArray(input.validation.errors) || input.validation.errors.length !== 0) {
    throw new ScaffoldPlanError('INPUT_VALIDATION_ERRORS_PRESENT');
  }

  if (definition.inputSchema.sha256 === null) {
    throw new ScaffoldPlanError('DEFINITION_INPUT_SCHEMA_NOT_LOCKED');
  }

  if (input.schemaSha256 !== definition.inputSchema.sha256) {
    throw new ScaffoldPlanError('INPUT_SCHEMA_HASH_MISMATCH');
  }

  const calculated = sha256Canonical(input.data);
  if (calculated !== input.sha256) {
    throw new ScaffoldPlanError('INPUT_HASH_MISMATCH', [calculated, input.sha256]);
  }
}

function assertAuthoritySnapshot(snapshot, definition) {
  if (!isPlainObject(snapshot)) {
    throw new ScaffoldPlanError('AUTHORITY_SNAPSHOT_REQUIRED');
  }

  for (const field of ['gateId', 'ratified', 'sha256']) {
    if (!Object.hasOwn(snapshot, field)) {
      throw new ScaffoldPlanError('AUTHORITY_SNAPSHOT_FIELD_MISSING', [field]);
    }
  }

  requireSha(snapshot.sha256, 'AUTHORITY_SNAPSHOT_HASH_INVALID');

  if (snapshot.gateId !== definition.authority.gateId) {
    throw new ScaffoldPlanError('AUTHORITY_GATE_MISMATCH');
  }

  if (snapshot.ratified !== true || definition.authority.ratified !== true) {
    throw new ScaffoldPlanError('AUTHORITY_NOT_RATIFIED');
  }

  if (definition.authority.snapshotSha256 === null) {
    throw new ScaffoldPlanError('DEFINITION_AUTHORITY_NOT_LOCKED');
  }

  if (snapshot.sha256 !== definition.authority.snapshotSha256) {
    throw new ScaffoldPlanError('AUTHORITY_SNAPSHOT_HASH_MISMATCH');
  }
}

function normalizeInventory(inventory = {}) {
  if (!isPlainObject(inventory)) {
    throw new ScaffoldPlanError('DESTINATION_INVENTORY_OBJECT_REQUIRED');
  }

  const normalized = new Map();

  for (const [path, state] of Object.entries(inventory)) {
    if (!isSafeRepositoryPath(path)) {
      throw new ScaffoldPlanError('INVENTORY_PATH_UNSAFE', [path]);
    }
    if (!isPlainObject(state)) {
      throw new ScaffoldPlanError('INVENTORY_STATE_OBJECT_REQUIRED', [path]);
    }

    normalized.set(path, {
      exists: state.exists === true,
      dirty: state.dirty === true,
      symlink: state.symlink === true,
      sha256: state.sha256 ?? null
    });

    if (normalized.get(path).sha256 !== null) {
      requireSha(normalized.get(path).sha256, 'INVENTORY_HASH_INVALID');
    }
  }

  return normalized;
}

export function renderPathPattern(pattern, data) {
  requireString(pattern, 'PATH_PATTERN_REQUIRED');

  if (!isPlainObject(data)) {
    throw new ScaffoldPlanError('PATH_DATA_OBJECT_REQUIRED');
  }

  const used = new Set();
  const output = pattern.replace(TOKEN_RE, (_, key) => {
    used.add(key);
    if (!Object.hasOwn(data, key)) {
      throw new ScaffoldPlanError('PATH_TOKEN_MISSING', [key]);
    }

    const value = data[key];
    if (typeof value !== 'string' || value.length === 0) {
      throw new ScaffoldPlanError('PATH_TOKEN_VALUE_INVALID', [key]);
    }

    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
      throw new ScaffoldPlanError('PATH_TOKEN_VALUE_UNSAFE', [key, value]);
    }

    return value;
  });

  if (/\{\{[^}]+\}\}/.test(output)) {
    throw new ScaffoldPlanError('UNRESOLVED_PATH_TOKEN', [output]);
  }

  if (!isSafeRepositoryPath(output)) {
    throw new ScaffoldPlanError('PLANNED_OUTPUT_PATH_UNSAFE', [output]);
  }

  return Object.freeze({
    path: output,
    usedTokens: Object.freeze([...used].sort())
  });
}

function conflictFor(output, inventoryState) {
  const state = inventoryState ?? {
    exists: false,
    dirty: false,
    symlink: false,
    sha256: null
  };

  if (state.symlink) {
    return { conflictState: 'BLOCKED_SYMLINK', conflict: 'SYMLINK_TARGET_BLOCKED' };
  }

  if (state.dirty) {
    return { conflictState: 'CONFLICT_DIRTY', conflict: 'DESTINATION_DIRTY' };
  }

  if (output.operation === 'CREATE_ONLY') {
    if (state.exists) {
      return { conflictState: 'CONFLICT_EXISTS', conflict: 'CREATE_TARGET_EXISTS' };
    }
    return { conflictState: 'CLEAR_CREATE', conflict: null };
  }

  if (output.operation === 'MODIFY_EXACT') {
    if (!state.exists) {
      return { conflictState: 'BLOCKED_PATH', conflict: 'MODIFY_TARGET_MISSING' };
    }
    return { conflictState: 'CLEAR_MODIFY', conflict: null };
  }

  return { conflictState: 'BLOCKED_PATH', conflict: 'OUTPUT_OPERATION_UNSUPPORTED' };
}

export function buildScaffoldPlan({
  registry: registryValue,
  scaffoldReference,
  input,
  authoritySnapshot,
  sourceRef,
  registrySha256,
  destinationInventory = {},
  runId,
  planId,
  createdAt,
  softwareGateRatified = false
}) {
  requireString(sourceRef, 'SOURCE_REF_REQUIRED');
  requireString(runId, 'RUN_ID_REQUIRED');
  requireString(planId, 'PLAN_ID_REQUIRED');
  requireString(createdAt, 'CREATED_AT_REQUIRED');
  requireSha(registrySha256, 'REGISTRY_HASH_INVALID');

  const registry = createScaffoldRegistry(registryValue, { softwareGateRatified });

  if (registry.hash !== registrySha256) {
    throw new ScaffoldPlanError('REGISTRY_HASH_MISMATCH', [registry.hash, registrySha256]);
  }

  const definition = registry.resolve(scaffoldReference);

  if (definition.status !== 'AUTHORIZED') {
    throw new ScaffoldPlanError('SCAFFOLD_NOT_AUTHORIZED', [scaffoldReference, definition.status]);
  }

  if (definition.template.sha256 === null) {
    throw new ScaffoldPlanError('DEFINITION_TEMPLATE_NOT_LOCKED');
  }

  assertAuthoritySnapshot(authoritySnapshot, definition);
  assertInputEnvelope(input, definition);

  const inventory = normalizeInventory(destinationInventory);
  const conflicts = [];
  const plannedOutputs = definition.outputs.map(output => {
    const rendered = renderPathPattern(output.pathPattern, input.data);
    const state = inventory.get(rendered.path);
    const result = conflictFor(output, state);

    if (result.conflict) {
      conflicts.push(`${output.id}:${rendered.path}:${result.conflict}`);
    }

    return {
      outputId: output.id,
      path: rendered.path,
      operation: output.operation === 'CREATE_ONLY' ? 'CREATE' : 'MODIFY',
      conflictState: result.conflictState,
      expectedSha256: null
    };
  });

  const draft = {
    schemaVersion: 1,
    planId,
    runId,
    scaffold: scaffoldRef(definition),
    mode: 'DRY_RUN',
    createdAt,
    sourceRef,
    locks: {
      authoritySha256: authoritySnapshot.sha256,
      registrySha256,
      definitionSha256: sha256Canonical(definition),
      templateSha256: definition.template.sha256,
      inputSchemaSha256: definition.inputSchema.sha256
    },
    input: {
      path: input.path,
      sha256: input.sha256
    },
    plannedOutputs,
    conflicts,
    requiredValidations: [...definition.validations].sort(),
    approvalRequired: true,
    planSha256: '0'.repeat(64)
  };

  const planSha256 = sha256Canonical({
    ...draft,
    planSha256: null
  });

  const plan = {
    ...draft,
    planSha256
  };

  assertScaffoldExecutionPlan(plan);
  return Object.freeze(structuredClone(plan));
}

export function hashScaffoldPlan(plan) {
  assertScaffoldExecutionPlan(plan);
  return sha256Canonical({
    ...plan,
    planSha256: null
  });
}

export function verifyScaffoldPlanHash(plan) {
  const calculated = hashScaffoldPlan(plan);
  if (calculated !== plan.planSha256) {
    throw new ScaffoldPlanError('PLAN_HASH_MISMATCH', [calculated, plan.planSha256]);
  }
  return true;
}

export { ContractValidationError, ScaffoldRegistryError };
