/**
 * ============================================================
 * PROCESS ADVANCEMENT ENGINE
 * ADR-0019 — Process Advancement Intelligence
 * ============================================================
 */

const {
  resolveProcessMove,
  hasMalformedCore
} = require("./process-advancement-rules");

function processAdvancementEngine(input = {}) {
  if (hasMalformedCore(input)) {
    return {
      move: "human_review",
      confidence: "low",
      reason: "malformed_process_core",
      timestamp: new Date().toISOString()
    };
  }

  const move = resolveProcessMove(input);

  return {
    move,
    confidence: "high",
    reason: "rule_resolution",
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  processAdvancementEngine
};
