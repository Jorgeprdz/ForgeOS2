import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const evidence = mkdtempSync(join(tmpdir(), 'forge-067g16e-runner-'));
const result = spawnSync('bash', ['tools/forge-067g16e-evidence-runner.sh', '--self-test'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    FORGE_067G16E_EVIDENCE_DIR:evidence,
    FORGE_PUPPETEER_CORE_PATH:'self-test',
    FORGE_CHROMIUM_PATH:'self-test'
  },
  encoding:'utf8'
});
assert.equal(result.status, 0, result.stderr || result.stdout);
const ledger = readFileSync(join(evidence,'ledger.jsonl'),'utf8');
assert.match(ledger,/"self_exit_0".*"status":"PASS".*"exit_code":0/);
assert.match(ledger,/"self_exit_9".*"status":"FAIL".*"exit_code":9/);
console.log('067G16E RUNNER INTEGRITY: PASS');
