const { buildProspectContext } = require("./nash-prospect-context-builder");
const { detectPersonality } = require("./nash-personality-engine");
const { detectNashIntent } = require("./nash-intent-engine");
const { loadMemory } = require("./nash-memory-engine");
const { buildLearningReport } = require("./nash-learning-engine");
const { buildCombatIntelligenceReport } = require("./nash-combat-intelligence-report-engine");
const { buildAdvisorPerformanceReport } = require("./nash-advisor-performance-engine");
const { buildCoachingInsight } = require("./nash-coaching-insight-engine");
const { buildManagerAlert } = require("./nash-manager-alert-engine");
const { buildTeamIntelligenceReport } = require("./nash-team-intelligence-engine");

function buildProspectInput({ prospectId, memory }) {
  return {
    source: "nash-master",
    channel: "whatsapp",
    prospect: {
      name: prospectId || memory?.prospectId || "Prospecto"
    },
    notes: [
      ...(memory?.knownMotivators || []),
      ...(memory?.conversationHistory || []).map(item => item.message).filter(Boolean)
    ]
  };
}

function calculateConfidence({ intent, personality, advisorPerformance }) {
  const intentConfidence = Number(intent?.confidence || 0);
  const personalityConfidence = Number(personality?.confidence || 0);
  const performanceScore = Number(advisorPerformance?.performanceScore || 0);

  const available = [intentConfidence, personalityConfidence, performanceScore]
    .filter(value => value > 0);

  if (!available.length) return 0;

  return Math.round(
    available.reduce((sum, value) => sum + value, 0) / available.length
  );
}

function buildAdvisorInsight({ learningReport, advisorPerformance }) {
  return {
    learningInsight: learningReport.learningInsight,
    recommendation: learningReport.recommendation,
    performanceScore: advisorPerformance.performanceScore,
    biggestBottleneck: advisorPerformance.biggestBottleneck,
    strongestArea: advisorPerformance.strongestArea
  };
}

function runNashMasterIntelligence(input = {}) {
  const advisorId = input.advisorId || "UNKNOWN";
  const prospectId = input.prospectId || "UNKNOWN_PROSPECT";
  const incomingMessage = input.incomingMessage || "";
  const memory = loadMemory(prospectId);
  const context = buildProspectContext(
    buildProspectInput({
      prospectId,
      memory
    })
  );
  const personality = detectPersonality({
    ...context,
    notes: context.notes || []
  });
  const intent = detectNashIntent({
    text: incomingMessage,
    context,
    personality
  });
  const combatIntelligence = buildCombatIntelligenceReport({
    objection: incomingMessage,
    context,
    personality
  });
  const learningReport = buildLearningReport({
    advisorId
  });
  const advisorPerformance = buildAdvisorPerformanceReport({
    advisorId
  });
  const coachingInsight = buildCoachingInsight(advisorPerformance);
  const managerInsight = buildManagerAlert({
    advisorPerformance,
    coachingInsight
  });
  const teamInsight = buildTeamIntelligenceReport([
    advisorPerformance
  ]);

  return {
    engine: "NASH_MASTER_INTELLIGENCE_ENGINE",
    version: "1.0",
    advisor: {
      advisorId,
      performanceScore: advisorPerformance.performanceScore,
      biggestBottleneck: advisorPerformance.biggestBottleneck
    },
    prospect: {
      prospectId,
      context,
      memoryPatterns: {
        conversations: memory.conversationHistory?.length || 0,
        objections: memory.objectionHistory?.length || 0,
        lastOutcome: memory.lastOutcome || null
      }
    },
    personality,
    intent,
    objection: {
      type: combatIntelligence.classification.type,
      text: incomingMessage,
      response: combatIntelligence.objectionKillerMessage
    },
    psychology: combatIntelligence.psychology,
    recommendedResponse: combatIntelligence.objectionKillerMessage,
    nextBestAction: combatIntelligence.nextBestAction,
    advisorInsight: buildAdvisorInsight({
      learningReport,
      advisorPerformance
    }),
    coachingInsight,
    managerInsight,
    teamInsight,
    confidence: calculateConfidence({
      intent,
      personality,
      advisorPerformance
    })
  };
}

module.exports = {
  runNashMasterIntelligence,
  calculateConfidence
};
