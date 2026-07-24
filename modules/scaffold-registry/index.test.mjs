import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ScaffoldRegistryError,
  createScaffoldRegistry,
  hashScaffoldRegistry,
  parseExactScaffoldReference,
  scaffoldRef,
  validateScaffoldRegistry
} from './index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = name => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'));

test('validates a closed registry with multiple explicit versions', () => {
  assert.deepEqual(validateScaffoldRegistry(fixture('valid-registry.json')), { pass: true, errors: [] });
});

test('rejects unknown registry fields', () => {
  const result = validateScaffoldRegistry(fixture('invalid-unknown-field.json'));
  assert.equal(result.pass, false);
  assert.equal(result.errors.some(error => error.startsWith('UNKNOWN_FIELD:')), true);
});

test('rejects duplicate exact references', () => {
  const result = validateScaffoldRegistry(fixture('invalid-duplicate-ref.json'));
  assert.equal(result.pass, false);
  assert.equal(result.errors.includes('DUPLICATE_EXACT_REFERENCE:$.definitions'), true);
});

test('rejects registries containing an invalid definition', () => {
  const result = validateScaffoldRegistry(fixture('invalid-definition.json'));
  assert.equal(result.pass, false);
  assert.equal(result.errors.some(error => error.startsWith('DEFINITION_INVALID:')), true);
});

test('creates a deterministic registry hash', () => {
  const value = fixture('valid-registry.json');
  assert.match(hashScaffoldRegistry(value), /^[a-f0-9]{64}$/);
  assert.equal(hashScaffoldRegistry(value), hashScaffoldRegistry(structuredClone(value)));
});

test('lists definitions in deterministic ID and semantic-version order', () => {
  const registry = createScaffoldRegistry(fixture('valid-registry.json'));
  assert.deepEqual(
    registry.list().map(scaffoldRef),
    [
      'SCF-DOC-ARCHITECTURE-BOUNDARY@0.9.0',
      'SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0',
      'SCF-MODULE-ESM@0.1.0-proposal'
    ]
  );
});

test('resolves only an exact reference', () => {
  const registry = createScaffoldRegistry(fixture('valid-registry.json'));
  assert.equal(
    registry.resolve('SCF-DOC-ARCHITECTURE-BOUNDARY@1.0.0').title,
    'Canonical Architecture Boundary'
  );
});

test('rejects implicit latest resolution', () => {
  const registry = createScaffoldRegistry(fixture('valid-registry.json'));
  assert.throws(
    () => registry.resolve('SCF-DOC-ARCHITECTURE-BOUNDARY'),
    error => error instanceof ScaffoldRegistryError &&
      error.code === 'EXACT_SCAFFOLD_REFERENCE_REQUIRED'
  );
});

test('rejects unresolved exact references', () => {
  const registry = createScaffoldRegistry(fixture('valid-registry.json'));
  assert.throws(
    () => registry.resolve('SCF-DOC-ARCHITECTURE-BOUNDARY@9.9.9'),
    error => error instanceof ScaffoldRegistryError &&
      error.code === 'SCAFFOLD_REFERENCE_NOT_FOUND'
  );
});

test('reports versions in semantic order', () => {
  const registry = createScaffoldRegistry(fixture('valid-registry.json'));
  assert.deepEqual(
    registry.versions('SCF-DOC-ARCHITECTURE-BOUNDARY'),
    ['0.9.0', '1.0.0']
  );
});

test('has checks exact reference presence', () => {
  const registry = createScaffoldRegistry(fixture('valid-registry.json'));
  assert.equal(registry.has('SCF-MODULE-ESM@0.1.0-proposal'), true);
  assert.equal(registry.has('SCF-MODULE-ESM@1.0.0'), false);
});

test('parses exact scaffold references', () => {
  assert.deepEqual(
    parseExactScaffoldReference('SCF-MODULE-ESM@0.1.0-proposal'),
    { id: 'SCF-MODULE-ESM', version: '0.1.0-proposal' }
  );
});
