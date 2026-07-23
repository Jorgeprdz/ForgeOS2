#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

TARGET_BRANCH="$(git branch --show-current)"
SOURCE_REF="${FORGE_SOURCE_REF:-origin/main}"
SOURCE_COMMIT="$(git rev-parse "$SOURCE_REF")"
PRESERVE_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$PRESERVE_DIR"
}
trap cleanup EXIT

fail() {
  printf 'FORGE_2_1_ERROR=%s\n' "$1" >&2
  return 1
}

[[ "$TARGET_BRANCH" == "rewrite/forge-2.1" ]] || fail "WRONG_BRANCH:$TARGET_BRANCH"
git cat-file -e "${SOURCE_COMMIT}^{commit}"

printf 'FORGE_2_1_SOURCE_REF=%s\n' "$SOURCE_REF"
printf 'FORGE_2_1_SOURCE_COMMIT=%s\n' "$SOURCE_COMMIT"
printf 'FORGE_2_1_TARGET_BRANCH=%s\n' "$TARGET_BRANCH"

preserve_candidates=(
  "AGENTS.md"
  "adr"
  "governance"
  "docs/architecture"
  "docs/contracts"
  "docs/decisions"
  "docs/migration/constitutional-history"
  "docs/migration/governance-history"
)

preserve_paths=()
for path in "${preserve_candidates[@]}"; do
  if git cat-file -e "$SOURCE_COMMIT:$path" 2>/dev/null; then
    preserve_paths+=("$path")
    printf 'PRESERVE=%s\n' "$path"
  else
    printf 'PRESERVE_SKIPPED_MISSING=%s\n' "$path"
  fi
done

