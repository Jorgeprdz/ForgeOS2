import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  sha256Canonical
} from '../scaffold-contracts/index.mjs';

import {
  createScaffoldRegistry
} from '../scaffold-registry/index.mjs';

import {
  buildScaffoldPlan
} from '../scaffold-planner/index.mjs';

import {
  renderScaffoldInMemory,
  stageRenderedScaffold
} from '../scaffold-renderer/index.mjs';

import {
  validateRenderedScaffoldBundle
} from '../scaffold-validator/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = name => path.join(here, 'fixtures', name);
const read = name => fs.readFileSync(fixturePath(name), 'utf8');
const readJson = name => JSON.parse(read(name));

export const registryValue = readJson('registry.json');
export const inputData = readJson('input.json');
export const templateText =
  read('architecture-boundary.template.md');
export const expectedText = read('expected-output.md');
export const registry = createScaffoldRegistry(registryValue);
export const definition = registry.resolve(
  'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0'
);

export function makeRoots(prefix = 'forge-wave5-') {
  const base = fs.mkdtempSync(
    path.join(os.tmpdir(), prefix)
  );
  const repositoryRoot = path.join(base, 'repo');
  const stagingParent = path.join(base, 'staging');
  const evidenceParent = path.join(base, 'evidence');
  fs.mkdirSync(repositoryRoot);
  fs.mkdirSync(stagingParent);
  fs.mkdirSync(evidenceParent);

  return {
    base,
    repositoryRoot,
    stagingParent,
    evidenceParent
  };
}

export function buildContext(roots, options = {}) {
  if (options.seedRepositoryFile) {
    const seedPath = path.join(
      roots.repositoryRoot,
      options.seedRepositoryFile.path
    );
    fs.mkdirSync(path.dirname(seedPath), {
      recursive: true
    });
    fs.writeFileSync(
      seedPath,
      options.seedRepositoryFile.text
    );
  }

  const plan = buildScaffoldPlan({
    registry: registryValue,
    scaffoldReference:
      'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
    input: {
      path: '.forge21/scaffold-inputs/client-truth.json',
      data: structuredClone(inputData),
      sha256: sha256Canonical(inputData),
      schemaSha256: definition.inputSchema.sha256,
      validation: { pass: true, errors: [] }
    },
    authoritySnapshot: {
      gateId: definition.authority.gateId,
      ratified: true,
      sha256: definition.authority.snapshotSha256
    },
    sourceRef:
      '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
    registrySha256: registry.hash,
    destinationInventory: {},
    runId: '20260724T030000Z-WAVE5',
    planId: 'SPLAN-WAVE5',
    createdAt: '2026-07-24T03:00:00Z'
  });

  const renderResult = renderScaffoldInMemory({
    plan,
    registry: registryValue,
    registrySha256: registry.hash,
    inputData,
    templateText
  });

  const staged = stageRenderedScaffold({
    renderResult,
    stagingParent: roots.stagingParent,
    repositoryRoot: roots.repositoryRoot
  });

  const repositorySnapshot = options.repositorySnapshot ??
    {
      repositoryBefore: options.sideEffectHash ??
        '9'.repeat(64),
      repositoryAfter: options.sideEffectHash ??
        '9'.repeat(64),
      repositoryWrites: false,
      gitOperations: false,
      networkOperations: false,
      providerOperations: false
    };

  const validationReport = validateRenderedScaffoldBundle({
    reportId: 'SVRPT-WAVE5',
    createdAt: '2026-07-24T03:00:05Z',
    renderResult,
    stagingDirectory: staged.stagingDirectory,
    registry: registryValue,
    registrySha256: registry.hash,
    inputData,
    templateText,
    repositoryRoot: roots.repositoryRoot,
    upstreamValidations: [
      {
        id: 'SCV-001',
        status: 'PASS',
        evidence: ['constitutionalGate=COMPLETE']
      },
      {
        id: 'SCV-006',
        status: 'PASS',
        evidence: ['inputSchemaValidation=PASS']
      }
    ],
    sideEffectSnapshot: repositorySnapshot
  });

  const environment = {
    engineVersion: '2.1.0',
    nodeVersion: process.version,
    platform: process.platform,
    sourceRef:
      '71198a8a0c4cbff51b189f95966d6e97a0b89d3b',
    workingTreeCleanBefore: true
  };

  return {
    plan,
    renderResult,
    staged,
    validationReport,
    environment,
    bundle: {
      validationReport,
      renderResult,
      stagingDirectory: staged.stagingDirectory,
      environment
    }
  };
}
