import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  evaluatePromotionGate,
  evaluatePromotionGateFile,
  PROMOTION_GATE_ID,
  PROMOTION_GATE_SCHEMA_PATH,
  ROBOCOP_LOCK_ID,
  validatePromotionGateContract
} from '../runtime/promotion-gate.mjs';

const validPayload = {
  stage: 'SG-001',
  branch: 'feat/forge-build-orchestrator',
  main_allowed: false,
  validations_passed: true,
  evidence_present: true,
  authorized_paths_only: true
};

function assertBlocked(result, violation) {
  assert.equal(result.gate_id, PROMOTION_GATE_ID);
  assert.equal(result.decision, 'BLOCKED');
  assert.equal(result.reason, ROBOCOP_LOCK_ID);
  assert.ok(
    result.violations.includes(violation),
    `Expected violation ${violation}; received ${result.violations.join(', ')}`
  );
}

function runCase(name, test) {
  test();
  console.log(`PASS ${name}`);
}

runCase('promotion gate schema is readable', () => {
  const schema = JSON.parse(
    fs.readFileSync(PROMOTION_GATE_SCHEMA_PATH, 'utf8')
  );

  assert.equal(schema.type, 'object');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(
    schema.required,
    Object.keys(validPayload)
  );
});

runCase('valid promotion payload', () => {
  const result = evaluatePromotionGate(validPayload);

  assert.equal(result.gate_id, PROMOTION_GATE_ID);
  assert.equal(result.decision, 'PASS');
  assert.equal(result.reason, null);
  assert.deepEqual(result.violations, []);
});

runCase('invalid root payload blocked', () => {
  assertBlocked(
    evaluatePromotionGate(null),
    'INVALID_GATE_PAYLOAD'
  );

  assertBlocked(
    evaluatePromotionGate([]),
    'INVALID_GATE_PAYLOAD'
  );
});

runCase('missing required fields blocked', () => {
  const result = evaluatePromotionGate({
    branch: 'feat/test'
  });

  assertBlocked(result, 'MISSING_FIELD:stage');
  assertBlocked(result, 'MISSING_FIELD:main_allowed');
  assertBlocked(result, 'MISSING_FIELD:validations_passed');
  assertBlocked(result, 'MISSING_FIELD:evidence_present');
  assertBlocked(result, 'MISSING_FIELD:authorized_paths_only');
});

runCase('invalid stage blocked from schema pattern', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      stage: 'SG-1'
    }),
    'PATTERN_MISMATCH:stage'
  );
});

runCase('blank branch blocked', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      branch: '   '
    }),
    'INVALID_BRANCH'
  );
});

runCase('invalid boolean blocked from schema type', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      validations_passed: 'yes'
    }),
    'INVALID_TYPE:validations_passed:boolean'
  );
});

runCase('unknown field blocked', () => {
  const violations = validatePromotionGateContract({
    ...validPayload,
    silent_ratification: true
  });

  assert.ok(
    violations.includes('UNKNOWN_FIELD:silent_ratification')
  );
});

runCase('missing evidence blocked', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      evidence_present: false
    }),
    'EVIDENCE_MISSING'
  );
});

runCase('failed validations blocked', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      validations_passed: false
    }),
    'VALIDATIONS_NOT_PASSED'
  );
});

runCase('unauthorized paths blocked', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      authorized_paths_only: false
    }),
    'UNAUTHORIZED_PATHS_PRESENT'
  );
});

runCase('unauthorized main promotion blocked', () => {
  assertBlocked(
    evaluatePromotionGate({
      ...validPayload,
      branch: 'main',
      main_allowed: false
    }),
    'MAIN_BRANCH_NOT_AUTHORIZED'
  );
});

const temporaryDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'forge-promotion-gate-')
);

try {
  runCase('valid gate file passes', () => {
    const validFile = path.join(temporaryDirectory, 'valid.json');

    fs.writeFileSync(
      validFile,
      `${JSON.stringify(validPayload, null, 2)}\n`
    );

    assert.equal(
      evaluatePromotionGateFile(validFile).decision,
      'PASS'
    );
  });

  runCase('missing gate file fails closed', () => {
    assertBlocked(
      evaluatePromotionGateFile(
        path.join(temporaryDirectory, 'missing.json')
      ),
      'GATE_FILE_NOT_FOUND'
    );
  });

  runCase('invalid JSON fails closed', () => {
    const invalidFile = path.join(temporaryDirectory, 'invalid.json');
    fs.writeFileSync(invalidFile, '{invalid-json');

    assertBlocked(
      evaluatePromotionGateFile(invalidFile),
      'INVALID_GATE_JSON'
    );
  });

  runCase('CLI returns zero for PASS', () => {
    const validFile = path.join(temporaryDirectory, 'cli-valid.json');

    fs.writeFileSync(
      validFile,
      `${JSON.stringify(validPayload)}\n`
    );

    const result = spawnSync(
      process.execPath,
      ['governance/runtime/promotion-gate.mjs', validFile],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"decision": "PASS"/);
  });

  runCase('CLI returns two for BLOCKED', () => {
    const blockedFile = path.join(
      temporaryDirectory,
      'cli-blocked.json'
    );

    fs.writeFileSync(
      blockedFile,
      `${JSON.stringify({
        ...validPayload,
        evidence_present: false
      })}\n`
    );

    const result = spawnSync(
      process.execPath,
      ['governance/runtime/promotion-gate.mjs', blockedFile],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

    assert.equal(result.status, 2);
    assert.match(result.stdout, /"decision": "BLOCKED"/);
  });

  runCase('CLI without file returns usage error', () => {
    const result = spawnSync(
      process.execPath,
      ['governance/runtime/promotion-gate.mjs'],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

    assert.equal(result.status, 64);
    assert.match(result.stderr, /Usage:/);
  });
} finally {
  fs.rmSync(temporaryDirectory, {
    recursive: true,
    force: true
  });
}

console.log('promotion-gate-test: PASS');
