import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const evidence = mkdtempSync(join(tmpdir(), 'forge-067g17a1-runner-'));
const result = spawnSync('sh', ['tools/forge-067g17a1-local-runner.sh', '--self-test'], {
  cwd: process.cwd(),
  env: { ...process.env, FORGE_067G17A1_EVIDENCE_DIR: evidence },
  encoding: 'utf8'
});
assert.equal(result.status, 0, result.stderr || result.stdout);
const ledger = readFileSync(join(evidence, 'ledger.jsonl'), 'utf8');
assert.match(ledger, /"self_exit_0","status":"PASS","exitCode":0/);
assert.match(ledger, /"self_exit_7","status":"FAIL","exitCode":7/);
assert.match(ledger, /"self_missing_dependency","status":"BLOCKED","exitCode":2/);
assert.match(ledger, /"self_cleanup_failure","status":"CLEANUP_FAIL","exitCode":9/);
assert.match(ledger, /"self_project_ref_mismatch","status":"FAIL"/);
assert.match(ledger, /"self_remote_not_run","status":"SKIPPED","exitCode":3/);
assert.doesNotMatch(ledger, /"self_exit_7","status":"PASS"/);
assert.doesNotMatch(ledger, /"self_missing_dependency","status":"PASS"/);
assert.doesNotMatch(ledger, /"self_cleanup_failure","status":"PASS"/);
console.log('067G17A1 RUNNER INTEGRITY: PASS');
