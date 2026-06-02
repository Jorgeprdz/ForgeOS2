function normalizePerformance(performance = {}) {
  return {
    advisorId: performance.advisorId || "UNKNOWN",
    performanceScore: Number(performance.performanceScore || 0),
    biggestBottleneck: performance.biggestBottleneck || "UNKNOWN",
    strongestArea: performance.strongestArea || "UNKNOWN",
    recommendation: performance.recommendation || "",
    metrics: performance.metrics || {}
  };
}

function normalizeCoaching(coaching = {}) {
  return {
    advisorId: coaching.advisorId || "UNKNOWN",
    coachingPriority: coaching.coachingPriority || "GENERAL_SALES_DISCIPLINE",
    coachingInsight: coaching.coachingInsight || "",
    trainingFocus: coaching.trainingFocus || "",
    suggestedDrill: coaching.suggestedDrill || "",
    weeklyActionPlan: coaching.weeklyActionPlan || "",
    managerAlert: coaching.managerAlert || "",
    rockyMickNote: coaching.rockyMickNote || ""
  };
}

function getFollowupRate(metrics = {}) {
  return Number(metrics.followupEffectiveness?.rate || 0);
}

function countBottlenecks(performance = {}) {
  const metrics = performance.metrics || {};
  let count = 0;

  if (performance.biggestBottleneck && performance.biggestBottleneck !== "NO_MAJOR_BOTTLENECK_DETECTED") {
    count += 1;
  }

  if (Number(metrics.noResponseRate || 0) >= 50) count += 1;
  if (Number(metrics.responses || 0) > 0 && Number(metrics.meetingSignals || 0) === 0) count += 1;
  if (metrics.followupEffectiveness?.total > 0 && getFollowupRate(metrics) < 35) count += 1;
  if (metrics.dominantIntent === "TRUST_ISSUE" || metrics.dominantIntent === "VALUE_NOT_CLEAR") count += 1;
  if (metrics.dominantObjection === "FINANCIAL") count += 1;

  return count;
}

function detectRisk(performance = {}, coaching = {}) {
  const metrics = performance.metrics || {};
  const score = Number(performance.performanceScore || 0);
  const bottleneckCount = countBottlenecks(performance);
  const noResponseRate = Number(metrics.noResponseRate || 0);
  const responseRate = Number(metrics.responseRate || 0);
  const noResponses = Number(metrics.noResponses || 0);
  const responses = Number(metrics.responses || 0);
  const meetingSignals = Number(metrics.meetingSignals || 0);

  if (
    bottleneckCount >= 3 ||
    (score < 45 && noResponseRate >= 50) ||
    (noResponseRate >= 50 && meetingSignals === 0 && responses > 0)
  ) {
    return "MULTIPLE_BOTTLENECKS";
  }

  if (
    performance.biggestBottleneck === "NO_RESPONSE_LEAK" ||
    noResponses >= 2 ||
    noResponseRate >= 50
  ) {
    return "REPEATED_NO_RESPONSE";
  }

  if (
    responses > 0 &&
    meetingSignals === 0
  ) {
    return "LOW_MEETING_CONVERSION";
  }

  if (
    responseRate > 0 &&
    responseRate < 35
  ) {
    return "LOW_RESPONSE_RATE";
  }

  if (
    score >= 75 &&
    noResponseRate < 30 &&
    (meetingSignals > 0 || performance.strongestArea === "MEETING_CREATION")
  ) {
    return "HIGH_PERFORMANCE";
  }

  if (coaching.coachingPriority === "FIRST_MESSAGE_AND_FOLLOWUP") {
    return "LOW_RESPONSE_RATE";
  }

  return "MONITORING_NEEDED";
}

function determineAlertLevel(risk) {
  const map = {
    HIGH_PERFORMANCE: "GREEN",
    LOW_RESPONSE_RATE: "YELLOW",
    LOW_MEETING_CONVERSION: "ORANGE",
    REPEATED_NO_RESPONSE: "ORANGE",
    MULTIPLE_BOTTLENECKS: "RED",
    MONITORING_NEEDED: "YELLOW"
  };

  return map[risk] || "YELLOW";
}

function shouldEscalate(alertLevel) {
  return alertLevel === "ORANGE" || alertLevel === "RED";
}

function buildManagerSummary({ performance, coaching, risk, alertLevel }) {
  const summaries = {
    GREEN:
      `El asesor ${performance.advisorId} muestra desempeno saludable. Conviene reforzar lo que ya genera avance.`,
    YELLOW:
      `El asesor ${performance.advisorId} requiere atencion puntual en ${coaching.coachingPriority}.`,
    ORANGE:
      `El asesor ${performance.advisorId} presenta riesgo comercial: ${risk}. Se recomienda intervencion esta semana.`,
    RED:
      `El asesor ${performance.advisorId} acumula multiples frenos comerciales. Requiere revision directa del manager.`
  };

  return summaries[alertLevel] || summaries.YELLOW;
}

