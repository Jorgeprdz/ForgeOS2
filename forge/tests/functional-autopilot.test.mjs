import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..', '..');
const wrapper = path.join(root, 'tools', 'forge-autopilot');
const autopilot = path.join(root, 'forge', 'autopilot', 'autopilot.mjs');
const policyPath = path.join(root, 'forge', 'autopilot', 'policy.json');
const actionsPath = path.join(root, 'forge', 'autopilot', 'module-actions.json');

function run(...args) {
  return spawnSync('bash', [wrapper, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env
  });
}

function combined(result) {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

test('prints binary completion criteria', () => {
  const result = run('criteria');
  assert.equal(result.status, 0, combined(result));
  assert.match(result.stdout, /AREA 3 — Runtime/);
  assert.match(result.stdout, /consumerBoundary/);
  assert.match(result.stdout, /manualSteps=\[\]/);
});

test('audits structural and functional progress separately', () => {
  const result = run('audit');
  assert.equal(result.status, 0, combined(result));
  assert.match(result.stdout, /GLOBAL_STRUCTURAL=/);
  assert.match(result.stdout, /GLOBAL_FUNCTIONAL_REAL=/);
  assert.match(result.stdout, /FALSE_GREEN_COUNT=/);
  assert.match(result.stdout, /NEXT_MODULE=MOD-PRODUCT-INTELLIGENCE/);
  assert.equal(
    fs.existsSync(path.join(root, '.forge21', 'autopilot', 'reports', 'latest.json')),
    true
  );
});

test('recommendation follows functional priority rather than alphabetic order', () => {
  const result = run('recommend');
  assert.equal(result.status, 0, combined(result));
  assert.match(result.stdout, /NEXT_AREA=runtime/);
  assert.match(result.stdout, /NEXT_MODULE=MOD-PRODUCT-INTELLIGENCE/);
});

test('unknown commands fail closed with a stable error code', () => {
  const result = run('definitely-not-a-command');
  assert.notEqual(result.status, 0);
  assert.match(combined(result), /AUTOPILOT_ERROR_CODE=UNKNOWN_COMMAND/);
});

test('policy weights are complete and sum to one', () => {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const expectedAreas = [
    'architecture',
    'scaffolds',
    'runtime',
    'integrations',
    'productE2E'
  ];
  assert.deepEqual(Object.keys(policy.weights).sort(), expectedAreas.sort());
  const total = Object.values(policy.weights).reduce((sum, value) => sum + value, 0);
  assert.equal(total, 1);
  assert.deepEqual(policy.priorityOrder.slice(0, 3), [
    'runtime',
    'integrations',
    'productE2E'
  ]);
});

test('runtime actions fail closed until real implementation hooks exist', () => {
  const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
  for (const moduleId of ['MOD-CARRIER-SCOPE', 'MOD-PRODUCT-INTELLIGENCE']) {
    const action = actions.modules[moduleId];
    assert.ok(action);
    assert.equal(action.implementationCommand, null);
    assert.equal(action.functionalTestCommand, null);
    assert.deepEqual(action.consumerTestPaths, []);
    assert.ok(action.changedPaths.includes(`.forge21/functional-evidence/${moduleId}`));
  }
});

test('git and command subprocesses are insulated from Android FUSE cwd', () => {
  const source = fs.readFileSync(autopilot, 'utf8');
  assert.match(source, /cwd:\s*os\.homedir\(\)/);
  assert.match(source, /\['-C', root, \.\.\.args\]/);
});
