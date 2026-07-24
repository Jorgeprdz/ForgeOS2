import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..', '..');
const wrapper = path.join(root, 'tools', 'forge-autopilot');
const autopilot = path.join(root, 'forge', 'autopilot', 'autopilot.mjs');
const policyPath = path.join(root, 'forge', 'autopilot', 'policy.json');
const actionsPath = path.join(root, 'forge', 'autopilot', 'module-actions.json');

function run(...args) {
  return spawnSync('bash', [wrapper, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env
  });
}

function combined(result) {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

test('prints binary completion criteria', () => {
  const result = run('criteria');
  assert.equal(result.status, 0, combined(result));
  assert.match(result.stdout, /AREA 3 — Runtime/);
  assert.match(result.stdout, /consumerBoundary/);
  assert.match(result.stdout, /manualSteps=\[\]/);
});

test('audits structural and functional progress separately', () => {
  const result = run('audit');
  assert.equal(result.status, 0, combined(result));
  assert.match(result.stdout, /GLOBAL_STRUCTURAL=/);
  assert.match(result.stdout, /GLOBAL_FUNCTIONAL_REAL=/);
  assert.match(result.stdout, /FALSE_GREEN_COUNT=/);
  assert.match(
    result.stdout,
    /NEXT_TYPE=(MODULE|DECLARE_MODULE|NONE)/
  );
  assert.match(result.stdout, /NEXT_REASON=/);
  assert.equal(
    fs.existsSync(path.join(root, '.forge21', 'autopilot', 'reports', 'latest.json')),
    true
  );
});

test('recommendation emits a coherent governed next action', () => {
  const result = run('recommend');
  assert.equal(result.status, 0, combined(result));

  const type =
    result.stdout.match(
      /NEXT_TYPE=(MODULE|DECLARE_MODULE|NONE)/
    )?.[1];

  assert.ok(type);

  if (type === 'MODULE') {
    assert.doesNotMatch(
      result.stdout,
      /NEXT_MODULE=NONE/
    );
    assert.match(
      result.stdout,
      /NEXT_AREA=(runtime|integrations|productE2E)/
    );
  } else if (type === 'DECLARE_MODULE') {
    assert.match(
      result.stdout,
      /NEXT_MODULE=NONE/
    );
    assert.match(
      result.stdout,
      /NEXT_AREA=(runtime|integrations|productE2E)/
    );
  } else {
    assert.match(
      result.stdout,
      /NEXT_MODULE=NONE/
    );
    assert.match(
      result.stdout,
      /NEXT_AREA=NONE/
    );
  }
});

test('unknown commands fail closed with a stable error code', () => {
  const result = run('definitely-not-a-command');
  assert.notEqual(result.status, 0);
  assert.match(combined(result), /AUTOPILOT_ERROR_CODE=UNKNOWN_COMMAND/);
});

test('policy weights are complete and sum to one', () => {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const expectedAreas = [
    'architecture',
    'scaffolds',
    'runtime',
    'integrations',
    'productE2E'
  ];
  assert.deepEqual(Object.keys(policy.weights).sort(), expectedAreas.sort());
  const total = Object.values(policy.weights).reduce((sum, value) => sum + value, 0);
  assert.equal(total, 1);
  assert.deepEqual(policy.priorityOrder.slice(0, 3), [
    'runtime',
    'integrations',
    'productE2E'
  ]);
});

test('Carrier Scope has an explicit governed implementation action', () => {
  const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
  const action = actions.modules['MOD-CARRIER-SCOPE'];

  assert.ok(action);
  assert.equal(
    action.implementationCommand,
    'bash forge/autopilot/actions/materialize-carrier-scope-runtime.sh'
  );
  assert.equal(
    action.functionalTestCommand,
    'node --test modules/carrier-scope/carrier-applicability-consumer.test.mjs'
  );
  assert.deepEqual(action.consumerTestPaths, [
    'modules/carrier-scope/carrier-applicability-consumer.test.mjs'
  ]);
  assert.ok(
    action.changedPaths.includes(
      '.forge21/functional-evidence/MOD-CARRIER-SCOPE'
    )
  );
});

test('GMM Quote Preparation E2E declares a complete governed user journey', () => {
  const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
  const action = actions.modules['MOD-GMM-QUOTE-PREPARATION-E2E'];

  assert.ok(action);
  assert.equal(
    action.implementationCommand,
    'bash forge/autopilot/actions/materialize-gmm-quote-preparation-e2e.sh'
  );
  assert.equal(
    action.functionalTestCommand,
    'node --test modules/gmm-quote-preparation-e2e/index.test.mjs'
  );
  assert.equal(
    action.evidence.environment.entrypoint,
    'tools/forge-gmm-quote-flow'
  );
  assert.equal(
    action.evidence.scenario.actions.length >= 3,
    true
  );
  assert.deepEqual(
    action.evidence.scenario.manualSteps,
    []
  );
  assert.deepEqual(
    Object.entries(action.evidence.checks)
      .filter(([, value]) => value !== true),
    []
  );
  assert.ok(
    action.evidence.artifactPaths.includes(
      'tools/forge-gmm-quote-flow'
    )
  );
});

test('GMM Quote Evidence Adapter declares faithful external evidence', () => {
  const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
  const action = actions.modules['MOD-GMM-QUOTE-EVIDENCE-ADAPTER'];

  assert.ok(action);
  assert.equal(
    action.implementationCommand,
    'bash forge/autopilot/actions/materialize-gmm-quote-evidence-adapter.sh'
  );
  assert.equal(
    action.functionalTestCommand,
    'node --test modules/gmm-quote-evidence-adapter/index.test.mjs'
  );
  assert.equal(
    action.evidence.environment.kind,
    'faithful-contract-fixture'
  );
  assert.equal(
    action.evidence.environment.contractArtifact,
    'modules/gmm-quote-evidence-adapter/fixtures/gmm-quote-contract-v1.json'
  );
  assert.deepEqual(
    Object.entries(action.evidence.checks)
      .filter(([, value]) => value !== true),
    []
  );
  assert.ok(
    action.evidence.artifactPaths.includes(
      'modules/gmm-quote-evidence-adapter/fixtures/gmm-quote-contract-v1.json'
    )
  );
});

test('Product Intelligence has an explicit governed implementation action', () => {
  const actions = JSON.parse(fs.readFileSync(actionsPath, 'utf8'));
  const action = actions.modules['MOD-PRODUCT-INTELLIGENCE'];
  assert.ok(action);
  assert.equal(
    action.implementationCommand,
    'bash forge/autopilot/actions/materialize-product-intelligence-runtime.sh'
  );
  assert.equal(
    action.functionalTestCommand,
    'node --test modules/product-intelligence/quote-preparation-consumer.test.mjs'
  );
  assert.deepEqual(action.consumerTestPaths, [
    'modules/product-intelligence/quote-preparation-consumer.test.mjs'
  ]);
  assert.ok(
    action.changedPaths.includes(
      '.forge21/functional-evidence/MOD-PRODUCT-INTELLIGENCE'
    )
  );
});

test('git and command subprocesses are insulated from Android FUSE cwd', () => {
  const source = fs.readFileSync(autopilot, 'utf8');
  assert.match(source, /cwd:\s*os\.homedir\(\)/);
  assert.match(source, /\['-C', root, \.\.\.args\]/);
});