function buildRecommendedManagerAction({ risk, coaching }) {
  const actions = {
    HIGH_PERFORMANCE:
      "Documentar mejores practicas del asesor y usarlas como ejemplo para el equipo.",
    LOW_RESPONSE_RATE:
      "Revisar primeros mensajes y followups; corregir apertura, longitud y pregunta final.",
    LOW_MEETING_CONVERSION:
      "Entrenar CTA y microcompromisos; cada respuesta positiva debe cerrar con dos opciones de agenda.",
    REPEATED_NO_RESPONSE:
      "Auditar secuencia de contacto y ajustar timing, canal y followup.",
    MULTIPLE_BOTTLENECKS:
      "Hacer sesion uno a uno; elegir un solo bloqueo principal y medir mejora durante una semana.",
    MONITORING_NEEDED:
      coaching.managerAlert || "Monitorear actividad y calidad de registro durante la semana."
  };

  return actions[risk] || actions.MONITORING_NEEDED;
}

function buildWeeklyFocus({ risk, coaching }) {
  const focus = {
    HIGH_PERFORMANCE: "Escalar practicas efectivas y mantener consistencia.",
    LOW_RESPONSE_RATE: "Primer mensaje y followup.",
    LOW_MEETING_CONVERSION: "CTA, agenda y microcompromiso.",
    REPEATED_NO_RESPONSE: "Recuperacion de conversaciones sin respuesta.",
    MULTIPLE_BOTTLENECKS: "Un bloqueo critico por semana: diagnosticar, entrenar y medir.",
    MONITORING_NEEDED: coaching.trainingFocus || "Disciplina comercial y registro."
  };

  return focus[risk] || focus.MONITORING_NEEDED;
}

function buildCouncilOpinions({ performance, coaching, risk, alertLevel }) {
  const metrics = performance.metrics || {};

  return {
    miranda: {
      question: "¿Qué preocupa?",
      opinion:
        alertLevel === "GREEN"
          ? "No hay alerta critica; cuidar que el buen desempeno se mantenga medible."
          : `Preocupa ${risk}; si no se corrige, afecta claridad, conversion o seguimiento.`
    },
    rocky: {
      question: "¿Qué debe hacer?",
      opinion:
        alertLevel === "RED"
          ? "Volver a las bases esta semana: actividad diaria, seguimiento registrado y una mejora concreta."
          : coaching.weeklyActionPlan || "Ejecutar el plan semanal sin saltarse el registro."
    },
    mick: {
      question: "¿Qué debe entrenar?",
      opinion:
        coaching.trainingFocus || "Entrenar la habilidad comercial ligada al riesgo detectado."
    },
    chrisGardner: {
      question: "¿Hay suficiente actividad?",
      opinion:
        Number(metrics.conversations || 0) >= 10
          ? "Hay suficiente actividad para revisar patrones comerciales."
          : "La actividad registrada es baja; aumentar volumen antes de sacar conclusiones definitivas."
    }
  };
}

function buildManagerAlert(input = {}) {
  const performance = normalizePerformance(input.advisorPerformance || {});
  const coaching = normalizeCoaching(input.coachingInsight || {});
  const advisorId = performance.advisorId !== "UNKNOWN" ? performance.advisorId : coaching.advisorId;
  const normalizedPerformance = {
    ...performance,
    advisorId
  };
  const normalizedCoaching = {
    ...coaching,
    advisorId
  };
  const detectedRisk = detectRisk(normalizedPerformance, normalizedCoaching);
  const alertLevel = determineAlertLevel(detectedRisk);

  return {
    engine: "NASH_MANAGER_ALERT_ENGINE",
    version: "0.8",
    advisorId,
    alertLevel,
    managerSummary: buildManagerSummary({
      performance: normalizedPerformance,
      coaching: normalizedCoaching,
      risk: detectedRisk,
      alertLevel
    }),
    detectedRisk,
    coachingPriority: normalizedCoaching.coachingPriority,
    recommendedManagerAction: buildRecommendedManagerAction({
      risk: detectedRisk,
      coaching: normalizedCoaching
    }),
    weeklyFocus: buildWeeklyFocus({
      risk: detectedRisk,
      coaching: normalizedCoaching
    }),
    escalationNeeded: shouldEscalate(alertLevel),
    councilOpinions: buildCouncilOpinions({
      performance: normalizedPerformance,
      coaching: normalizedCoaching,
      risk: detectedRisk,
      alertLevel
    })
  };
}

module.exports = {
  buildManagerAlert,
  detectRisk,
  determineAlertLevel,
  countBottlenecks
};
