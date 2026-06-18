const { resolveTruth } = require('./truth-resolution-engine');
const { TRUTH_STATUS } = require('./truth-status');
const { CONFLICT_TYPES } = require('./conflict-types');
const TruthResolutionResult = require('./truth-resolution-result');

module.exports = {
  resolveTruth,
  Truth_Status: TRUTH_STATUS,
  Conflict_Types: CONFLICT_TYPES,
  TruthResolutionResult
};
