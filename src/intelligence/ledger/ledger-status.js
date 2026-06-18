/**
 * Forge Ledger Statuses v1.0
 */
const LEDGER_STATUS = {
  ACTIVE: 'ACTIVE',         // The current authoritative truth
  SUPERSEDED: 'SUPERSEDED', // Replaced by a newer truth
  EXPIRED: 'EXPIRED',       // Past its temporal validity
  INVALIDATED: 'INVALIDATED', // Found to be incorrect after the fact
  ARCHIVED: 'ARCHIVED'      // Moved to long-term historical storage
};

module.exports = {
  LEDGER_STATUS
};
