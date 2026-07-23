import fs from 'node:fs';
import path from 'node:path';

import {
  canonicalJson,
  sha256Canonical,
  validateScaffoldDefinition
} from '../scaffold-contracts/index.mjs';

import {
  createScaffoldRegistry,
  scaffoldRef,
  validateScaffoldRegistry
} from '../scaffold-registry/index.mjs';

import {
  extractTemplateTokens,
  sha256NormalizedText
} from '../scaffold-renderer/index.mjs';

const EXPECTED_REFS = Object.freeze([
  'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
  'SCF-DOC-DEPENDENCY-RELATIONSHIP@1.0.0',
  'SCF-DOC-DOMAIN-RESPONSIBILITY@1.0.0',
  'SCF-DOC-SOURCE-OF-TRUTH@1.0.0'
]);

const SECTION_ORDER = Object.freeze([
  'Purpose',
  'Scope',
  'Responsibilities',
  'Authority',
  'Boundaries',
  'Dependencies',
  'Source of Truth',
  'Related Documents',
  'Related ADRs',
  'Constitutional References',
  'Status',
  'Version',
  'Traceability'
]);

export class ScaffoldCatalogError extends Error {
  constructor(code, details = []) {
    super(`${code}${details.length ? `:${details.join('|')}` : ''}`);
    this.name = 'ScaffoldCatalogError';
    this.code = code;
    this.details = [...details];
  }
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function readText(filename) {
  return fs.readFileSync(filename, 'utf8');
}

function resolveInside(root, relativePath) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath)
  ) {
    throw new ScaffoldCatalogError(
      'CATALOG_PATH_INVALID',
      [String(relativePath)]
    );
  }

  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);

  if (
    relative.startsWith('..') ||
    path.isAbsolute(relative)
  ) {
    throw new ScaffoldCatalogError(
      'CATALOG_PATH_ESCAPES_ROOT',
      [relativePath]
    );
  }

  return absolute;
}

function headings(text) {
  return text
    .split(/\r?\n/u)
    .filter(line => line.startsWith('## '))
    .map(line => line.slice(3).trim());
}

function schemaRequiredTokens(schema) {
  return [...schema.required]
    .filter(field => field !== 'document_id')
    .sort();
}

function validateInputAgainstSchema(schema, input) {
  const errors = [];

  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    return {
      pass: false,
      errors: ['EXPECTED_OBJECT:$']
    };
  }

  for (const field of schema.required) {
    if (!Object.hasOwn(input, field)) {
      errors.push(`MISSING_FIELD:$.${field}`);
    }
  }

  if (schema.additionalProperties === false) {
    for (const field of Object.keys(input)) {
      if (!Object.hasOwn(schema.properties, field)) {
        errors.push(`UNKNOWN_FIELD:$.${field}`);
      }
    }
  }

  for (const [field, rule] of Object.entries(schema.properties)) {
    if (!Object.hasOwn(input, field)) continue;

    const value = input[field];

    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`EXPECTED_STRING:$.${field}`);
      continue;
    }

    if (
      typeof value === 'string' &&
      Number.isInteger(rule.minLength) &&
      value.length < rule.minLength
    ) {
      errors.push(`STRING_TOO_SHORT:$.${field}`);
    }

    if (
      typeof value === 'string' &&
      Number.isInteger(rule.maxLength) &&
      value.length > rule.maxLength
    ) {
      errors.push(`STRING_TOO_LONG:$.${field}`);
    }

    if (
      typeof value === 'string' &&
      typeof rule.pattern === 'string' &&
      !new RegExp(rule.pattern, 'u').test(value)
    ) {
      errors.push(`PATTERN_MISMATCH:$.${field}`);
    }

    if (
      typeof value === 'string' &&
      (value.includes('{{') || value.includes('}}'))
    ) {
      errors.push(`TOKEN_INJECTION_BLOCKED:$.${field}`);
    }
  }

  return {
    pass: errors.length === 0,
    errors
  };
}

