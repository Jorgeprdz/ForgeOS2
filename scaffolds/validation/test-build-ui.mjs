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
      FORGE_BUILD_NO_ANSI: '1',
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
  assert.match(status.stdout, /FORGE BUILD · PROCESANDO ARTEFACTOS/);
  assert.match(status.stdout, /LIFECYCLE/);
  assert.match(status.stdout, /MÓDULOS/);
  assert.match(status.stdout, /TIEMPO/);
  assert.match(status.stdout, /architecture_ready/);
  assert.match(status.stdout, /0\/31 completados/);
  assert.match(status.stdout, /FORGE_BUILD_COMMAND=status/);
  assert.match(status.stdout, /FORGE_BUILD_ARTIFACT_PANEL=PASS/);
  assert.match(status.stdout, /FORGE_BUILD_UI_EXIT_CODE=0/);
  assert.match(status.stdout, /RUN_LOG=/);
  assert.doesNotMatch(status.stdout, /ARCHIVO ACTUAL: .*\.forge\/build\/state\.json/);
  console.log('PASS live dashboard metadata');
  console.log('PASS state path excluded from artifact activity');

  const compact = run(['status'], { COLUMNS: '60' });
  assert.equal(compact.status, 0, compact.stderr);
  assert.match(compact.stdout, /FORGE \[/);
  assert.match(compact.stdout, /▶ scaffolds\/manifest\/build-order\.json/);
  assert.doesNotMatch(compact.stdout, /▶ .*\.forge\/build\/state\.json/);
  console.log('PASS compact dashboard');

  const unsupported = run(['shell']);
  assert.notEqual(unsupported.status, 0);
  assert.match(`${unsupported.stdout}\n${unsupported.stderr}`, /UNSUPPORTED_COMMAND/);
  console.log('PASS unsupported UI command rejected');

  console.log('test-build-ui: PASS scenarios=5');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
