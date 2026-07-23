#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ENGINE_VERSION = '2.1.0';
const STATES = Object.freeze([
  'declared',
  'ready',
  'implementation_started',
  'implementation_complete',
  'tests_pass',
  'validated',
  'delivered'
]);
const TRANSITIONS = Object.freeze({
  declared: ['ready'],
  ready: ['implementation_started'],
  implementation_started: ['implementation_complete'],
  implementation_complete: ['tests_pass'],
  tests_pass: ['validated'],
  validated: ['delivered'],
  delivered: []
});

const cliDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(cliDirectory, '..', '..');
const manifestPath = path.join(root, 'forge', 'modules.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function kv(key, value) {
  console.log(`${key}=${Array.isArray(value) ? value.join(',') : String(value)}`);
}

function moduleById(moduleId) {
  const record = manifest.modules.find(({ id }) => id === moduleId);
  if (!record) throw new Error(`UNKNOWN_MODULE:${moduleId}`);
  return record;
}

function statePath(moduleId) {
  return path.join(root, '.forge21', 'state', `${moduleId}.json`);
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function loadState(record) {
  const file = statePath(record.id);

  if (!fs.existsSync(file)) {
    const now = new Date().toISOString();
    const state = {
      schemaVersion: 1,
      engineVersion: ENGINE_VERSION,
      moduleId: record.id,
      state: 'declared',
      createdAt: now,
      updatedAt: now,
      history: [{ state: 'declared', at: now, reason: 'module initialized' }]
    };
    writeJsonAtomic(file, state);
    return state;
  }

  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (state.moduleId !== record.id) throw new Error('STATE_MODULE_MISMATCH');
  if (!STATES.includes(state.state)) throw new Error(`UNKNOWN_STATE:${state.state}`);
  return state;
}

function advance(record, target, reason = 'explicit transition') {
  if (!STATES.includes(target)) throw new Error(`UNKNOWN_STATE:${target}`);
  const current = loadState(record);
  if (current.state === target) return current;
  if (!TRANSITIONS[current.state]?.includes(target)) {
    throw new Error(`INVALID_TRANSITION:${current.state}:${target}`);
  }

  const now = new Date().toISOString();
  const next = {
    ...current,
    state: target,
    updatedAt: now,
    history: [...current.history, { state: target, at: now, reason }]
  };
  writeJsonAtomic(statePath(record.id), next);
  return next;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function validate(record) {
  const errors = [];
  const hashes = {};
  const requiredFiles = [
    ...(record.governanceInputs ?? []),
    record.entrypoint,
    ...(record.tests ?? [])
  ];

  for (const relative of requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      errors.push(`MISSING_FILE:${relative}`);
    } else {
      hashes[relative] = sha256(file);
    }
  }

  if (errors.length === 0) {
    const moduleUrl = `${pathToFileURL(path.join(root, record.entrypoint)).href}?v=${Date.now()}`;
    const imported = await import(moduleUrl);
    for (const name of record.requiredExports ?? []) {
      if (!(name in imported)) errors.push(`MISSING_EXPORT:${name}`);
    }
  }

  const result = {
    schemaVersion: 1,
    engineVersion: ENGINE_VERSION,
    moduleId: record.id,
    validatedAt: new Date().toISOString(),
    pass: errors.length === 0,
    errors,
    hashes
  };

  const receiptDirectory = path.join(root, '.forge21', 'receipts', record.id);
  fs.mkdirSync(receiptDirectory, { recursive: true });
  const timestamp = result.validatedAt.replaceAll(/[:.]/g, '-');
  writeJsonAtomic(path.join(receiptDirectory, `${timestamp}.json`), result);
  writeJsonAtomic(path.join(receiptDirectory, 'latest.json'), result);
  return result;
}

function runTests(record) {
  const result = spawnSync(process.execPath, ['--test', ...record.tests], {
    cwd: root,
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`TESTS_FAILED:${result.status}`);
}

async function commandDoctor() {
  kv('FORGE_ROOT', root);
  kv('ENGINE_VERSION', ENGINE_VERSION);
  kv('NODE_VERSION', process.version);
  kv('MODULE_COUNT', manifest.modules.length);
  kv('CHECK_MANIFEST', fs.existsSync(manifestPath) ? 'PASS' : 'FAIL');
  kv('CHECK_GOVERNANCE', fs.existsSync(path.join(root, 'governance')) ? 'PASS' : 'FAIL');
  kv('FORGE_DOCTOR', 'PASS');
}

function commandStatus(moduleId) {
  const records = moduleId ? [moduleById(moduleId)] : manifest.modules;
  for (const record of records) {
    const state = loadState(record);
    kv('MODULE_ID', record.id);
    kv('STATE', state.state);
    kv('UPDATED_AT', state.updatedAt);
    kv('NEXT_STATES', TRANSITIONS[state.state]);
  }
}

function commandPlan(moduleId) {
  const record = moduleById(moduleId);
  const state = loadState(record);
  kv('MODULE_ID', record.id);
  kv('CURRENT_STATE', state.state);
  kv('DEPENDENCIES', record.dependencies ?? []);
  kv('GOVERNANCE_INPUTS', record.governanceInputs ?? []);
  kv('ENTRYPOINT', record.entrypoint);
  kv('TESTS', record.tests ?? []);
  kv('NEXT_STATES', TRANSITIONS[state.state]);
}

async function commandValidate(moduleId) {
  const records = moduleId ? [moduleById(moduleId)] : manifest.modules;
  let failed = false;

  for (const record of records) {
    const result = await validate(record);
    kv('MODULE_ID', record.id);
    kv('VALIDATION', result.pass ? 'PASS' : 'FAIL');
    kv('VALIDATION_ERRORS', result.errors);
    if (!result.pass) failed = true;
  }

  if (failed) process.exitCode = 1;
}

async function commandRun(moduleId) {
  const record = moduleById(moduleId);
  let state = loadState(record);

  if (state.state === 'declared') {
    state = advance(record, 'ready', 'manifest and governance discovered');
  }
  if (state.state === 'ready') {
    state = advance(record, 'implementation_started', 'implementation requested');
  }
  if (state.state === 'implementation_started') {
    kv('MODULE_ID', record.id);
    kv('RUN_STATE', state.state);
    kv('ACTION_REQUIRED', 'IMPLEMENT_MODULE');
    return;
  }
  if (state.state === 'implementation_complete') {
    runTests(record);
    state = advance(record, 'tests_pass', 'module tests passed');
  }
  if (state.state === 'tests_pass') {
    const result = await validate(record);
    if (!result.pass) {
      kv('VALIDATION', 'FAIL');
      kv('VALIDATION_ERRORS', result.errors);
      process.exitCode = 1;
      return;
    }
    state = advance(record, 'validated', 'validation receipt passed');
  }

  kv('MODULE_ID', record.id);
  kv('RUN_STATE', state.state);
  kv('ACTION_REQUIRED', state.state === 'validated' ? 'REVIEW_FOR_DELIVERY' : 'NONE');
}

function usage() {
  console.log(`Forge OS ${ENGINE_VERSION}\n\nCommands:\n  doctor\n  status [MODULE_ID]\n  plan MODULE_ID\n  run MODULE_ID\n  advance MODULE_ID TARGET_STATE\n  validate [MODULE_ID]`);
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2);

  switch (command) {
    case 'doctor':
      await commandDoctor();
      break;
    case 'status':
      commandStatus(args[0]);
      break;
    case 'plan':
      if (!args[0]) throw new Error('MODULE_ID_REQUIRED');
      commandPlan(args[0]);
      break;
    case 'run':
      if (!args[0]) throw new Error('MODULE_ID_REQUIRED');
      await commandRun(args[0]);
      break;
    case 'advance': {
      if (!args[0] || !args[1]) throw new Error('MODULE_ID_AND_TARGET_REQUIRED');
      const state = advance(moduleById(args[0]), args[1], 'forge advance');
      kv('MODULE_ID', args[0]);
      kv('STATE', state.state);
      break;
    }
    case 'validate':
      await commandValidate(args[0]);
      break;
    case 'help':
    case '--help':
    case '-h':
      usage();
      break;
    default:
      throw new Error(`UNKNOWN_COMMAND:${command}`);
  }
}

main().catch((error) => {
  console.error(`FORGE_ERROR=${error.message}`);
  process.exitCode = 1;
});
