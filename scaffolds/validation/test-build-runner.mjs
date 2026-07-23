#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cli = path.join(root, 'tools/termux/build/forge-build');
const runner = path.join(root, 'tools/termux/build/forge-build-run.sh');

assert.equal(fs.existsSync(cli), true, 'CLI missing');
assert.equal(fs.existsSync(runner), true, 'runner missing');
console.log('PASS runner exists');

const syntax = spawnSync('bash', ['-n', runner], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr);
console.log('PASS runner syntax');

const help = spawnSync('bash', [cli, '--help'], { encoding: 'utf8' });
assert.equal(help.status, 0, help.stderr);
assert.match(help.stdout, /run \[module\]/);
console.log('PASS run command exposed');

const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-build-runner-'));
const env = {
  ...process.env,
  FORGE_BUILD_STATE_ROOT: stateRoot,
  FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS: '1',
  FORGE_BUILD_TEST_BRANCH_OVERRIDE: 'build/test-fixture',
  FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS: '1'
};

const invalid = spawnSync('bash', [cli, 'run', 'not/a/module'], { cwd: root, env, encoding: 'utf8' });
assert.notEqual(invalid.status, 0);
assert.match(`${invalid.stdout}\n${invalid.stderr}`, /MODULE_NOT_FOUND|FORGE_BUILD_RUN_ERROR/);
console.log('PASS invalid module rejected');

fs.rmSync(stateRoot, { recursive: true, force: true });

const gateStateRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'forge-build-gate-')
);

const gateEnv = {
  ...process.env,
  FORGE_BUILD_STATE_ROOT: gateStateRoot,
  FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS: '1',
  FORGE_BUILD_TEST_BRANCH_OVERRIDE: 'build/test-fixture',
  FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS: '1',
  FORGE_BUILD_GATE_ENABLE_OVERRIDES_FOR_TESTS: '1'
};

try {
  fs.writeFileSync(
    path.join(gateStateRoot, 'state.json'),
    `${JSON.stringify({
      schema_version: 1,
      active_module: 'MOD-GOVERNANCE-GATE',
      modules: {
        'MOD-GOVERNANCE-GATE': {
          status: 'contracts_ready',
          completed: false
        }
      },
      history: []
    }, null, 2)}\n`
  );

  const beforeBlocked = fs.readFileSync(
    path.join(gateStateRoot, 'state.json'),
    'utf8'
  );

  const blocked = spawnSync(
    'bash',
    [cli, 'advance', 'implementation_started'],
    {
      cwd: root,
      env: {
        ...gateEnv,
        FORGE_BUILD_GATE_VALIDATIONS_PASSED_FOR_TESTS: '0',
        FORGE_BUILD_GATE_EVIDENCE_PRESENT_FOR_TESTS: '1',
        FORGE_BUILD_GATE_AUTHORIZED_PATHS_ONLY_FOR_TESTS: '1'
      },
      encoding: 'utf8'
    }
  );

  assert.equal(blocked.status, 2);
  assert.match(
    `${blocked.stdout}\n${blocked.stderr}`,
    /FORGE_BUILD_PROMOTION_GATE=BLOCKED/
  );

  const afterBlocked = fs.readFileSync(
    path.join(gateStateRoot, 'state.json'),
    'utf8'
  );

  assert.equal(afterBlocked, beforeBlocked);
  console.log('PASS blocked gate does not mutate state');

  const passed = spawnSync(
    'bash',
    [cli, 'advance', 'implementation_started'],
    {
      cwd: root,
      env: {
        ...gateEnv,
        FORGE_BUILD_GATE_VALIDATIONS_PASSED_FOR_TESTS: '1',
        FORGE_BUILD_GATE_EVIDENCE_PRESENT_FOR_TESTS: '1',
        FORGE_BUILD_GATE_AUTHORIZED_PATHS_ONLY_FOR_TESTS: '1'
      },
      encoding: 'utf8'
    }
  );

  assert.equal(
    passed.status,
    0,
    `${passed.stdout}\n${passed.stderr}`
  );

  assert.match(
    passed.stdout,
    /FORGE_BUILD_PROMOTION_GATE=PASS/
  );

  const advancedState = JSON.parse(
    fs.readFileSync(
      path.join(gateStateRoot, 'state.json'),
      'utf8'
    )
  );

  assert.equal(
    advancedState.modules['MOD-GOVERNANCE-GATE'].status,
    'implementation_started'
  );

  console.log('PASS passing gate permits protected transition');
} finally {
  fs.rmSync(gateStateRoot, {
    recursive: true,
    force: true
  });
}

console.log('test-build-runner: PASS scenarios=6');
