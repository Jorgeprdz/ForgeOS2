/**
 * Forge Ledger Entry Contract v1.0
 * 
 * Represents a single atomic unit of truth in the Forge Ledger.
 */
class LedgerEntry {
  constructor(data = {}) {
    this.truth_id = data.truth_id || null;
    this.claim_id = data.claim_id || null;
    this.claim_type = data.claim_type || null;
    this.status = data.status || 'ACTIVE';
    this.accepted_at = data.accepted_at || new Date().toISOString();
    this.superseded_at = data.superseded_at || null;
    this.provenance = data.provenance || {}; // Link to Semantic Frame and Adjudication Event
  }

  toJSON() {
    return {
      truth_id: this.truth_id,
      claim_id: this.claim_id,
      claim_type: this.claim_type,
      status: this.status,
      accepted_at: this.accepted_at,
      superseded_at: this.superseded_at,
      provenance: this.provenance
    };
  }
}

module.exports = LedgerEntry;
