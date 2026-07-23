import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PROMOTION_GATE_ID = 'MOD-GOVERNANCE-GATE-PROMOTION-GATE';
export const ROBOCOP_LOCK_ID = 'ROBOCOP_LOCK_001';

export const PROMOTION_GATE_SCHEMA_URL = new URL(
  '../../scaffolds/contracts/promotion-gate.schema.json',
  import.meta.url
);

export const PROMOTION_GATE_SCHEMA_PATH = fileURLToPath(
  PROMOTION_GATE_SCHEMA_URL
);

const PROMOTION_GATE_SCHEMA = Object.freeze(
  JSON.parse(fs.readFileSync(PROMOTION_GATE_SCHEMA_URL, 'utf8'))
);

function blocked(input, violations) {
  return {
    gate_id: PROMOTION_GATE_ID,
    stage:
      input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      typeof input.stage === 'string'
        ? input.stage
        : null,
    branch:
      input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      typeof input.branch === 'string'
        ? input.branch
        : null,
    decision: 'BLOCKED',
    reason: ROBOCOP_LOCK_ID,
    violations
  };
}

function validateSchemaValue(field, value, definition) {
  const violations = [];

  if (definition.type === 'string') {
    if (typeof value !== 'string') {
      violations.push(`INVALID_TYPE:${field}:string`);
      return violations;
    }

    if (
      Number.isInteger(definition.minLength) &&
      value.length < definition.minLength
    ) {
      violations.push(`STRING_TOO_SHORT:${field}`);
    }

    if (
      typeof definition.pattern === 'string' &&
      !new RegExp(definition.pattern).test(value)
    ) {
      violations.push(`PATTERN_MISMATCH:${field}`);
    }
  }

  if (definition.type === 'boolean' && typeof value !== 'boolean') {
    violations.push(`INVALID_TYPE:${field}:boolean`);
  }

  return violations;
}

export function validatePromotionGateContract(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['INVALID_GATE_PAYLOAD'];
  }

  const violations = [];
  const properties = PROMOTION_GATE_SCHEMA.properties ?? {};
  const required = PROMOTION_GATE_SCHEMA.required ?? [];

  for (const field of required) {
    if (!Object.hasOwn(input, field)) {
      violations.push(`MISSING_FIELD:${field}`);
    }
  }

  if (PROMOTION_GATE_SCHEMA.additionalProperties === false) {
    for (const field of Object.keys(input).sort()) {
      if (!Object.hasOwn(properties, field)) {
        violations.push(`UNKNOWN_FIELD:${field}`);
      }
    }
  }

  for (const [field, definition] of Object.entries(properties)) {
    if (!Object.hasOwn(input, field)) {
      continue;
    }

    violations.push(
      ...validateSchemaValue(field, input[field], definition)
    );
  }

  return violations;
}

export function evaluatePromotionGate(input) {
  const violations = validatePromotionGateContract(input);

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return blocked(input, violations);
  }

  if (
    typeof input.branch === 'string' &&
    input.branch.trim().length === 0
  ) {
    violations.push('INVALID_BRANCH');
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
    return blocked(input, violations);
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

function fileViolation(error) {
  if (error?.code === 'ENOENT') {
    return 'GATE_FILE_NOT_FOUND';
  }

  if (error instanceof SyntaxError) {
    return 'INVALID_GATE_JSON';
  }

  return `RUNTIME_ERROR:${error?.message ?? 'UNKNOWN_ERROR'}`;
}

export function evaluatePromotionGateFile(filePath) {
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return evaluatePromotionGate(payload);
  } catch (error) {
    return blocked(null, [fileViolation(error)]);
  }
}

function runCli() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error(
      'Usage: node governance/runtime/promotion-gate.mjs <gate.json>'
    );
    process.exitCode = 64;
    return;
  }

  const result = evaluatePromotionGateFile(filePath);
  console.log(JSON.stringify(result, null, 2));

  if (result.decision !== 'PASS') {
    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runCli();
}