(( ${#preserve_paths[@]} > 0 )) || fail "NO_GOVERNANCE_PATHS_FOUND"

mkdir -p "$PRESERVE_DIR/tree"
git archive --format=tar "$SOURCE_COMMIT" -- "${preserve_paths[@]}" \
  | tar -xf - -C "$PRESERVE_DIR/tree"

find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf -- {} +
cp -a "$PRESERVE_DIR/tree"/. .

mkdir -p \
  forge/cli \
  forge/tests \
  modules/carrier-scope \
  tools \
  .forge21/state \
  .forge21/receipts \
  docs/architecture

cat > .gitignore <<'EOF'
node_modules/
.forge21/logs/
.forge21/tmp/
*.log
.DS_Store
EOF

cat > README.md <<'EOF'
# Forge OS 2.1

Forge OS 2.1 is a clean, deterministic rewrite of the Forge runtime.

The repository keeps the ratified governance, ADR, constitutional, architectural,
contract, and owner-decision record. The previous runtime, rewrite machinery,
generated scaffolds, reports, adapters, and application implementation are removed
from this branch.

## Commands

```bash
bash tools/forge doctor
bash tools/forge status
bash tools/forge plan MOD-CARRIER-SCOPE
bash tools/forge run MOD-CARRIER-SCOPE
bash tools/forge advance MOD-CARRIER-SCOPE implementation_complete
bash tools/forge validate MOD-CARRIER-SCOPE
npm test
```

## Runtime rules

- One canonical manifest: `forge/modules.json`
- One state file per module: `.forge21/state/<MODULE>.json`
- Sequential state transitions only
- Timestamped validation receipts under `.forge21/receipts/`
- No hidden `FORGE_ROOT` prerequisite
- Governance is never mutated by runtime commands
EOF

cat > package.json <<'EOF'
{
  "name": "forge-os-2.1",
  "version": "2.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "forge": "node forge/cli/forge.mjs",
    "test": "node --test forge/tests/*.test.mjs modules/**/*.test.mjs",
    "validate": "node forge/cli/forge.mjs validate",
    "check": "npm test && node forge/cli/forge.mjs doctor && node forge/cli/forge.mjs validate"
  },
  "engines": {
    "node": ">=20"
  }
}
EOF

cat > docs/architecture/CARRIER_SCOPE_NAMING_CONVENTION.md <<'EOF'
# Carrier Scope Naming Convention

Status: Ratified for Forge OS 2.1 runtime implementation.

A carrier scope is a deterministic tuple composed of:

1. `carrier`
2. `market`
3. optional `productLine`

Every token uses lowercase kebab-case and must match:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

Canonical serialization uses colon separators:

```text
carrier:market
carrier:market:product-line
```

Examples:

```text
smnyl:mexico
smnyl:mexico:vida-individual
```

The runtime may normalize letter case and surrounding whitespace, but it must reject
spaces, underscores, empty tokens, leading digits, and ambiguous serialization.
EOF

cat > governance/FORGE_2_1_PRESERVATION_RECORD.md <<EOF
# Forge OS 2.1 Governance Preservation Record

- Source ref: \`$SOURCE_REF\`
- Source commit: \`$SOURCE_COMMIT\`
- Target branch: \`$TARGET_BRANCH\`
- Preserved roots:
$(printf -- '- `%s`\n' "${preserve_paths[@]}")

The Forge OS 2.1 bootstrap preserved these roots byte-for-byte from the source commit
before replacing the previous runtime. The carrier-scope naming convention was then
added as the first Forge OS 2.1 implementation decision.
EOF

cat > forge/modules.json <<'EOF'
{
  "schemaVersion": 1,
  "engineVersion": "2.1.0",
  "modules": [
    {
      "id": "MOD-CARRIER-SCOPE",
      "title": "Carrier Scope",
      "description": "Canonical carrier-scope contract and implementation.",
      "dependencies": [],
      "governanceInputs": [
        "docs/architecture/CARRIER_SCOPE_NAMING_CONVENTION.md"
      ],
      "entrypoint": "modules/carrier-scope/index.mjs",
      "tests": [
        "modules/carrier-scope/index.test.mjs"
      ],
      "requiredExports": [
        "CarrierScopeError",
        "assertCarrierScope",
        "createCarrierScope",
        "isCarrierScope"
      ]
    }
  ]
}
EOF

cat > modules/carrier-scope/index.mjs <<'EOF'
const TOKEN_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export class CarrierScopeError extends TypeError {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CarrierScopeError';
    this.code = 'INVALID_CARRIER_SCOPE';
    this.details = Object.freeze({ ...details });
  }
}

function normalizeToken(value, field) {
  if (typeof value !== 'string') {
    throw new CarrierScopeError(`${field} must be a string`, {
      field,
      receivedType: typeof value
    });
  }

  const normalized = value.trim().toLowerCase();

  if (!TOKEN_PATTERN.test(normalized)) {
    throw new CarrierScopeError(`${field} must use lowercase kebab-case`, {
      field,
      value
    });
  }

  return normalized;
}

export function createCarrierScope(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CarrierScopeError('carrier scope input must be an object');
  }

  const carrier = normalizeToken(input.carrier, 'carrier');
  const market = normalizeToken(input.market, 'market');
  const productLine = input.productLine == null
    ? null
    : normalizeToken(input.productLine, 'productLine');

  return Object.freeze({
    kind: 'carrier-scope',
    version: 1,
    carrier,
    market,
    productLine,
    canonical: productLine
      ? `${carrier}:${market}:${productLine}`
      : `${carrier}:${market}`
  });
}

export function assertCarrierScope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CarrierScopeError('carrier scope must be an object');
  }

  const expected = createCarrierScope(value);

  for (const key of ['kind', 'version', 'carrier', 'market', 'productLine', 'canonical']) {
    if (value[key] !== expected[key]) {
      throw new CarrierScopeError(`carrier scope ${key} mismatch`, {
        key,
        expected: expected[key],
        received: value[key]
      });
    }
  }

  return value;
}

export function isCarrierScope(value) {
  try {
    assertCarrierScope(value);
    return true;
  } catch {
    return false;
  }
}
EOF

cat > modules/carrier-scope/index.test.mjs <<'EOF'
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CarrierScopeError,
  assertCarrierScope,
  createCarrierScope,
  isCarrierScope
} from './index.mjs';

test('creates canonical scope', () => {
  const scope = createCarrierScope({
    carrier: 'SMNYL',
    market: 'Mexico',
    productLine: 'Vida-Individual'
  });

  assert.deepEqual(scope, {
    kind: 'carrier-scope',
    version: 1,
    carrier: 'smnyl',
    market: 'mexico',
    productLine: 'vida-individual',
    canonical: 'smnyl:mexico:vida-individual'
  });
  assert.equal(Object.isFrozen(scope), true);
});

test('supports no product line', () => {
  const scope = createCarrierScope({ carrier: 'smnyl', market: 'mexico' });
  assert.equal(scope.productLine, null);
  assert.equal(scope.canonical, 'smnyl:mexico');
});

test('rejects invalid tokens', () => {
  assert.throws(
    () => createCarrierScope({ carrier: 'SM NYL', market: 'mexico' }),
    CarrierScopeError
  );
});

test('asserts valid scope', () => {
  const scope = createCarrierScope({ carrier: 'smnyl', market: 'mexico' });
  assert.equal(assertCarrierScope(scope), scope);
  assert.equal(isCarrierScope(scope), true);
  assert.equal(isCarrierScope({}), false);
});
EOF

cat > forge/tests/state-graph.test.mjs <<'EOF'
import assert from 'node:assert/strict';
import test from 'node:test';

const states = [
  'declared',
  'ready',
  'implementation_started',
  'implementation_complete',
  'tests_pass',
  'validated',
  'delivered'
];

const transitions = {
  declared: ['ready'],
  ready: ['implementation_started'],
  implementation_started: ['implementation_complete'],
  implementation_complete: ['tests_pass'],
  tests_pass: ['validated'],
  validated: ['delivered'],
  delivered: []
};

test('state graph is sequential', () => {
  states.forEach((state, index) => {
    const expected = index === states.length - 1 ? [] : [states[index + 1]];
    assert.deepEqual(transitions[state], expected);
  });
});

test('states are unique', () => {
  assert.equal(new Set(states).size, states.length);
});
EOF

cat > forge/cli/forge.mjs <<'EOF'
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
EOF

cat > tools/forge <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)"

exec node "$ROOT/forge/cli/forge.mjs" "$@"
EOF
chmod 755 tools/forge 2>/dev/null || true

npm test
bash tools/forge doctor
bash tools/forge status MOD-CARRIER-SCOPE
bash tools/forge plan MOD-CARRIER-SCOPE
bash tools/forge validate MOD-CARRIER-SCOPE
bash tools/forge run MOD-CARRIER-SCOPE
bash tools/forge advance MOD-CARRIER-SCOPE implementation_complete
bash tools/forge run MOD-CARRIER-SCOPE

FINAL_STATE="$(node -e "const s=require('./.forge21/state/MOD-CARRIER-SCOPE.json');process.stdout.write(s.state)")"
[[ "$FINAL_STATE" == "validated" ]] || fail "UNEXPECTED_FINAL_STATE:$FINAL_STATE"

git diff --check
git add -A
git diff --cached --check

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git commit -m "feat(forge): rebuild Forge OS 2.1"
git push origin "$TARGET_BRANCH"

printf 'FORGE_2_1_RESULT=PASS\n'
printf 'FORGE_2_1_FINAL_STATE=%s\n' "$FINAL_STATE"
printf 'FORGE_2_1_COMMIT=%s\n' "$(git rev-parse HEAD)"
