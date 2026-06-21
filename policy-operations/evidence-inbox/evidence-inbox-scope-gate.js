import { EVIDENCE_PROCESSING_STATUSES } from './evidence-processing-status.js';
import { EVIDENCE_VISIBILITY_SCOPES } from './evidence-inbox-item.js';

export const EVIDENCE_INBOX_SCOPE_ACTIONS = Object.freeze({
  VIEW: 'view',
  CONFIRM: 'confirm',
  ROUTE: 'route',
  ARCHIVE: 'archive',
});

function canAdvisorAccess(actor = {}, inboxItem = {}) {
  return actor.role === 'advisor' && actor.advisorId === inboxItem.ownerAdvisorId;
}

function canOperatorAccess(actor = {}, inboxItem = {}) {
  const authorizedAdvisorIds = actor.authorizedAdvisorIds || [];
  return actor.role === 'authorized_operator' && authorizedAdvisorIds.includes(inboxItem.ownerAdvisorId);
}

function canManagerAccess(actor = {}, inboxItem = {}) {
  const authorizedAdvisorIds = actor.authorizedAdvisorIds || [];

  return actor.role === 'manager'
    && inboxItem.visibilityScope === EVIDENCE_VISIBILITY_SCOPES.MANAGER_IF_SCOPE_ALLOWS
    && authorizedAdvisorIds.includes(inboxItem.ownerAdvisorId);
}

export function evaluateEvidenceInboxScope({ actor = {}, inboxItem = {}, action } = {}) {
  const allowed = canAdvisorAccess(actor, inboxItem)
    || canOperatorAccess(actor, inboxItem)
    || canManagerAccess(actor, inboxItem);

  if (!allowed) {
    return {
      allowed: false,
      reason: 'hidden_by_scope',
      visibleItem: null,
      status: EVIDENCE_PROCESSING_STATUSES.HIDDEN_BY_SCOPE,
      hiddenByScopeIsZero: false,
      hiddenByScopeIsRejected: false,
      hiddenByScopeIsUnknown: false,
      action,
    };
  }

  return {
    allowed: true,
    reason: 'scope_authorized',
    visibleItem: inboxItem,
    status: inboxItem.status,
    action,
  };
}
