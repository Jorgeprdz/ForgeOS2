/**
 * Forge Truth Resolution Result Contract
 * 
 * Represents the outcome of a Truth Adjudication Event.
 */
class TruthResolutionResult {
  constructor(data = {}) {
    this.accepted = !!data.accepted;
    this.status = data.status || 'REJECTED';
    this.conflict_type = data.conflict_type || 'NO_CONFLICT';
    this.active_truth = data.active_truth || null;
    this.superseded_truth = data.superseded_truth || null;
    this.reason = data.reason || '';
    this.requires_human_review = data.requires_human_review !== undefined ? data.requires_human_review : false;
  }

  toJSON() {
    return {
      accepted: this.accepted,
      status: this.status,
      conflict_type: this.conflict_type,
      active_truth: this.active_truth,
      superseded_truth: this.superseded_truth,
      reason: this.reason,
      requires_human_review: this.requires_human_review
    };
  }
}

module.exports = TruthResolutionResult;
