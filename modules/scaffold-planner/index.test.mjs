import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createScaffoldRegistry } from '../scaffold-registry/index.mjs';
import {
  ScaffoldPlanError,
  buildScaffoldPlan,
  hashScaffoldPlan,
  renderPathPattern,
  verifyScaffoldPlanHash
} from './index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.join(here, '..', 'scaffold-registry', 'fixtures', 'valid-registry.json');
const registryValue = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const context = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'valid-context.json'), 'utf8'));
const registrySha256 = createScaffoldRegistry(registryValue).hash;

function build(overrides = {}) {
  return buildScaffoldPlan({
    registry: registryValue,
    registrySha256,
    ...structuredClone(context),
    ...overrides
  });
}

test('renders a safe deterministic path pattern', () => {
  assert.deepEqual(
    renderPathPattern('docs/{{document_id}}.md', { document_id: 'EXAMPLE_BOUNDARY' }),
    { path: 'docs/EXAMPLE_BOUNDARY.md', usedTokens: ['document_id'] }
  );
});

test('rejects missing path tokens', () => {
  assert.throws(
    () => renderPathPattern('docs/{{document_id}}.md', {}),
    error => error instanceof ScaffoldPlanError && error.code === 'PATH_TOKEN_MISSING'
  );
});

test('rejects unsafe token values', () => {
  assert.throws(
    () => renderPathPattern('docs/{{document_id}}.md', { document_id: '../escape' }),
    error => error instanceof ScaffoldPlanError && error.code === 'PATH_TOKEN_VALUE_UNSAFE'
  );
});

test('builds a deterministic dry-run plan without repository writes', () => {
  const first = build();
  const second = build();
  assert.deepEqual(first, second);
  assert.equal(first.mode, 'DRY_RUN');
  assert.equal(first.conflicts.length, 0);
  assert.equal(first.plannedOutputs[0].conflictState, 'CLEAR_CREATE');
  assert.equal(first.plannedOutputs[0].expectedSha256, null);
});

test('plan hash verifies', () => {
  const plan = build();
  assert.equal(verifyScaffoldPlanHash(plan), true);
  assert.equal(hashScaffoldPlan(plan), plan.planSha256);
});

test('detects a registry hash mismatch', () => {
  assert.throws(
    () => build({ registrySha256: 'f'.repeat(64) }),
    error => error instanceof ScaffoldPlanError && error.code === 'REGISTRY_HASH_MISMATCH'
  );
});

test('requires exact scaffold reference', () => {
  assert.throws(
    () => build({ scaffoldReference: 'SCF-DOC-ARCHITECTURE-BOUNDARY' }),
    error => error.code === 'EXACT_SCAFFOLD_REFERENCE_REQUIRED'
  );
});

test('blocks a definition that is not authorized', () => {
  assert.throws(
    () => build({ scaffoldReference: 'SCF-DOC-ARCHITECTURE-BOUNDARY@0.9.0' }),
    error => error instanceof ScaffoldPlanError && error.code === 'SCAFFOLD_NOT_AUTHORIZED'
  );
});

test('blocks software scaffold before SG-003 ratification', () => {
  assert.throws(
    () => build({ scaffoldReference: 'SCF-MODULE-ESM@0.1.0-proposal' }),
    error => error instanceof ScaffoldPlanError && error.code === 'SCAFFOLD_NOT_AUTHORIZED'
  );
});

test('requires a ratified authority snapshot', () => {
  const authoritySnapshot = { ...context.authoritySnapshot, ratified: false };
  assert.throws(
    () => build({ authoritySnapshot }),
    error => error instanceof ScaffoldPlanError && error.code === 'AUTHORITY_NOT_RATIFIED'
  );
});

test('requires authority snapshot hash equality', () => {
  const authoritySnapshot = { ...context.authoritySnapshot, sha256: 'f'.repeat(64) };
  assert.throws(
    () => build({ authoritySnapshot }),
    error => error instanceof ScaffoldPlanError && error.code === 'AUTHORITY_SNAPSHOT_HASH_MISMATCH'
  );
});

test('requires input validation PASS', () => {
  const input = structuredClone(context.input);
  input.validation = { pass: false, errors: ['INVALID'] };
  assert.throws(
    () => build({ input }),
    error => error instanceof ScaffoldPlanError && error.code === 'INPUT_VALIDATION_REQUIRED'
  );
});

test('requires empty input validation errors', () => {
  const input = structuredClone(context.input);
  input.validation = { pass: true, errors: ['WARN_AS_ERROR'] };
  assert.throws(
    () => build({ input }),
    error => error instanceof ScaffoldPlanError && error.code === 'INPUT_VALIDATION_ERRORS_PRESENT'
  );
});

test('requires exact input schema hash', () => {
  const input = structuredClone(context.input);
  input.schemaSha256 = 'f'.repeat(64);
  assert.throws(
    () => build({ input }),
    error => error instanceof ScaffoldPlanError && error.code === 'INPUT_SCHEMA_HASH_MISMATCH'
  );
});

test('requires canonical input hash equality', () => {
  const input = structuredClone(context.input);
  input.sha256 = 'f'.repeat(64);
  assert.throws(
    () => build({ input }),
    error => error instanceof ScaffoldPlanError && error.code === 'INPUT_HASH_MISMATCH'
  );
});

test('records an existing create target as a conflict', () => {
  const destinationInventory = {
    'docs/architecture/scaffolds/instances/boundaries/CLIENT_TRUTH_BOUNDARY.md': {
      exists: true,
      dirty: false,
      symlink: false,
      sha256: 'e'.repeat(64)
    }
  };
  const plan = build({ destinationInventory });
  assert.equal(plan.plannedOutputs[0].conflictState, 'CONFLICT_EXISTS');
  assert.equal(plan.conflicts[0].includes('CREATE_TARGET_EXISTS'), true);
});

test('records a dirty target as a conflict', () => {
  const destinationInventory = {
    'docs/architecture/scaffolds/instances/boundaries/CLIENT_TRUTH_BOUNDARY.md': {
      exists: true,
      dirty: true,
      symlink: false,
      sha256: 'e'.repeat(64)
    }
  };
  const plan = build({ destinationInventory });
  assert.equal(plan.plannedOutputs[0].conflictState, 'CONFLICT_DIRTY');
});

test('blocks symlink destinations', () => {
  const destinationInventory = {
    'docs/architecture/scaffolds/instances/boundaries/CLIENT_TRUTH_BOUNDARY.md': {
      exists: true,
      dirty: false,
      symlink: true,
      sha256: 'e'.repeat(64)
    }
  };
  const plan = build({ destinationInventory });
  assert.equal(plan.plannedOutputs[0].conflictState, 'BLOCKED_SYMLINK');
});

test('rejects unsafe inventory paths', () => {
  assert.throws(
    () => build({ destinationInventory: { '../escape': { exists: true } } }),
    error => error instanceof ScaffoldPlanError && error.code === 'INVENTORY_PATH_UNSAFE'
  );
});

test('requires explicit deterministic run identity fields', () => {
  assert.throws(
    () => build({ runId: '' }),
    error => error instanceof ScaffoldPlanError && error.code === 'RUN_ID_REQUIRED'
  );
});

test('detects tampered plan hashes', () => {
  const plan = structuredClone(build());
  plan.sourceRef = 'tampered-ref';
  assert.throws(
    () => verifyScaffoldPlanHash(plan),
    error => error instanceof ScaffoldPlanError && error.code === 'PLAN_HASH_MISMATCH'
  );
});
