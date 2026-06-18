/**
 * Forge Truth Statuses v1.0
 */
const TRUTH_STATUS = {
  PROPOSED: 'PROPOSED',           // Awaiting adjudication
  PENDING_REVIEW: 'PENDING_REVIEW', // Conflict detected, awaiting human
  ACCEPTED: 'ACCEPTED',           // Authoritative active state
  REJECTED: 'REJECTED',           // Fails truth resolution
  SUPERSEDED: 'SUPERSEDED',       // Replaced by newer accepted truth
  EXPIRED: 'EXPIRED',             // Past its temporal validity
  INVALIDATED: 'INVALIDATED'      // Found to be incorrect after the fact
};

module.exports = {
  TRUTH_STATUS
};
