import assert from 'node:assert/strict';

import { EVIDENCE_PROCESSING_STATUSES } from '../policy-operations/evidence-inbox/evidence-processing-status.js';
import {
  EVIDENCE_VISIBILITY_SCOPES,
  createEvidenceInboxItem,
} from '../policy-operations/evidence-inbox/evidence-inbox-item.js';
import {
  EVIDENCE_INBOX_SCOPE_ACTIONS,
  evaluateEvidenceInboxScope,
} from '../policy-operations/evidence-inbox/evidence-inbox-scope-gate.js';

const privateItem = createEvidenceInboxItem({
  id: 'inbox-private',
  source: { ownerAdvisorId: 'advisor-1', organizationId: 'org-1' },
  visibilityScope: EVIDENCE_VISIBILITY_SCOPES.ADVISOR_PRIVATE,
});

const outOfScopeManager = evaluateEvidenceInboxScope({
  actor: {
    role: 'manager',
    authorizedAdvisorIds: ['advisor-2'],
  },
  inboxItem: privateItem,
  action: EVIDENCE_INBOX_SCOPE_ACTIONS.CONFIRM,
});

assert.equal(outOfScopeManager.allowed, false);
assert.equal(outOfScopeManager.visibleItem, null);
assert.equal(outOfScopeManager.status, EVIDENCE_PROCESSING_STATUSES.HIDDEN_BY_SCOPE);
assert.equal(outOfScopeManager.hiddenByScopeIsZero, false);
assert.equal(outOfScopeManager.hiddenByScopeIsRejected, false);
assert.equal(outOfScopeManager.hiddenByScopeIsUnknown, false);

const scopedManagerItem = createEvidenceInboxItem({
  id: 'inbox-manager',
  source: { ownerAdvisorId: 'advisor-1', organizationId: 'org-1' },
  visibilityScope: EVIDENCE_VISIBILITY_SCOPES.MANAGER_IF_SCOPE_ALLOWS,
});

const inScopeManager = evaluateEvidenceInboxScope({
  actor: {
    role: 'manager',
    authorizedAdvisorIds: ['advisor-1'],
  },
  inboxItem: scopedManagerItem,
  action: EVIDENCE_INBOX_SCOPE_ACTIONS.VIEW,
});

assert.equal(inScopeManager.allowed, true);
assert.equal(inScopeManager.visibleItem.id, 'inbox-manager');

console.log('PASS evidence-inbox-scope-gate-test');
