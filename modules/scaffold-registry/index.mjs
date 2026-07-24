import {
  ContractValidationError,
  canonicalJson,
  sha256Canonical,
  validateScaffoldDefinition
} from '../scaffold-contracts/index.mjs';

const REGISTRY_STATUSES = new Set([
  'PROPOSED_NOT_RATIFIED',
  'ACTIVE',
  'DEPRECATED'
]);

const REGISTRY_ID_RE = /^FORGE_SCAFFOLD_REGISTRY_[A-Z0-9_]+$/;
const EXACT_REF_RE = /^(SCF-[A-Z0-9][A-Z0-9-]*)@([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?)$/;

export class ScaffoldRegistryError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldRegistryError';
    this.code = code;
    this.details = [...details];
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareSemver(left, right) {
  const parse = value => {
    const [core, prerelease = ''] = value.split('-', 2);
    return {
      core: core.split('.').map(Number),
      prerelease
    };
  };

  const a = parse(left);
  const b = parse(right);

  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] - b.core[index];
  }

  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === '') return 1;
  if (b.prerelease === '') return -1;
  return a.prerelease.localeCompare(b.prerelease);
}

export function scaffoldRef(definition) {
  return `${definition.id}@${definition.version}`;
}

export function validateScaffoldRegistry(value, options = {}) {
  const errors = [];

  if (!isPlainObject(value)) {
    return { pass: false, errors: ['EXPECTED_OBJECT:$'] };
  }

  const allowed = ['schemaVersion', 'registryId', 'status', 'definitions'];
  for (const field of allowed) {
    if (!Object.hasOwn(value, field)) errors.push(`MISSING_FIELD:$.${field}`);
  }
  for (const field of Object.keys(value)) {
    if (!allowed.includes(field)) errors.push(`UNKNOWN_FIELD:$.${field}`);
  }

  if (value.schemaVersion !== 1) {
    errors.push('SCHEMA_VERSION_UNSUPPORTED:$.schemaVersion');
  }

  if (typeof value.registryId !== 'string' || !REGISTRY_ID_RE.test(value.registryId)) {
    errors.push('REGISTRY_ID_INVALID:$.registryId');
  }

  if (!REGISTRY_STATUSES.has(value.status)) {
    errors.push('REGISTRY_STATUS_INVALID:$.status');
  }

  if (!Array.isArray(value.definitions) || value.definitions.length === 0) {
    errors.push('DEFINITIONS_REQUIRED:$.definitions');
    return { pass: false, errors };
  }

  const exactRefs = [];
  value.definitions.forEach((definition, index) => {
    const result = validateScaffoldDefinition(definition, options);
    for (const error of result.errors) {
      errors.push(`DEFINITION_INVALID:$.definitions[${index}]:${error}`);
    }
    if (definition && typeof definition.id === 'string' && typeof definition.version === 'string') {
      exactRefs.push(`${definition.id}@${definition.version}`);
    }
  });

  if (new Set(exactRefs).size !== exactRefs.length) {
    errors.push('DUPLICATE_EXACT_REFERENCE:$.definitions');
  }

  return { pass: errors.length === 0, errors };
}

export function assertScaffoldRegistry(value, options = {}) {
  const result = validateScaffoldRegistry(value, options);
  if (!result.pass) {
    throw new ScaffoldRegistryError('SCAFFOLD_REGISTRY_INVALID', result.errors);
  }
  return value;
}

export function createScaffoldRegistry(value, options = {}) {
  assertScaffoldRegistry(value, options);

  const definitions = value.definitions
    .map(definition => structuredClone(definition))
    .sort((left, right) => {
      const byId = left.id.localeCompare(right.id);
      return byId !== 0 ? byId : compareSemver(left.version, right.version);
    });

  const byReference = new Map(definitions.map(definition => [scaffoldRef(definition), definition]));

  const registry = {
    schemaVersion: value.schemaVersion,
    registryId: value.registryId,
    status: value.status,
    definitions
  };

  return Object.freeze({
    value: Object.freeze(registry),
    hash: sha256Canonical(registry),
    list() {
      return definitions.map(definition => structuredClone(definition));
    },
    resolve(reference) {
      if (typeof reference !== 'string' || !EXACT_REF_RE.test(reference)) {
        throw new ScaffoldRegistryError('EXACT_SCAFFOLD_REFERENCE_REQUIRED', [String(reference)]);
      }
      const definition = byReference.get(reference);
      if (!definition) {
        throw new ScaffoldRegistryError('SCAFFOLD_REFERENCE_NOT_FOUND', [reference]);
      }
      return structuredClone(definition);
    },
    versions(id) {
      if (typeof id !== 'string' || !/^SCF-[A-Z0-9][A-Z0-9-]*$/.test(id)) {
        throw new ScaffoldRegistryError('SCAFFOLD_ID_INVALID', [String(id)]);
      }
      return definitions
        .filter(definition => definition.id === id)
        .map(definition => definition.version)
        .sort(compareSemver);
    },
    has(reference) {
      return byReference.has(reference);
    }
  });
}

export function hashScaffoldRegistry(value, options = {}) {
  return createScaffoldRegistry(value, options).hash;
}

export function parseExactScaffoldReference(reference) {
  if (typeof reference !== 'string') {
    throw new ScaffoldRegistryError('EXACT_SCAFFOLD_REFERENCE_REQUIRED', [String(reference)]);
  }
  const match = reference.match(EXACT_REF_RE);
  if (!match) {
    throw new ScaffoldRegistryError('EXACT_SCAFFOLD_REFERENCE_REQUIRED', [reference]);
  }
  return Object.freeze({ id: match[1], version: match[2] });
}

export { ContractValidationError, canonicalJson };
