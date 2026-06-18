/**
 * Forge Truth Archive Contract v1.0
 * 
 * Represents the immutable historical record of all truth transitions.
 */
class TruthArchive {
  constructor() {
    this.entries = []; // Array of LedgerEntry objects
  }

  /**
   * Records an entry into the immutable historical archive.
   * Rules: Cannot be modified once added.
   * 
   * @param {Object} entry - LedgerEntry object
   */
  record(entry) {
    // In a real implementation, this would be append-only persistence.
    this.entries.push(Object.freeze(entry));
  }

  getHistory(truth_id) {
    return this.entries.filter(e => e.truth_id === truth_id);
  }
}

module.exports = TruthArchive;
