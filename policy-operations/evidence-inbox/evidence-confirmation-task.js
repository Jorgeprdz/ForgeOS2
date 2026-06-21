export const EVIDENCE_CONFIRMATION_ACTORS = Object.freeze({
  ADVISOR: 'advisor',
  AUTHORIZED_OPERATOR: 'authorized_operator',
  MANAGER_IF_SCOPE_ALLOWS: 'manager_if_scope_allows',
});

export const EVIDENCE_CONFIRMATION_TASK_TYPES = Object.freeze({
  CONFIRM_POLICY: 'confirm_policy',
  CONFIRM_PAYMENT: 'confirm_payment',
  CONFIRM_COMMISSION_STATEMENT: 'confirm_commission_statement',
  REJECT_CANDIDATE: 'reject_candidate',
  REQUEST_MORE_EVIDENCE: 'request_more_evidence',
});

export const EVIDENCE_CONFIRMATION_TASK_STATUSES = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
});

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

export function createEvidenceConfirmationTask({
  taskId = crypto.randomUUID(),
  inboxItemId,
  candidateId,
  requiredActor,
  taskType,
  status,
  confirmationResult = null,
  rejectionReason = null,
  createdAt = new Date().toISOString(),
  resolvedAt = null,
} = {}) {
  const errors = [];

  if (isBlank(requiredActor)) errors.push('missing_required_actor');
  if (isBlank(taskType)) errors.push('missing_task_type');
  if (isBlank(status)) errors.push('missing_status');

  if (errors.length > 0) {
    return {
      error: true,
      errors,
    };
  }

  return {
    taskId,
    inboxItemId,
    candidateId,
    requiredActor,
    taskType,
    status,
    confirmationResult,
    rejectionReason,
    createdAt,
    resolvedAt,
    calculatesCommission: false,
    createsPayoutTruth: false,
  };
}

export function taskCreatesPayoutTruth() {
  return false;
}

export function isPaymentConfirmationTask(task = {}) {
  return task.taskType === EVIDENCE_CONFIRMATION_TASK_TYPES.CONFIRM_PAYMENT;
}

export function isCommissionStatementConfirmationTask(task = {}) {
  return task.taskType === EVIDENCE_CONFIRMATION_TASK_TYPES.CONFIRM_COMMISSION_STATEMENT;
}

export function commissionStatementConfirmationRequiredForPayoutTruth() {
  return true;
}

export function canManagerConfirmEvidence({ actor = {}, inboxItem = {} } = {}) {
  const scopedAdvisorIds = actor.authorizedAdvisorIds || [];
  const managerScopeAllows = scopedAdvisorIds.includes(inboxItem.ownerAdvisorId);

  return actor.role === 'manager' && managerScopeAllows;
}
