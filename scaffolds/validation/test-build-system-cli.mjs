#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cli = join(root, 'tools/termux/build/forge-build');
const stateRoot = mkdtempSync(join(tmpdir(), 'forge-build-system-'));

function run(args, expectedStatus = 0) {
  const result = spawnSync('bash', [cli, ...args], {
    cwd: root,
    env: {
      ...process.env,
      FORGE_BUILD_STATE_ROOT: stateRoot,
      FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS: '1',
      FORGE_BUILD_TEST_BRANCH_OVERRIDE: 'build/test-fixture',
      FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS: '1'
    },
    encoding: 'utf8'
  });

  assert.equal(
    result.status,
    expectedStatus,
    `command failed: ${args.join(' ')}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return `${result.stdout}${result.stderr}`;
}

try {
  let output = run(['doctor']);
  assert.match(output, /FORGE_BUILD_DOCTOR=PASS/);
  console.log('PASS doctor');

  output = run(['dashboard']);
  assert.match(output, /COMPLETED=0\/31/);
  assert.match(output, /CURRENT_MODULE=none/);
  console.log('PASS dashboard');

  output = run(['graph', 'MOD-GOVERNANCE-GATE']);
  assert.match(output, /MODULE=MOD-GOVERNANCE-GATE/);
  console.log('PASS graph module');

  output = run(['history', '5']);
  assert.match(output, /EVENT_COUNT=0/);
  console.log('PASS history empty');

  output = run(['evidence', 'MOD-GOVERNANCE-GATE']);
  assert.match(output, /FORGE_BUILD_EVIDENCE=PASS/);
  console.log('PASS evidence');

  output = run(['unknown-command'], 1);
  assert.match(output, /UNSUPPORTED_COMMAND:unknown-command/);
  console.log('PASS unknown command rejected');

  console.log('test-build-system-cli: PASS scenarios=6');
} finally {
  rmSync(stateRoot, { recursive: true, force: true });
}
