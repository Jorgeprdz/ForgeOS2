import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const launcher = path.join(repoRoot, 'tools/termux/build/forge-build-launch.sh');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-build-orchestrator-'));

function run(args, extraEnv = {}) {
  return spawnSync('bash', [launcher, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      FORGE_BUILD_STATE_ROOT: tmp,
      FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS: '1',
      FORGE_BUILD_TEST_BRANCH_OVERRIDE: 'build/test-fixture',
      FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS: '1',
      ...extraEnv
    },
    encoding: 'utf8'
  });
}

function pass(name) {
  console.log(`PASS ${name}`);
}

try {
  assert.equal(fs.existsSync(launcher), true);
  pass('launcher exists');

  const status = run(['status']);
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /FORGE_BUILD_COMMAND=status/);
  assert.match(status.stdout, /ACTIVE_MODULE=none/);
  pass('status with temporary state');

  const inspect = run(['inspect', 'MOD-GOVERNANCE-GATE']);
  assert.equal(inspect.status, 0, inspect.stderr);
  assert.match(inspect.stdout, /MODULE=MOD-GOVERNANCE-GATE/);
  assert.match(inspect.stdout, /IMPLEMENT_ELIGIBLE=YES/);
  pass('inspect governance gate');

  const invalid = run(['inspect', '../../tmp/payload']);
  assert.notEqual(invalid.status, 0);
  assert.match(`${invalid.stdout}\n${invalid.stderr}`, /MODULE_NOT_FOUND/);
  pass('path-like module rejected');

  const resumeBefore = fs.existsSync(path.join(tmp, 'state.json'))
    ? fs.readFileSync(path.join(tmp, 'state.json'), 'utf8')
    : null;
  const resume = run(['resume']);
  assert.equal(resume.status, 0, resume.stderr);
  assert.match(resume.stdout, /RESUME_MUTATED=NO/);
  const resumeAfter = fs.existsSync(path.join(tmp, 'state.json'))
    ? fs.readFileSync(path.join(tmp, 'state.json'), 'utf8')
    : null;
  assert.equal(resumeAfter, resumeBefore);
  pass('resume is read-only');

  const unsupported = run(['shell', 'echo-pwned']);
  assert.notEqual(unsupported.status, 0);
  assert.match(`${unsupported.stdout}\n${unsupported.stderr}`, /UNSUPPORTED_COMMAND/);
  pass('unknown command rejected');

  console.log('test-build-orchestrator: PASS scenarios=5');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
