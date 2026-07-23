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
console.log('test-build-runner: PASS scenarios=4');
