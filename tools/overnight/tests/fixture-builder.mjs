#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [directory, scenario = 'success'] = process.argv.slice(2);
if (!directory) throw new Error('fixture directory required');

const command = scenario === 'fail-command' ? 'exit 17'
  : scenario === 'timeout' ? 'sleep 5'
  : scenario === 'stdin' ? 'value=$(head -n 1); test -z "$value"; printf "stdin\\n" >> execution.log'
  : scenario === 'change' ? 'printf "changed\\n" >> allowed.txt'
  : scenario === 'outside' ? 'printf "outside\\n" > outside.txt'
  : scenario === 'forbidden' ? 'printf "forbidden\\n" > forbidden.txt'
  : scenario === 'repair' ? 'test -f repaired.flag'
  : 'true';
const verification = scenario === 'fail-verify' ? 'exit 19' : 'true';
const timeout = scenario === 'timeout' ? 1 : 30;
const allowed = ['allowed.txt', 'execution.log', 'gate.log', 'repaired.flag'];
if (scenario === 'forbidden') allowed.push('forbidden.txt');

const repairs = scenario === 'repair' ? [{
  command: 'touch repaired.flag',
  when_exit_codes: [1],
  attempt_limit: 1,
  timeout_seconds: 10,
  allowed_changed_paths: ['repaired.flag'],
  verify: ['test -f repaired.flag']
}] : scenario === 'repair-fail' ? [{
  command: 'exit 8',
  when_exit_codes: [7],
  attempt_limit: 1,
  timeout_seconds: 10,
  allowed_changed_paths: ['repaired.flag'],
  verify: ['test -f repaired.flag']
}] : [];

const commands = scenario === 'multi' ? [
  'printf "one\\n" >> execution.log',
  'printf "two\\n" >> execution.log',
  'printf "three\\n" >> execution.log'
] : scenario === 'repair-fail' ? ['exit 7'] : [
  command,
  ...(scenario === 'stdin' ? [
    'printf "after-one\\n" >> execution.log',
    'printf "after-two\\n" >> execution.log'
  ] : [])
];
const verify = scenario === 'multi-verify' ? [
  'printf "verify-one\\n" >> execution.log',
  'printf "verify-two\\n" >> execution.log',
  'printf "verify-three\\n" >> execution.log'
] : [verification];

const queue = {
  schema_version: 2,
  description: `test fixture ${scenario}`,
  valid_job_statuses: ['READY', 'DISABLED'],
  default_timeout_seconds: 30,
  global_gates: [
    { command: 'npm test', timeout_seconds: 30 },
    { command: 'npm run lint', timeout_seconds: 30 },
    { command: 'npm run scaffold:validate', timeout_seconds: 30 }
  ],
  jobs: [{
    id: 'job-one', title: 'Fixture job', status: 'READY', depends_on: [],
    commands, verify, repairs, retry_limit: repairs.length ? 1 : 0,
    timeout_seconds: timeout, commit_message: 'test: fixture change', push: false,
    allowed_changed_paths: allowed, forbidden_changed_paths: ['forbidden.txt']
  }]
};
fs.writeFileSync(path.join(directory, 'queue.json'), `${JSON.stringify(queue, null, 2)}\n`);
