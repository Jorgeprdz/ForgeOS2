#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const artifactRoot = path.join(root, 'scaffolds', 'artifacts');
const outputRoot = path.join(
  root,
  'platform',
  'contracts',
  'generated'
);
const reportRoot = path.join(root, 'scaffolds', 'reports');

fs.mkdirSync(outputRoot, { recursive: true });
fs.mkdirSync(reportRoot, { recursive: true });

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walk(target);
      }

      return entry.isFile() && entry.name.endsWith('.artifact.json')
        ? [target]
        : [];
    })
    .sort();
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(
      `INVALID_ARTIFACT_JSON file=${path.relative(root, file)} ` +
      `reason=${error.message}`
    );
  }
}

function slug(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function hash(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function literal(value) {
  return JSON.stringify(value, null, 2);
}

const files = walk(artifactRoot);

if (files.length === 0) {
  throw new Error('NO_MATERIALIZED_ARTIFACTS_FOUND');
}

const artifacts = files.map((file) => {
  const raw = fs.readFileSync(file, 'utf8');
  const contract = readJson(file);

  if (!contract.artifact_id) {
    throw new Error(
      `MISSING_ARTIFACT_ID file=${path.relative(root, file)}`
    );
  }

  if (!contract.stage_id) {
    throw new Error(
      `MISSING_STAGE_ID artifact=${contract.artifact_id}`
    );
  }

  return {
    file,
    relativeFile: path.relative(root, file),
    raw,
    contract,
    digest: hash(raw),
  };
});

const ids = new Set();

for (const artifact of artifacts) {
  if (ids.has(artifact.contract.artifact_id)) {
    throw new Error(
      `DUPLICATE_ARTIFACT_ID artifact=${artifact.contract.artifact_id}`
    );
  }

  ids.add(artifact.contract.artifact_id);
}

const generated = [];
const readiness = [];

for (const artifact of artifacts) {
  const contract = artifact.contract;
  const artifactId = contract.artifact_id;
  const filename = `${slug(artifactId)}.contract.mjs`;
  const output = path.join(outputRoot, filename);

  const allowed = Array.isArray(contract.allowed_operations)
    ? contract.allowed_operations
    : [];

  const prohibited = Array.isArray(contract.prohibited_operations)
    ? contract.prohibited_operations
    : [];

  const productCodeAllowed =
    allowed.includes('apply product code') &&
    !prohibited.includes('apply product code');

  const implementationStatus = productCodeAllowed
    ? 'FUNCTIONAL_IMPLEMENTATION_ALLOWED'
    : 'CONTRACT_RUNTIME_ONLY';

  const source = `// AUTO-GENERATED. DO NOT EDIT.
// Source: ${artifact.relativeFile}
// Artifact: ${artifactId}
// Stage: ${contract.stage_id}
// Source SHA-256: ${artifact.digest}

const contract = Object.freeze(${literal(contract)});

export const artifactId = ${JSON.stringify(artifactId)};
export const stageId = ${JSON.stringify(contract.stage_id)};
export const sourceDigest = ${JSON.stringify(artifact.digest)};
export const implementationStatus = ${JSON.stringify(
    implementationStatus
  )};

export function getContract() {
  return contract;
}

export function validateContractShape(candidate) {
  const errors = [];

  if (!candidate || typeof candidate !== 'object') {
    errors.push('CONTRACT_MUST_BE_OBJECT');
    return { valid: false, errors };
  }

  if (candidate.artifact_id !== artifactId) {
    errors.push('ARTIFACT_ID_MISMATCH');
  }

  if (candidate.stage_id !== stageId) {
    errors.push('STAGE_ID_MISMATCH');
  }

  if (!Array.isArray(candidate.consumes)) {
    errors.push('CONSUMES_MUST_BE_ARRAY');
  }

  if (!Array.isArray(candidate.boundaries)) {
    errors.push('BOUNDARIES_MUST_BE_ARRAY');
  }

  if (candidate.fail_closed !== true) {
    errors.push('FAIL_CLOSED_REQUIRED');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function assertFunctionalImplementationAllowed() {
  if (implementationStatus !== 'FUNCTIONAL_IMPLEMENTATION_ALLOWED') {
    throw new Error(
      'FORGE_FUNCTIONAL_IMPLEMENTATION_NOT_AUTHORIZED:${artifactId}'
    );
  }

  return true;
}
`;

  fs.writeFileSync(output, source);

  generated.push({
    artifact_id: artifactId,
    stage_id: contract.stage_id,
    source_path: artifact.relativeFile,
    generated_path: path.relative(root, output),
    source_digest: artifact.digest,
    implementation_status: implementationStatus,
    consumes: Array.isArray(contract.consumes)
      ? contract.consumes
      : [],
  });

  readiness.push({
    artifact_id: artifactId,
    stage_id: contract.stage_id,
    implementation_status: implementationStatus,
    allowed_operations: allowed,
    prohibited_operations: prohibited,
    reason: productCodeAllowed
      ? 'Artifact explicitly authorizes product-code application.'
      : 'Artifact does not explicitly authorize product-code application.',
  });
}

const imports = generated
  .map((entry, index) => {
    const name = `contract${index}`;
    const filename = path.basename(entry.generated_path);

    const modulePath = `.${path.sep}${filename}`.replaceAll('\\\\', '/');

    return `import * as ${name} from '${modulePath}';`;
  })
  .join('\n');

const registrations = generated
  .map((entry, index) => {
    return `  [contract${index}.artifactId, contract${index}],`;
  })
  .join('\n');

const registrySource = `// AUTO-GENERATED. DO NOT EDIT.

${imports}

export const contractRegistry = new Map([
${registrations}
]);

export function getContractModule(artifactId) {
  const module = contractRegistry.get(artifactId);

  if (!module) {
    throw new Error(
      \`FORGE_UNKNOWN_CONTRACT:\${artifactId}\`
    );
  }

  return module;
}

export function listContracts() {
  return [...contractRegistry.keys()].sort();
}

export function validateRegistry() {
  const results = [];

  for (const [artifactId, module] of contractRegistry) {
    const result = module.validateContractShape(
      module.getContract()
    );

    results.push({
      artifact_id: artifactId,
      valid: result.valid,
      errors: result.errors
    });
  }

  return {
    valid: results.every((item) => item.valid),
    results
  };
}
`;

fs.writeFileSync(
  path.join(outputRoot, 'index.mjs'),
  registrySource
);

const report = {
  generated_at: new Date().toISOString(),
  generator: 'tools/codegen/generate-contract-runtime.mjs',
  artifact_count: artifacts.length,
  generated_module_count: generated.length,
  functional_implementation_allowed_count: readiness.filter(
    (item) =>
      item.implementation_status ===
      'FUNCTIONAL_IMPLEMENTATION_ALLOWED'
  ).length,
  contract_runtime_only_count: readiness.filter(
    (item) =>
      item.implementation_status ===
      'CONTRACT_RUNTIME_ONLY'
  ).length,
  generated,
  readiness,
};

fs.writeFileSync(
  path.join(reportRoot, 'contract-codegen-report.json'),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(
  `CONTRACT_CODEGEN=PASS artifacts=${artifacts.length} ` +
  `generated=${generated.length}`
);
console.log(
  `FUNCTIONAL_IMPLEMENTATION_ALLOWED=` +
  report.functional_implementation_allowed_count
);
console.log(
  `CONTRACT_RUNTIME_ONLY=` +
  report.contract_runtime_only_count
);
