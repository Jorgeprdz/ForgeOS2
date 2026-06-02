function normalizeAdvisor(report = {}) {
  return {
    advisorId: report.advisorId || "UNKNOWN",
    performanceScore: Number(report.performanceScore || 0),
    biggestBottleneck: report.biggestBottleneck || "UNKNOWN",
    strongestArea: report.strongestArea || "UNKNOWN",
    recommendation: report.recommendation || "",
    metrics: report.metrics || {}
  };
}

function average(values = []) {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  return Math.round(total / values.length);
}

function countOccurrences(items = []) {
  return items.reduce((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function getDominant(counts = {}) {
  const entries = Object.entries(counts);

  if (!entries.length) {
    return {
      value: null,
      count: 0
    };
  }

  const [value, count] = entries.sort((a, b) => b[1] - a[1])[0];

  return {
    value,
    count
  };
}

function pickStrongestAdvisor(advisors = []) {
  if (!advisors.length) return null;
  return advisors.slice().sort((a, b) => b.performanceScore - a.performanceScore)[0];
}

function pickWeakestAdvisor(advisors = []) {
  if (!advisors.length) return null;
  return advisors.slice().sort((a, b) => a.performanceScore - b.performanceScore)[0];
}

function isCriticalBottleneck(bottleneck) {
  return [
    "NO_RESPONSE_LEAK",
    "TRUST_BARRIER",
    "VALUE_NOT_CLEAR",
    "WEAK_FOLLOWUP_CONVERSION",
    "LOW_MEETING_CONVERSION",
    "INSUFFICIENT_ACTIVITY"
  ].includes(bottleneck);
}

function getAdvisorsNeedingCoaching(advisors = []) {
  return advisors.filter(advisor =>
    advisor.performanceScore < 60 ||
    isCriticalBottleneck(advisor.biggestBottleneck)
  );
}

function getAdvisorsPerformingWell(advisors = []) {
  return advisors.filter(advisor =>
    advisor.performanceScore >= 75 &&
    !isCriticalBottleneck(advisor.biggestBottleneck)
  );
}

function determineTeamHealth({ averageScore, advisorsAnalyzed, advisorsNeedingCoaching }) {
  if (!advisorsAnalyzed) return "RED";

  const coachingRate = advisorsNeedingCoaching / advisorsAnalyzed;

  if (averageScore >= 75 && coachingRate <= 0.25) return "GREEN";
  if (averageScore >= 60 && coachingRate <= 0.5) return "YELLOW";
  if (averageScore >= 45 && coachingRate <= 0.75) return "ORANGE";

  return "RED";
}

function buildCoachingOpportunities({ advisors = [], dominantBottleneck, dominantIntent }) {
  const opportunities = [];

  if (dominantBottleneck) {
    opportunities.push({
      type: "BOTTLENECK",
      focus: dominantBottleneck,
      advisorCount: advisors.filter(advisor => advisor.biggestBottleneck === dominantBottleneck).length
    });
  }

  if (dominantIntent) {
    opportunities.push({
      type: "INTENT",
      focus: dominantIntent,
      advisorCount: advisors.filter(advisor => advisor.metrics?.dominantIntent === dominantIntent).length
    });
  }

  const lowMeeting = advisors.filter(advisor =>
    Number(advisor.metrics?.responses || 0) > 0 &&
    Number(advisor.metrics?.meetingSignals || 0) === 0
  );

  if (lowMeeting.length > 0) {
    opportunities.push({
      type: "SKILL",
      focus: "CTA_MICROCOMMITMENT",
      advisorCount: lowMeeting.length
    });
  }

  return opportunities;
}

function buildManagerSummary({ advisorsAnalyzed, averageScore, teamHealth, dominantBottleneck }) {
  if (!advisorsAnalyzed) {
    return "No hay asesores suficientes para analizar desempeño de equipo.";
  }

  return `Equipo analizado: ${advisorsAnalyzed} asesores. Score promedio: ${averageScore}. Salud del equipo: ${teamHealth}. Bottleneck dominante: ${dominantBottleneck || "sin patron dominante"}.`;
}

function buildRecommendedTeamFocus({ teamHealth, dominantBottleneck, dominantIntent }) {
  if (teamHealth === "GREEN") {
    return "Documentar mejores practicas y elevar el estandar del equipo.";
  }

  if (dominantBottleneck === "NO_RESPONSE_LEAK") {
    return "Primer mensaje, followup y recuperacion de conversaciones sin respuesta.";
  }

  if (dominantBottleneck === "LOW_MEETING_CONVERSION") {
    return "CTA, microcompromisos y conversion de respuesta a cita.";
  }

  if (dominantIntent === "VALUE_NOT_CLEAR") {
    return "Consecuencia antes de producto y valor percibido.";
  }

  if (dominantIntent === "TRUST_ISSUE") {
    return "Confianza, claridad y prueba antes de vender.";
  }

  return "Disciplina comercial, registro de datos y seguimiento semanal.";
}

function buildCouncilOpinions({ advisors, averageScore, dominantBottleneck, dominantIntent }) {
  const totalOutbound = advisors.reduce((sum, advisor) => sum + Number(advisor.metrics?.outbound || 0), 0);
  const advisorsNeedingCoaching = getAdvisorsNeedingCoaching(advisors).length;

  return {
    miranda:
      dominantBottleneck
        ? `What is hurting the team? ${dominantBottleneck} es el patron que mas amenaza claridad y conversion.`
        : "What is hurting the team? Aun no hay patron dominante; cuidar calidad de datos.",
    rocky:
      averageScore < 60
        ? "What activity should increase? Aumentar conversaciones registradas y followups diarios."
        : "What activity should increase? Mantener volumen y subir consistencia en los asesores rezagados.",
    mick:
      dominantIntent
        ? `What skill should be trained? Entrenar manejo de ${dominantIntent}.`
        : "What skill should be trained? Entrenar fundamentos de apertura, followup y CTA.",
    chrisGardner:
      totalOutbound >= advisors.length * 5
        ? "Is prospecting volume sufficient? Hay volumen minimo para revisar patrones."
        : `Is prospecting volume sufficient? No; ${advisorsNeedingCoaching} asesores necesitan mas actividad registrada.`
  };
}

function buildTeamIntelligenceReport(advisorReports = []) {
  const advisors = advisorReports.map(normalizeAdvisor);
  const advisorsAnalyzed = advisors.length;
  const averagePerformanceScore = average(advisors.map(advisor => advisor.performanceScore));
  const strongestAdvisor = pickStrongestAdvisor(advisors);
  const weakestAdvisor = pickWeakestAdvisor(advisors);
  const bottleneckCounts = countOccurrences(advisors.map(advisor => advisor.biggestBottleneck));
  const intentCounts = countOccurrences(advisors.map(advisor => advisor.metrics?.dominantIntent));
  const dominantTeamBottleneck = getDominant(bottleneckCounts).value;
  const dominantTeamIntent = getDominant(intentCounts).value;
  const advisorsNeedingCoaching = getAdvisorsNeedingCoaching(advisors);
  const advisorsPerformingWell = getAdvisorsPerformingWell(advisors);
  const teamHealth = determineTeamHealth({
    averageScore: averagePerformanceScore,
    advisorsAnalyzed,
    advisorsNeedingCoaching: advisorsNeedingCoaching.length
  });
  const coachingOpportunities = buildCoachingOpportunities({
    advisors,
    dominantBottleneck: dominantTeamBottleneck,
    dominantIntent: dominantTeamIntent
  });

  return {
    engine: "NASH_TEAM_INTELLIGENCE_ENGINE",
    version: "0.9",
    advisorsAnalyzed,
    averagePerformanceScore,
    strongestAdvisor,
    weakestAdvisor,
    dominantTeamBottleneck,
    dominantTeamIntent,
    teamHealth,
    advisorsNeedingCoaching: advisorsNeedingCoaching.map(advisor => advisor.advisorId),
    advisorsPerformingWell: advisorsPerformingWell.map(advisor => advisor.advisorId),
    commonBottlenecks: bottleneckCounts,
    commonIntents: intentCounts,
    coachingOpportunities,
    managerSummary: buildManagerSummary({
      advisorsAnalyzed,
      averageScore: averagePerformanceScore,
      teamHealth,
      dominantBottleneck: dominantTeamBottleneck
    }),
    recommendedTeamFocus: buildRecommendedTeamFocus({
      teamHealth,
      dominantBottleneck: dominantTeamBottleneck,
      dominantIntent: dominantTeamIntent
    }),
    councilOpinions: buildCouncilOpinions({
      advisors,
      averageScore: averagePerformanceScore,
      dominantBottleneck: dominantTeamBottleneck,
      dominantIntent: dominantTeamIntent
    })
  };
}

module.exports = {
  buildTeamIntelligenceReport,
  determineTeamHealth,
  getAdvisorsNeedingCoaching,
  getAdvisorsPerformingWell
};
