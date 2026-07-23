import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TEST_COMMANDS = [
  ...fs.readdirSync('platform/core/tests')
    .filter(file => file.endsWith('.js'))
    .sort()
    .map(file => ['node', [path.join('platform/core/tests', file)]]),
  ['node', ['governance/tests/source-ownership-registry-validation-test.js']],
  ['node', ['governance/tests/promotion-gate-test.mjs']],
  ['node', [
    '--input-type=module',
    '-e',
    "import('./platform/adapters/quote-read-model/quote-read-model-adapter-069c.js').then(m=>{m.listQuotes(); console.log('QUOTE_ADAPTER_IMPORT=PASS')})"
  ]]
];

for (const [command, args] of TEST_COMMANDS) {
  const label = [command, ...args].join(' ');
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    console.error(`Test command failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log('Forge repository tests passed.');
