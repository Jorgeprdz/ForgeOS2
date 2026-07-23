import fs from 'node:fs';

export const PROMOTION_GATE_ID = 'MOD-GOVERNANCE-GATE-PROMOTION-GATE';
export const ROBOCOP_LOCK_ID = 'ROBOCOP_LOCK_001';

const REQUIRED_FIELDS = [
  'stage',
  'branch',
  'main_allowed',
  'validations_passed',
  'evidence_present',
  'authorized_paths_only'
];

function isBoolean(value) {
  return typeof value === 'boolean';
}

export function evaluatePromotionGate(input) {
  const violations = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      gate_id: PROMOTION_GATE_ID,
      decision: 'BLOCKED',
      reason: ROBOCOP_LOCK_ID,
      violations: ['INVALID_GATE_PAYLOAD']
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in input)) {
      violations.push(`MISSING_FIELD:${field}`);
    }
  }

  if (
    'stage' in input &&
    (typeof input.stage !== 'string' || !/^SG-[0-9]{3}$/.test(input.stage))
  ) {
    violations.push('INVALID_STAGE');
  }

  if (
    'branch' in input &&
    (typeof input.branch !== 'string' || input.branch.trim() === '')
  ) {
    violations.push('INVALID_BRANCH');
  }

  for (const field of [
    'main_allowed',
    'validations_passed',
    'evidence_present',
    'authorized_paths_only'
  ]) {
    if (field in input && !isBoolean(input[field])) {
      violations.push(`INVALID_BOOLEAN:${field}`);
    }
  }

  if (input.branch === 'main' && input.main_allowed !== true) {
    violations.push('MAIN_BRANCH_NOT_AUTHORIZED');
  }

  if (input.validations_passed === false) {
    violations.push('VALIDATIONS_NOT_PASSED');
  }

  if (input.evidence_present === false) {
    violations.push('EVIDENCE_MISSING');
  }

  if (input.authorized_paths_only === false) {
    violations.push('UNAUTHORIZED_PATHS_PRESENT');
  }

  if (violations.length > 0) {
    return {
      gate_id: PROMOTION_GATE_ID,
      stage: input.stage ?? null,
      branch: input.branch ?? null,
      decision: 'BLOCKED',
      reason: ROBOCOP_LOCK_ID,
      violations
    };
  }

  return {
    gate_id: PROMOTION_GATE_ID,
    stage: input.stage,
    branch: input.branch,
    decision: 'PASS',
    reason: null,
    violations: []
  };
}

export function evaluatePromotionGateFile(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return evaluatePromotionGate(payload);
}

function runCli() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node governance/runtime/promotion-gate.mjs <gate.json>');
    process.exit(64);
  }

  try {
    const result = evaluatePromotionGateFile(filePath);
    console.log(JSON.stringify(result, null, 2));

    if (result.decision !== 'PASS') {
      process.exit(2);
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          gate_id: PROMOTION_GATE_ID,
          decision: 'BLOCKED',
          reason: ROBOCOP_LOCK_ID,
          violations: [`RUNTIME_ERROR:${error.message}`]
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  runCli();
}