export function loadCanonicalCatalog(rootDirectory) {
  const root = fs.realpathSync(rootDirectory);
  const catalogPath = resolveInside(
    root,
    'forge/scaffolds/catalog.json'
  );
  const registryPath = resolveInside(
    root,
    'forge/scaffolds/registry.json'
  );
  const authorityPath = resolveInside(
    root,
    'forge/scaffolds/authority-snapshot.json'
  );

  const catalog = readJson(catalogPath);
  const registryValue = readJson(registryPath);
  const authoritySnapshot = readJson(authorityPath);

  const assets = catalog.entries.map(entry => {
    const definition = readJson(
      resolveInside(root, entry.definitionPath)
    );
    const templateText = readText(
      resolveInside(root, entry.templatePath)
    );
    const inputSchema = readJson(
      resolveInside(root, entry.inputSchemaPath)
    );
    const exampleInput = readJson(
      resolveInside(root, entry.exampleInputPath)
    );

    return Object.freeze({
      ...entry,
      definition,
      templateText,
      inputSchema,
      exampleInput
    });
  });

  return Object.freeze({
    root,
    catalog,
    registryValue,
    authoritySnapshot,
    assets: Object.freeze(assets)
  });
}

export function validateCanonicalCatalog(rootDirectory) {
  const errors = [];
  let loaded;

  try {
    loaded = loadCanonicalCatalog(rootDirectory);
  } catch (error) {
    return {
      pass: false,
      errors: [
        `${error?.code ?? error?.name ?? 'LOAD_ERROR'}:${error?.message ?? String(error)}`
      ]
    };
  }

  const {
    catalog,
    registryValue,
    authoritySnapshot,
    assets
  } = loaded;

  const registryValidation =
    validateScaffoldRegistry(registryValue);

  for (const error of registryValidation.errors) {
    errors.push(`REGISTRY:${error}`);
  }

  const refs = assets
    .map(asset => asset.ref)
    .sort();

  if (
    canonicalJson(refs) !==
    canonicalJson([...EXPECTED_REFS].sort())
  ) {
    errors.push(
      `CATALOG_REF_SET_MISMATCH:${refs.join(',')}`
    );
  }

  if (
    sha256Canonical(authoritySnapshot) !==
    catalog.authoritySnapshot.sha256
  ) {
    errors.push('AUTHORITY_SNAPSHOT_HASH_MISMATCH');
  }

  const registry = registryValidation.pass
    ? createScaffoldRegistry(registryValue)
    : null;

  for (const asset of assets) {
    const definitionValidation =
      validateScaffoldDefinition(asset.definition);

    for (const error of definitionValidation.errors) {
      errors.push(
        `DEFINITION:${asset.ref}:${error}`
      );
    }

    if (
      scaffoldRef(asset.definition) !==
      asset.ref
    ) {
      errors.push(
        `DEFINITION_REF_MISMATCH:${asset.ref}`
      );
    }

    if (registry) {
      const embedded = registry.resolve(asset.ref);

      if (
        canonicalJson(embedded) !==
        canonicalJson(asset.definition)
      ) {
        errors.push(
          `REGISTRY_DEFINITION_MISMATCH:${asset.ref}`
        );
      }
    }

    if (
      asset.definition.authority.snapshotSha256 !==
      catalog.authoritySnapshot.sha256
    ) {
      errors.push(
        `DEFINITION_AUTHORITY_HASH_MISMATCH:${asset.ref}`
      );
    }

    if (
      sha256NormalizedText(asset.templateText) !==
      asset.definition.template.sha256
    ) {
      errors.push(
        `TEMPLATE_HASH_MISMATCH:${asset.ref}`
      );
    }

    if (
      sha256Canonical(asset.inputSchema) !==
      asset.definition.inputSchema.sha256
    ) {
      errors.push(
        `INPUT_SCHEMA_HASH_MISMATCH:${asset.ref}`
      );
    }

    if (
      canonicalJson(headings(asset.templateText)) !==
      canonicalJson(SECTION_ORDER)
    ) {
      errors.push(
        `THIRTEEN_SECTION_ORDER_MISMATCH:${asset.ref}`
      );
    }

    let tokens = [];

    try {
      tokens = extractTemplateTokens(
        asset.templateText
      );
    } catch (error) {
      errors.push(
        `TEMPLATE_GRAMMAR:${asset.ref}:${error.message}`
      );
    }

    if (
      canonicalJson(tokens) !==
      canonicalJson(
        schemaRequiredTokens(asset.inputSchema)
      )
    ) {
      errors.push(
        `TEMPLATE_SCHEMA_TOKEN_MISMATCH:${asset.ref}`
      );
    }

    const exampleValidation =
      validateInputAgainstSchema(
        asset.inputSchema,
        asset.exampleInput
      );

    for (const error of exampleValidation.errors) {
      errors.push(
        `EXAMPLE_INPUT:${asset.ref}:${error}`
      );
    }
  }

  const dependency = assets.find(
    asset =>
      asset.ref ===
      'SCF-DOC-DEPENDENCY-RELATIONSHIP@1.0.0'
  );

  if (
    !dependency ||
    dependency.definition.status !==
      'REFERENCE_ONLY' ||
    dependency.definition.authority.gateId !== 'SG-001'
  ) {
    errors.push(
      'DEPENDENCY_RELATIONSHIP_MUST_BE_REFERENCE_ONLY'
    );
  }

  for (const asset of assets) {
    if (
      asset.ref !==
      'SCF-DOC-DEPENDENCY-RELATIONSHIP@1.0.0' &&
      (
        asset.definition.status !== 'AUTHORIZED' ||
        asset.definition.authority.gateId !== 'SG-002'
      )
    ) {
      errors.push(
        `SG002_INSTANCE_DEFINITION_NOT_AUTHORIZED:${asset.ref}`
      );
    }
  }

  return {
    pass: errors.length === 0,
    errors
  };
}

