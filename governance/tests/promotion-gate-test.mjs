import assert from 'node:assert/strict';
import {
  evaluatePromotionGate,
  PROMOTION_GATE_ID,
  ROBOCOP_LOCK_ID
} from '../runtime/promotion-gate.mjs';

const validPayload = {
  stage: 'SG-001',
  branch: 'feat/forge-build-orchestrator',
  main_allowed: false,
  validations_passed: true,
  evidence_present: true,
  authorized_paths_only: true
};

{
  const result = evaluatePromotionGate(validPayload);

  assert.equal(result.gate_id, PROMOTION_GATE_ID);
  assert.equal(result.decision, 'PASS');
  assert.equal(result.reason, null);
  assert.deepEqual(result.violations, []);

  console.log('PASS valid promotion payload');
}

{
  const result = evaluatePromotionGate({
    ...validPayload,
    evidence_present: false
  });

  assert.equal(result.decision, 'BLOCKED');
  assert.equal(result.reason, ROBOCOP_LOCK_ID);
  assert.match(result.violations.join(','), /EVIDENCE_MISSING/);

  console.log('PASS missing evidence blocked');
}

{
  const result = evaluatePromotionGate({
    ...validPayload,
    authorized_paths_only: false
  });

  assert.equal(result.decision, 'BLOCKED');
  assert.equal(result.reason, ROBOCOP_LOCK_ID);
  assert.match(result.violations.join(','), /UNAUTHORIZED_PATHS_PRESENT/);

  console.log('PASS unauthorized paths blocked');
}

{
  const result = evaluatePromotionGate({
    ...validPayload,
    branch: 'main',
    main_allowed: false
  });

  assert.equal(result.decision, 'BLOCKED');
  assert.equal(result.reason, ROBOCOP_LOCK_ID);
  assert.match(result.violations.join(','), /MAIN_BRANCH_NOT_AUTHORIZED/);

  console.log('PASS unauthorized main promotion blocked');
}

{
  const result = evaluatePromotionGate({
    branch: 'feat/test'
  });

  assert.equal(result.decision, 'BLOCKED');
  assert.equal(result.reason, ROBOCOP_LOCK_ID);
  assert.match(result.violations.join(','), /MISSING_FIELD:stage/);

  console.log('PASS missing required fields blocked');
}

console.log('promotion-gate-test: PASS');
