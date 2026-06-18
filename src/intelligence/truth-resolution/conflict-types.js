/**
 * Forge Truth Conflict Taxonomy v1.0
 */
const CONFLICT_TYPES = {
  NO_CONFLICT: 'NO_CONFLICT',
  CONTRADICTORY_CLAIM: 'CONTRADICTORY_CLAIM', // Explicitly different value for same fact
  UPDATED_CLAIM: 'UPDATED_CLAIM',             // New version of mutable state
  OVERLAPPING_CLAIM: 'OVERLAPPING_CLAIM',     // Temporal or resource collision
  STALE_CLAIM: 'STALE_CLAIM',                 // Evidence is older than current ledger
  MISSING_EVIDENCE: 'MISSING_EVIDENCE',       // Insufficient grounding for fact
  EQUAL_CONFIDENCE: 'EQUAL_CONFIDENCE'        // Deadlock between competing claims
};

module.exports = {
  CONFLICT_TYPES
};