export function assertCanonicalCatalog(rootDirectory) {
  const result = validateCanonicalCatalog(rootDirectory);

  if (!result.pass) {
    throw new ScaffoldCatalogError(
      'CANONICAL_CATALOG_INVALID',
      result.errors
    );
  }

  return loadCanonicalCatalog(rootDirectory);
}

export function validateCanonicalInput({
  rootDirectory,
  scaffoldReference,
  input
}) {
  const loaded = assertCanonicalCatalog(
    rootDirectory
  );
  const asset = loaded.assets.find(
    candidate =>
      candidate.ref === scaffoldReference
  );

  if (!asset) {
    throw new ScaffoldCatalogError(
      'SCAFFOLD_REFERENCE_NOT_FOUND',
      [scaffoldReference]
    );
  }

  return validateInputAgainstSchema(
    asset.inputSchema,
    input
  );
}

export function createCanonicalInputEnvelope({
  rootDirectory,
  scaffoldReference,
  input,
  path: inputPath
}) {
  const loaded = assertCanonicalCatalog(
    rootDirectory
  );
  const asset = loaded.assets.find(
    candidate =>
      candidate.ref === scaffoldReference
  );

  if (!asset) {
    throw new ScaffoldCatalogError(
      'SCAFFOLD_REFERENCE_NOT_FOUND',
      [scaffoldReference]
    );
  }

  const validation = validateInputAgainstSchema(
    asset.inputSchema,
    input
  );

  return Object.freeze({
    path: inputPath,
    data: structuredClone(input),
    sha256: sha256Canonical(input),
    schemaSha256:
      asset.definition.inputSchema.sha256,
    validation: Object.freeze({
      pass: validation.pass,
      errors: Object.freeze([...validation.errors])
    })
  });
}

export function catalogSummary(rootDirectory) {
  const loaded = assertCanonicalCatalog(
    rootDirectory
  );

  return Object.freeze({
    catalogId: loaded.catalog.catalogId,
    registryId:
      loaded.registryValue.registryId,
    authoritySha256:
      loaded.catalog.authoritySnapshot.sha256,
    entries: Object.freeze(
      loaded.assets.map(asset => Object.freeze({
        ref: asset.ref,
        status: asset.definition.status,
        gateId: asset.definition.authority.gateId,
        outputPattern:
          asset.definition.outputs[0].pathPattern
      }))
    )
  });
}

export {
  EXPECTED_REFS,
  SECTION_ORDER
};
