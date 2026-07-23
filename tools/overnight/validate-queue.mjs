#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const QUEUE_SCHEMA_VERSION = 2;
export const JOB_STATUSES = Object.freeze([
  'READY',
  'DISABLED'
]);

const commandKeys = new Set(['command', 'timeout_seconds', 'allowed_exit_codes']);
const repairKeys = new Set([
  'command', 'when_exit_codes', 'attempt_limit', 'timeout_seconds',
  'allowed_changed_paths', 'verify'
]);

function fail(code, detail = '') {
  throw new Error(detail ? `${code}:${detail}` : code);
}

function nonEmptyString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') fail(code);
}

function positiveInteger(value, code, allowZero = false) {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) fail(code);
}

export function safeRepoPath(value) {
  if (typeof value !== 'string' || value.trim() !== value || value === '') return false;
  if (value.includes('\0') || value.includes('\\')) return false;
  if (path.posix.isAbsolute(value) || /^[A-Za-z]:/.test(value)) return false;
  const pieces = value.split('/');
  if (pieces.some(piece => piece === '' || piece === '.' || piece === '..')) return false;
  if (pieces[0] === '.git' || pieces[0] === '.forge') return false;
  return !value.startsWith('-');
}

function validatePaths(values, code, { allowEmpty = false } = {}) {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0)) fail(code);
  for (const value of values) if (!safeRepoPath(value)) fail(code, String(value));
}

