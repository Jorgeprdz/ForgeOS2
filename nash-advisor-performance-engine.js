const {
  loadAllMemories,
  analyzeObjections,
  analyzeIntents,
  analyzeOutcomes
} = require("./nash-learning-engine");

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function countBy(items = [], selector) {
  return items.reduce((acc, item) => {
    const key = selector(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function collectActions(memories = []) {
  return memories.flatMap(memory => memory.actionHistory || []);
}

function collectConversations(memories = []) {
  return memories.flatMap(memory => memory.conversationHistory || []);
}

function collectObjections(memories = []) {
  return memories.flatMap(memory => memory.objectionHistory || []);
}

function calculateFollowupEffectiveness(actions = []) {
  const followupActions = actions.filter(action =>
    /FOLLOWUP/i.test(action.action || "")
  );

  const positiveOutcomes = followupActions.filter(action =>
    !/NO_RESPONSE|NO_REPLY|REJECTED|LOST/i.test(action.outcome || "") &&
    /RESPONSE|RESPONDED|MEETING|APPOINTMENT|SCHEDULED|INTEREST/i.test(action.outcome || "")
  );

  return {
    total: followupActions.length,
    positive: positiveOutcomes.length,
    rate: percent(positiveOutcomes.length, followupActions.length)
  };
}

function calculateMeetingSignals({ actions = [], objections = [] }) {
  const actionSignals = actions.filter(action =>
    /SCHEDULE|APPOINTMENT|MEETING|CITA/i.test(`${action.action || ""} ${action.outcome || ""}`)
  ).length;

  const intentSignals = objections.filter(objection =>
    objection.intent === "READY_TO_MEET"
  ).length;

  return actionSignals + intentSignals;
}

function calculateRelationshipOpportunities(actions = []) {
  return actions.filter(action =>
    /RELATIONSHIP|BIRTHDAY|RENEWAL|REFERRAL|REVIEW/i.test(`${action.action || ""} ${action.outcome || ""}`)
  ).length;
}

function buildPerformanceMetrics(memories = []) {
  const conversations = collectConversations(memories);
  const objections = collectObjections(memories);
  const actions = collectActions(memories);
  const objectionAnalysis = analyzeObjections(memories);
  const intentAnalysis = analyzeIntents(memories);
  const outcomeAnalysis = analyzeOutcomes(memories);

  const responses = conversations.filter(item => item.direction === "INBOUND").length;
  const outbound = conversations.filter(item => item.direction === "OUTBOUND").length;
  const noResponses = actions.filter(action => action.outcome === "NO_RESPONSE").length;
  const followupEffectiveness = calculateFollowupEffectiveness(actions);
  const meetingSignals = calculateMeetingSignals({ actions, objections });
  const relationshipOpportunities = calculateRelationshipOpportunities(actions);

  return {
    prospects: memories.length,
    conversations: conversations.length,
    outbound,
    responses,
    responseRate: percent(responses, outbound),
    noResponses,
    noResponseRate: percent(noResponses, actions.length || outbound),
    objections: objections.length,
    objectionRate: percent(objections.length, responses || conversations.length),
    dominantObjection: objectionAnalysis.dominant.value,
    dominantIntent: intentAnalysis.dominant.value,
    dominantOutcome: outcomeAnalysis.dominant.value,
    followupEffectiveness,
    meetingSignals,
    relationshipOpportunities,
    actions: actions.length,
    outcomeCounts: countBy(actions, action => action.outcome)
  };
}

function detectBiggestBottleneck(metrics = {}) {
  if (!metrics.conversations) {
    return "INSUFFICIENT_ACTIVITY";
  }

  if (metrics.noResponseRate >= 50 || metrics.dominantOutcome === "NO_RESPONSE") {
    return "NO_RESPONSE_LEAK";
  }

  if (metrics.dominantIntent === "TRUST_ISSUE") {
    return "TRUST_BARRIER";
  }

  if (metrics.dominantIntent === "VALUE_NOT_CLEAR") {
    return "VALUE_NOT_CLEAR";
  }

  if (metrics.followupEffectiveness.total > 0 && metrics.followupEffectiveness.rate < 35) {
    return "WEAK_FOLLOWUP_CONVERSION";
  }

  if (metrics.meetingSignals === 0 && metrics.responses > 0) {
    return "LOW_MEETING_CONVERSION";
  }

  if (metrics.relationshipOpportunities === 0 && metrics.prospects > 0) {
    return "MISSING_RELATIONSHIP_MOMENTS";
  }

  return "NO_MAJOR_BOTTLENECK_DETECTED";
}

function detectStrongestArea(metrics = {}) {
  if (metrics.meetingSignals > 0) {
    return "MEETING_CREATION";
  }

  if (metrics.responseRate >= 50) {
    return "RESPONSE_GENERATION";
  }

  if (metrics.relationshipOpportunities > 0) {
    return "RELATIONSHIP_TIMING";
  }

  if (metrics.objections > 0) {
    return "OBJECTION_CAPTURE";
  }

  if (metrics.conversations > 0) {
    return "ACTIVITY_FOUNDATION";
  }

  return "NO_STRENGTH_DETECTED_YET";
}

function scoreAdvisorPerformance(metrics = {}) {
  let score = 50;

  score += Math.min(metrics.conversations || 0, 20);
  score += Math.min(metrics.responseRate || 0, 25) * 0.5;
  score += Math.min(metrics.meetingSignals || 0, 5) * 5;
  score += Math.min(metrics.relationshipOpportunities || 0, 5) * 3;
  score += Math.min(metrics.followupEffectiveness.rate || 0, 30) * 0.3;
  score -= Math.min(metrics.noResponseRate || 0, 60) * 0.5;

  if (metrics.dominantIntent === "TRUST_ISSUE") score -= 8;
  if (metrics.dominantIntent === "VALUE_NOT_CLEAR") score -= 5;
  if (!metrics.conversations) score = 20;

  return clampScore(score);
}

function buildRecommendation({ bottleneck, metrics }) {
  const recommendations = {
    INSUFFICIENT_ACTIVITY:
      "Aumentar conversaciones registradas antes de optimizar conversion. Sin volumen no hay patron confiable.",
    NO_RESPONSE_LEAK:
      "Optimizar primer mensaje y followups: reducir longitud, abrir con contexto y cerrar con una pregunta simple.",
    TRUST_BARRIER:
      "Reforzar confianza antes de vender: explicar simple, usar pruebas y evitar promesas agresivas.",
    VALUE_NOT_CLEAR:
      "Mover la conversacion de precio a consecuencia: aclarar impacto, riesgo y valor antes de cotizar.",
    WEAK_FOLLOWUP_CONVERSION:
      "Revisar timing y contenido de followups; cada followup debe aportar una razon nueva para responder.",
    LOW_MEETING_CONVERSION:
      "Convertir respuestas en microcompromisos de 10-15 minutos en lugar de seguir explicando por mensaje.",
    MISSING_RELATIONSHIP_MOMENTS:
      "Registrar eventos de relacion y usarlos para abrir conversaciones no comerciales.",
    NO_MAJOR_BOTTLENECK_DETECTED:
      "Mantener disciplina y seguir acumulando datos para detectar patrones mas finos."
  };

  if (metrics.meetingSignals > 0 && metrics.noResponseRate < 30) {
    return "Escalar lo que ya funciona: hay senales de cita y baja fuga por no respuesta.";
  }

  return recommendations[bottleneck] || recommendations.NO_MAJOR_BOTTLENECK_DETECTED;
}

function buildAdvisorPerformanceReport({
  advisorId = "UNKNOWN",
  memories = null
} = {}) {
  const sourceMemories = Array.isArray(memories) ? memories : loadAllMemories();
  const metrics = buildPerformanceMetrics(sourceMemories);
  const biggestBottleneck = detectBiggestBottleneck(metrics);
  const strongestArea = detectStrongestArea(metrics);

  return {
    engine: "NASH_ADVISOR_PERFORMANCE_ENGINE",
    version: "0.6",
    advisorId,
    performanceScore: scoreAdvisorPerformance(metrics),
    biggestBottleneck,
    strongestArea,
    recommendation: buildRecommendation({
      bottleneck: biggestBottleneck,
      metrics
    }),
    metrics
  };
}

module.exports = {
  buildAdvisorPerformanceReport,
  buildPerformanceMetrics,
  detectBiggestBottleneck,
  detectStrongestArea,
  scoreAdvisorPerformance
};
