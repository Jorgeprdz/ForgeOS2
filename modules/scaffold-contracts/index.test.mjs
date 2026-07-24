import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ContractValidationError,
  assertExecutionPlanApplicable,
  assertScaffoldDefinition,
  assertScaffoldExecutionPlan,
  assertScaffoldLock,
  assertScaffoldReceipt,
  canonicalJson,
  isSafeRepositoryPath,
  sha256Canonical,
  validateScaffoldDefinition,
  validateScaffoldExecutionPlan,
  validateScaffoldLock,
  validateScaffoldReceipt
} from './index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = relative => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', relative), 'utf8'));
const hasCode = (result, code) => result.errors.some(error => error.startsWith(`${code}:`));

// Path policy

test('accepts safe repository paths', () => {
  assert.equal(isSafeRepositoryPath('modules/example/index.mjs'), true);
  assert.equal(isSafeRepositoryPath('docs/example/{{slug}}.md'), true);
});

test('rejects absolute, traversal, backslash, empty segment, and .git paths', () => {
  for (const candidate of ['/tmp/file', '../file', 'docs/../file', 'docs\\file', 'docs//file', '.git/config', 'C:/file']) {
    assert.equal(isSafeRepositoryPath(candidate), false, candidate);
  }
});

// Canonical hashing

test('canonical JSON is stable across object key order', () => {
  assert.equal(canonicalJson({ b: 2, a: { d: 4, c: 3 } }), canonicalJson({ a: { c: 3, d: 4 }, b: 2 }));
});

test('canonical SHA-256 is stable across object key order', () => {
  assert.equal(sha256Canonical({ b: 2, a: 1 }), sha256Canonical({ a: 1, b: 2 }));
  assert.match(sha256Canonical({ a: 1 }), /^[a-f0-9]{64}$/);
});

// Scaffold definition

test('accepts an authorized documentary definition', () => {
  const result = validateScaffoldDefinition(fixture('definitions/valid-documentary-authorized.json'));
  assert.deepEqual(result, { pass: true, errors: [] });
});

test('accepts a blocked software definition before SG-003 ratification', () => {
  const result = validateScaffoldDefinition(fixture('definitions/valid-software-blocked.json'));
  assert.deepEqual(result, { pass: true, errors: [] });
});

