import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const ui = path.join(repoRoot, 'tools/termux/build/forge-build-ui.sh');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-build-ui-'));

function run(args, extraEnv = {}) {
  return spawnSync('bash', [ui, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      COLUMNS: '100',
      FORGE_BUILD_STATE_ROOT: tmp,
      FORGE_BUILD_ENABLE_BRANCH_OVERRIDE_FOR_TESTS: '1',
      FORGE_BUILD_TEST_BRANCH_OVERRIDE: 'build/test-fixture',
      FORGE_BUILD_ALLOW_DIRTY_FOR_TESTS: '1',
      ...extraEnv
    },
    encoding: 'utf8'
  });
}

try {
  assert.equal(fs.existsSync(ui), true);

  const syntax = spawnSync('bash', ['-n', ui], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
  console.log('PASS build UI shell syntax');

  const status = run(['status']);
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /PROCESANDO ARTEFACTOS/);
  assert.match(status.stdout, /scaffolds\/manifest\/build-order\.json/);
  assert.match(status.stdout, /FORGE_BUILD_COMMAND=status/);
  assert.match(status.stdout, /FORGE_BUILD_ARTIFACT_PANEL=PASS/);
  assert.match(status.stdout, /RUN_LOG=/);
  console.log('PASS artifact activity panel');

  const compact = run(['status'], { COLUMNS: '60' });
  assert.equal(compact.status, 0, compact.stderr);
  assert.match(compact.stdout, /▶ scaffolds\/manifest\/build-order\.json/);
  console.log('PASS compact artifact activity');

  const unsupported = run(['shell']);
  assert.notEqual(unsupported.status, 0);
  assert.match(`${unsupported.stdout}\n${unsupported.stderr}`, /UNSUPPORTED_COMMAND/);
  console.log('PASS unsupported UI command rejected');

  console.log('test-build-ui: PASS scenarios=4');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
