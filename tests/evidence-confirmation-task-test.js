import assert from 'node:assert/strict';

import {
  EVIDENCE_CONFIRMATION_ACTORS,
  EVIDENCE_CONFIRMATION_TASK_STATUSES,
  EVIDENCE_CONFIRMATION_TASK_TYPES,
  commissionStatementConfirmationRequiredForPayoutTruth,
  createEvidenceConfirmationTask,
  isCommissionStatementConfirmationTask,
  isPaymentConfirmationTask,
  taskCreatesPayoutTruth,
} from '../policy-operations/evidence-inbox/evidence-confirmation-task.js';

const invalid = createEvidenceConfirmationTask({
  inboxItemId: 'inbox-1',
  candidateId: 'candidate-1',
});

assert.equal(invalid.error, true);
assert.ok(invalid.errors.includes('missing_required_actor'));
assert.ok(invalid.errors.includes('missing_task_type'));
assert.ok(invalid.errors.includes('missing_status'));

const paymentTask = createEvidenceConfirmationTask({
  taskId: 'task-payment',
  inboxItemId: 'inbox-1',
  candidateId: 'candidate-payment',
  requiredActor: EVIDENCE_CONFIRMATION_ACTORS.ADVISOR,
  taskType: EVIDENCE_CONFIRMATION_TASK_TYPES.CONFIRM_PAYMENT,
  status: EVIDENCE_CONFIRMATION_TASK_STATUSES.CONFIRMED,
});

const statementTask = createEvidenceConfirmationTask({
  taskId: 'task-statement',
  inboxItemId: 'inbox-2',
  candidateId: 'candidate-statement',
  requiredActor: EVIDENCE_CONFIRMATION_ACTORS.ADVISOR,
  taskType: EVIDENCE_CONFIRMATION_TASK_TYPES.CONFIRM_COMMISSION_STATEMENT,
  status: EVIDENCE_CONFIRMATION_TASK_STATUSES.CONFIRMED,
});

assert.equal(paymentTask.createsPayoutTruth, false);
assert.equal(taskCreatesPayoutTruth(paymentTask), false);
assert.equal(isPaymentConfirmationTask(paymentTask), true);
assert.equal(isCommissionStatementConfirmationTask(paymentTask), false);
assert.equal(isCommissionStatementConfirmationTask(statementTask), true);
assert.notEqual(paymentTask.taskType, statementTask.taskType);
assert.equal(commissionStatementConfirmationRequiredForPayoutTruth(), true);

console.log('PASS evidence-confirmation-task-test');