test('rejects unknown top-level definition fields', () => {
  const result = validateScaffoldDefinition(fixture('definitions/invalid-extra-field.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'UNKNOWN_FIELD'), true);
});

test('rejects unsafe output path patterns', () => {
  const result = validateScaffoldDefinition(fixture('definitions/invalid-unsafe-path.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'UNSAFE_REPOSITORY_PATH'), true);
});

test('rejects authorization with unknown owner', () => {
  const result = validateScaffoldDefinition(fixture('definitions/invalid-authorized-unknown-owner.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'AUTHORIZED_REQUIRES_KNOWN_OWNER'), true);
});

test('rejects authorized software while SG-003 is not ratified', () => {
  const value = fixture('definitions/invalid-software-authorized-unratified.json');
  const result = validateScaffoldDefinition(value);
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'SOFTWARE_GATE_NOT_RATIFIED'), true);
});

test('accepts authorized software only with explicit SG-003 ratification context', () => {
  const value = fixture('definitions/invalid-software-authorized-unratified.json');
  const result = validateScaffoldDefinition(value, { softwareGateRatified: true });
  assert.deepEqual(result, { pass: true, errors: [] });
});

test('rejects missing baseline validation', () => {
  const result = validateScaffoldDefinition(fixture('definitions/invalid-missing-baseline-validation.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'MISSING_BASELINE_VALIDATION'), true);
});

test('rejects duplicate output ids and paths', () => {
  const result = validateScaffoldDefinition(fixture('definitions/invalid-duplicate-output.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'DUPLICATE_OUTPUT_ID'), true);
  assert.equal(hasCode(result, 'DUPLICATE_OUTPUT_PATH_PATTERN'), true);
});

test('rejects ratified authority without snapshot hash', () => {
  const result = validateScaffoldDefinition(fixture('definitions/invalid-ratified-without-snapshot.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'RATIFIED_AUTHORITY_REQUIRES_SNAPSHOT_HASH'), true);
});

test('assert definition throws a structured contract error', () => {
  assert.throws(
    () => assertScaffoldDefinition(fixture('definitions/invalid-extra-field.json')),
    error => error instanceof ContractValidationError && error.contractName === 'SCAFFOLD_DEFINITION_INVALID'
  );
});

// Execution plan

test('accepts a valid dry-run execution plan', () => {
  assert.deepEqual(validateScaffoldExecutionPlan(fixture('plans/valid-dry-run-plan.json')), { pass: true, errors: [] });
});

test('accepts a structurally valid plan that records conflicts', () => {
  assert.deepEqual(validateScaffoldExecutionPlan(fixture('plans/valid-structural-plan-with-conflict.json')), { pass: true, errors: [] });
});

test('rejects non-dry-run plan mode', () => {
  const result = validateScaffoldExecutionPlan(fixture('plans/invalid-apply-mode.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'PLAN_MODE_MUST_BE_DRY_RUN'), true);
});

test('rejects unsafe planned output paths', () => {
  const result = validateScaffoldExecutionPlan(fixture('plans/invalid-unsafe-output.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'UNSAFE_REPOSITORY_PATH'), true);
});

test('rejects plans that do not require human approval', () => {
  const result = validateScaffoldExecutionPlan(fixture('plans/invalid-no-approval.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'HUMAN_APPROVAL_REQUIRED'), true);
});

test('allows a clear hashed plan to become applicable', () => {
  assert.equal(assertExecutionPlanApplicable(fixture('plans/valid-dry-run-plan.json')).planId, 'SPLAN-ARCH-BOUNDARY-001');
});

test('blocks applicability when conflicts exist', () => {
  assert.throws(
    () => assertExecutionPlanApplicable(fixture('plans/valid-structural-plan-with-conflict.json')),
    error => error instanceof ContractValidationError && error.contractName === 'SCAFFOLD_EXECUTION_PLAN_NOT_APPLICABLE'
  );
});

test('assert execution plan throws for structural failure', () => {
  assert.throws(() => assertScaffoldExecutionPlan(fixture('plans/invalid-apply-mode.json')), ContractValidationError);
});

// Lock

test('accepts a valid dependency lock', () => {
  assert.deepEqual(validateScaffoldLock(fixture('locks/valid-lock.json')), { pass: true, errors: [] });
});

test('rejects malformed lock hashes', () => {
  const result = validateScaffoldLock(fixture('locks/invalid-hash.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'PATTERN_MISMATCH'), true);
});

test('rejects unsafe lock output patterns', () => {
  const result = validateScaffoldLock(fixture('locks/invalid-output-pattern.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'UNSAFE_REPOSITORY_PATH'), true);
});

test('assert lock throws for invalid lock', () => {
  assert.throws(() => assertScaffoldLock(fixture('locks/invalid-hash.json')), ContractValidationError);
});

// Receipt

test('accepts a valid PASS receipt', () => {
  assert.deepEqual(validateScaffoldReceipt(fixture('receipts/valid-pass-receipt.json')), { pass: true, errors: [] });
});

test('accepts a valid BLOCKED receipt with evidence', () => {
  assert.deepEqual(validateScaffoldReceipt(fixture('receipts/valid-blocked-receipt.json')), { pass: true, errors: [] });
});

test('rejects PASS receipts containing errors', () => {
  const result = validateScaffoldReceipt(fixture('receipts/invalid-pass-with-errors.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'PASS_RECEIPT_HAS_ERRORS'), true);
});

test('rejects approval bound to a different plan hash', () => {
  const result = validateScaffoldReceipt(fixture('receipts/invalid-approval-hash.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'APPROVAL_PLAN_HASH_MISMATCH'), true);
});

test('rejects PASS receipt with failed validation', () => {
  const result = validateScaffoldReceipt(fixture('receipts/invalid-pass-with-failed-validation.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'PASS_RECEIPT_HAS_FAILED_VALIDATION'), true);
});

test('rejects PASS receipt with unapplied output', () => {
  const result = validateScaffoldReceipt(fixture('receipts/invalid-pass-with-unapplied-output.json'));
  assert.equal(result.pass, false);
  assert.equal(hasCode(result, 'PASS_RECEIPT_HAS_UNAPPLIED_OUTPUT'), true);
});

test('assert receipt returns valid value and throws invalid value', () => {
  assert.equal(assertScaffoldReceipt(fixture('receipts/valid-pass-receipt.json')).status, 'PASS');
  assert.throws(() => assertScaffoldReceipt(fixture('receipts/invalid-pass-with-errors.json')), ContractValidationError);
});
