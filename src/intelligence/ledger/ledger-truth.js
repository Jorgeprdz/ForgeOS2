const { LEDGER_STATUS } = require('./ledger-status');
const LedgerEntry = require('./ledger-entry');
const TruthArchive = require('./truth-archive');

/**
 * Forge Ledger Truth Service v1.0
 * 
 * Manages the Active Truth (Operational Reality) and preserves 
 * Historical Truth (The Archive).
 */
class LedgerTruthService {
  constructor() {
    this.activeLedger = {}; // Active truth indexed by claim_type or specific ID
    this.archive = new TruthArchive();
  }

  /**
   * Promotes an adjudicated claim to Active Truth.
   * 
   * @param {Object} claim - The accepted Candidate Claim
   * @param {Object} adjudicationResult - Results from Truth Resolution
   */
  addTruth(claim, adjudicationResult) {
    const entry = new LedgerEntry({
      truth_id: `truth_${Date.now()}`,
      claim_id: claim.id,
      claim_type: claim.type,
      status: LEDGER_STATUS.ACTIVE,
      provenance: {
        adjudication_id: adjudicationResult.id,
        semantic_frame_id: claim.provenance.frame_id
      }
    });

    // In a real implementation, we might retire existing truth of same type
    this.activeLedger[claim.type] = entry;
    this.archive.record(entry);
    
    return entry;
  }

  /**
   * Moves an active truth to SUPERSEDED or EXPIRED.
   */
  retireTruth(truth_id, newStatus = LEDGER_STATUS.SUPERSEDED) {
    // Skeleton implementation
    return true;
  }

  /**
   * Long-term archival logic.
   */
  archiveTruth(truth_id) {
    // Skeleton implementation
    return true;
  }

  /**
   * Returns the current Operational Reality.
   */
  getActiveTruth() {
    return this.activeLedger;
  }
}

module.exports = {
  LedgerTruthService
};