function normalizeCommand(value, defaultTimeout, code) {
  if (typeof value === 'string') {
    nonEmptyString(value, code);
    return { command: value, timeout_seconds: defaultTimeout, allowed_exit_codes: [0] };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  for (const key of Object.keys(value)) if (!commandKeys.has(key)) fail(`${code}_UNKNOWN_FIELD`, key);
  nonEmptyString(value.command, code);
  const timeout = value.timeout_seconds ?? defaultTimeout;
  positiveInteger(timeout, `${code}_TIMEOUT`);
  const exits = value.allowed_exit_codes ?? [0];
  if (!Array.isArray(exits) || exits.length === 0 ||
      exits.some(exit => !Number.isInteger(exit) || exit < 0 || exit > 255)) fail(`${code}_EXIT_CODES`);
  return { command: value.command, timeout_seconds: timeout, allowed_exit_codes: [...new Set(exits)] };
}

function normalizeRepair(value, job, index) {
  const code = `JOB_REPAIR_${job.id}_${index}`;
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  for (const key of Object.keys(value)) if (!repairKeys.has(key)) fail(`${code}_UNKNOWN_FIELD`, key);
  nonEmptyString(value.command, `${code}_COMMAND`);
  if (!Array.isArray(value.when_exit_codes) || value.when_exit_codes.length === 0 ||
      value.when_exit_codes.some(exit => !Number.isInteger(exit) || exit < 1 || exit > 255)) {
    fail(`${code}_WHEN_EXIT_CODES`);
  }
  positiveInteger(value.attempt_limit, `${code}_ATTEMPT_LIMIT`);
  positiveInteger(value.timeout_seconds, `${code}_TIMEOUT`);
  validatePaths(value.allowed_changed_paths, `${code}_PATHS`);
  if (!Array.isArray(value.verify) || value.verify.length === 0) fail(`${code}_VERIFY`);
  return {
    ...value,
    when_exit_codes: [...new Set(value.when_exit_codes)],
    verify: value.verify.map((item, verifyIndex) =>
      normalizeCommand(item, value.timeout_seconds, `${code}_VERIFY_${verifyIndex}`))
  };
}

export function validateQueueObject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('QUEUE_OBJECT_REQUIRED');
  if (input.schema_version !== QUEUE_SCHEMA_VERSION) fail('QUEUE_SCHEMA_VERSION');
  if (!Array.isArray(input.valid_job_statuses) ||
      JSON.stringify(input.valid_job_statuses) !== JSON.stringify(JOB_STATUSES)) fail('QUEUE_VALID_STATUSES');
  positiveInteger(input.default_timeout_seconds, 'QUEUE_DEFAULT_TIMEOUT');
  if (!Array.isArray(input.global_gates) || input.global_gates.length === 0) fail('QUEUE_GLOBAL_GATES');
  const globalGates = input.global_gates.map((gate, index) =>
    normalizeCommand(gate, input.default_timeout_seconds, `GLOBAL_GATE_${index}`));
  if (!Array.isArray(input.jobs) || input.jobs.length === 0) fail('QUEUE_JOBS_REQUIRED');

  const ids = new Set();
  const jobs = input.jobs.map((job, index) => {
    if (!job || typeof job !== 'object' || Array.isArray(job)) fail('JOB_OBJECT', String(index));
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(job.id ?? '')) fail('JOB_ID', String(index));
    if (ids.has(job.id)) fail('JOB_DUPLICATE_ID', job.id);
    ids.add(job.id);
    nonEmptyString(job.title, `JOB_TITLE_${job.id}`);
    if (!JOB_STATUSES.includes(job.status)) fail('JOB_STATUS', job.id);
    if (!Array.isArray(job.depends_on) || job.depends_on.some(dep => typeof dep !== 'string')) {
      fail('JOB_DEPENDS_ON', job.id);
    }
    if (new Set(job.depends_on).size !== job.depends_on.length) fail('JOB_DUPLICATE_DEPENDENCY', job.id);
    if (!Array.isArray(job.commands) || job.commands.length === 0) fail('JOB_COMMANDS', job.id);
    if (!Array.isArray(job.verify) || job.verify.length === 0) fail('JOB_VERIFY', job.id);
    positiveInteger(job.retry_limit, `JOB_RETRY_LIMIT_${job.id}`, true);
    positiveInteger(job.timeout_seconds, `JOB_TIMEOUT_${job.id}`);
    nonEmptyString(job.commit_message, `JOB_COMMIT_MESSAGE_${job.id}`);
    if (typeof job.push !== 'boolean') fail('JOB_PUSH', job.id);
    validatePaths(job.allowed_changed_paths, `JOB_ALLOWED_PATHS_${job.id}`, { allowEmpty: true });
    validatePaths(job.forbidden_changed_paths, `JOB_FORBIDDEN_PATHS_${job.id}`, { allowEmpty: true });
    if (!Array.isArray(job.repairs)) fail('JOB_REPAIRS', job.id);
    return {
      ...job,
      commands: job.commands.map((item, commandIndex) =>
        normalizeCommand(item, job.timeout_seconds, `JOB_COMMAND_${job.id}_${commandIndex}`)),
      verify: job.verify.map((item, verifyIndex) =>
        normalizeCommand(item, job.timeout_seconds, `JOB_VERIFY_${job.id}_${verifyIndex}`)),
      repairs: job.repairs.map((item, repairIndex) => normalizeRepair(item, job, repairIndex))
    };
  });

  const positions = new Map(jobs.map((job, index) => [job.id, index]));
  for (const [index, job] of jobs.entries()) {
    for (const dependency of job.depends_on) {
      if (!positions.has(dependency)) fail('JOB_DEPENDENCY_MISSING', `${job.id}:${dependency}`);
      if (positions.get(dependency) >= index) fail('JOB_DEPENDENCY_NOT_PRIOR', `${job.id}:${dependency}`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = id => {
    if (visiting.has(id)) fail('JOB_DEPENDENCY_CYCLE', id);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of jobs[positions.get(id)].depends_on) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const job of jobs) visit(job.id);
  return { ...input, global_gates: globalGates, jobs };
}

export function loadAndValidateQueue(file) {
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail('QUEUE_READ_OR_PARSE', error.message); }
  return validateQueueObject(parsed);
}

function cli() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node tools/overnight/validate-queue.mjs <queue.json>');
    process.exit(64);
  }
  try {
    const queue = loadAndValidateQueue(file);
    console.log(`QUEUE_VALIDATE=PASS\nQUEUE_SCHEMA_VERSION=${queue.schema_version}\nQUEUE_JOBS=${queue.jobs.length}`);
  } catch (error) {
    console.error(`QUEUE_VALIDATE=FAIL\nQUEUE_ERROR=${error.message}`);
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) cli();
