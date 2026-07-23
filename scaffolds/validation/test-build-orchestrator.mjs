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
const rewriteTmp = path.join(tmp, 'rewrite');

function run(args, extraEnv = {}) {
  return spawnSync('bash', [launcher, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      FORGE_BUILD_STATE_ROOT: tmp,
      FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS: '1',
      FORGE_BUILD_TEST_BRANCH_OVERRIDE: 'build/test-fixture',
      FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS: '1',
      FORGE_REWRITE_STATE_ROOT: rewriteTmp,
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

  const carrier = run(['inspect', 'MOD-CARRIER-SCOPE']);
  assert.equal(carrier.status, 0, carrier.stderr);
  assert.match(carrier.stdout, /IMPLEMENT_ELIGIBLE=NO/);
  assert.match(carrier.stdout, /DEPENDENCIES=SG-023,SG-026/);
  assert.match(carrier.stdout, /UNRESOLVED_PREREQUISITES=carrier scope naming convention ratified \| SG-023 completed or ratified \| SG-026 completed or ratified/);
  assert.match(carrier.stdout, /ALLOWED_OPERATIONS=plan,record blocked evidence,dry-run,validate/);
  assert.match(carrier.stdout, /PROHIBITED_OPERATIONS=apply product code,copy legacy runtime,write production data,external side effects/);
  assert.match(carrier.stdout, /BLOCKERS=.*IMPLEMENT_OPERATION_NOT_ALLOWED/);
  assert.match(carrier.stdout, /BLOCKERS=.*STAGE_DEPENDENCY_PENDING:SG-023/);
  assert.match(carrier.stdout, /BLOCKERS=.*STAGE_DEPENDENCY_PENDING:SG-026/);
  pass('carrier scope semantic blockers from canonical stage manifest');

  fs.writeFileSync(path.join(tmp, 'state.json'), JSON.stringify({
    schema_version: 1,
    active_module: 'MOD-CARRIER-SCOPE',
    modules: { 'MOD-CARRIER-SCOPE': { status: 'architecture_ready', completed: false } },
    history: []
  }, null, 2));
  const carrierStatus = run(['status']);
  assert.equal(carrierStatus.status, 0, carrierStatus.stderr);
  assert.match(carrierStatus.stdout, /IMPLEMENT_ELIGIBLE=NO/);
  assert.match(carrierStatus.stdout, /DEPENDENCIES=SG-023,SG-026/);
  assert.match(carrierStatus.stdout, /BLOCKERS=.*PREREQUISITE_UNRESOLVED:carrier scope naming convention ratified/);
  pass('status exposes active carrier semantic blockers');

  fs.writeFileSync(path.join(tmp, 'state.json'), JSON.stringify({
    schema_version: 1,
    active_module: null,
    modules: { 'MOD-CARRIER-SCOPE': { status: 'merged', completed: true } },
    history: []
  }, null, 2));
  const completedCarrier = run(['inspect', 'MOD-CARRIER-SCOPE']);
  assert.equal(completedCarrier.status, 0, completedCarrier.stderr);
  assert.match(completedCarrier.stdout, /COMPLETED=YES/);
  assert.match(completedCarrier.stdout, /IMPLEMENT_ELIGIBLE=YES/);
  assert.match(completedCarrier.stdout, /BLOCKERS=none/);
  pass('completed module behavior preserved');

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

  console.log('test-build-orchestrator: PASS scenarios=8');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
