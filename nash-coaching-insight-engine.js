function normalizeReport(report = {}) {
  return {
    advisorId: report.advisorId || "UNKNOWN",
    performanceScore: Number(report.performanceScore || 0),
    biggestBottleneck: report.biggestBottleneck || "UNKNOWN",
    strongestArea: report.strongestArea || "UNKNOWN",
    recommendation: report.recommendation || "",
    metrics: report.metrics || {}
  };
}

function getFollowupRate(metrics = {}) {
  return Number(metrics.followupEffectiveness?.rate || 0);
}

function detectCoachingPriority(report = {}) {
  const normalized = normalizeReport(report);
  const metrics = normalized.metrics;
  const bottleneck = normalized.biggestBottleneck;

  if (
    bottleneck === "NO_RESPONSE_LEAK" ||
    /NO_RESPONSE/i.test(bottleneck) ||
    Number(metrics.noResponseRate || 0) >= 50
  ) {
    return "FIRST_MESSAGE_AND_FOLLOWUP";
  }

  if (metrics.dominantObjection === "FINANCIAL") {
    return "PERCEIVED_VALUE";
  }

  if (metrics.dominantIntent === "VALUE_NOT_CLEAR") {
    return "CONSEQUENCE_BEFORE_PRODUCT";
  }

  if (
    bottleneck === "LOW_MEETING_SIGNAL" ||
    bottleneck === "LOW_MEETING_CONVERSION" ||
    (Number(metrics.meetingSignals || 0) === 0 && Number(metrics.responses || 0) > 0)
  ) {
    return "CTA_MICROCOMMITMENT";
  }

  if (
    bottleneck === "LOW_FOLLOWUP_EFFECTIVENESS" ||
    bottleneck === "WEAK_FOLLOWUP_CONVERSION" ||
    (metrics.followupEffectiveness?.total > 0 && getFollowupRate(metrics) < 35)
  ) {
    return "FOLLOWUP_DISCIPLINE";
  }

  if (
    bottleneck === "STRONG_RELATIONSHIP_OPPORTUNITY" ||
    normalized.strongestArea === "RELATIONSHIP_TIMING" ||
    Number(metrics.relationshipOpportunities || 0) > 0
  ) {
    return "REFERRAL_AND_RELATIONSHIP";
  }

  return "GENERAL_SALES_DISCIPLINE";
}

const COACHING_LIBRARY = {
  FIRST_MESSAGE_AND_FOLLOWUP: {
    coachingInsight:
      "El principal freno parece estar en la apertura y la recuperacion de conversaciones sin respuesta.",
    trainingFocus:
      "Primer mensaje con contexto, followup breve y una pregunta simple.",
    suggestedDrill:
      "Escribir 10 primeros mensajes de menos de 55 palabras y 10 followups con una sola pregunta.",
    weeklyActionPlan:
      "Durante 5 dias, enviar nuevos mensajes por la manana y followups 24-48 horas despues; registrar respuesta o silencio.",
    managerAlert:
      "Revisar longitud, claridad y CTA de los mensajes antes de aumentar volumen.",
    rockyMickNote:
      "Rocky: haz las repeticiones aunque haya silencio. Mick: corrige una cosa por ronda, empezando por la apertura."
  },
  PERCEIVED_VALUE: {
    coachingInsight:
      "La objecion financiera indica que el prospecto esta evaluando costo antes de entender valor.",
    trainingFocus:
      "Valor percibido, impacto economico y costo de no actuar.",
    suggestedDrill:
      "Practicar 10 respuestas que validen presupuesto y cambien la conversacion hacia impacto, no precio.",
    weeklyActionPlan:
      "Antes de cotizar, documentar problema, consecuencia y prioridad en cada conversacion con objecion financiera.",
    managerAlert:
      "Acompanhar llamadas o revisar chats donde aparezca precio antes de valor.",
    rockyMickNote:
      "Rocky: no te escondas cuando salga precio. Mick: primero diagnostica valor, luego habla de dinero."
  },
  CONSEQUENCE_BEFORE_PRODUCT: {
    coachingInsight:
      "El prospecto no ve suficiente claridad de valor; necesita entender consecuencia antes de escuchar producto.",
    trainingFocus:
      "Conectar riesgo, consecuencia y prioridad antes de presentar solucion.",
    suggestedDrill:
      "Convertir 10 beneficios de producto en consecuencias concretas de no resolver el problema.",
    weeklyActionPlan:
      "En cada conversacion, hacer una pregunta de consecuencia antes de mencionar producto, plan o poliza.",
    managerAlert:
      "Revisar si el asesor esta explicando producto demasiado pronto.",
    rockyMickNote:
      "Rocky: aguanta la tentacion de vender rapido. Mick: gana claridad antes de lanzar el golpe comercial."
  },
  CTA_MICROCOMMITMENT: {
    coachingInsight:
      "Hay conversacion, pero no se esta convirtiendo en cita o siguiente paso concreto.",
    trainingFocus:
      "CTA claro, microcompromiso y cierre de agenda.",
    suggestedDrill:
      "Practicar 15 cierres de 10-15 minutos con dos opciones de horario.",
    weeklyActionPlan:
      "Cada respuesta positiva debe terminar con una propuesta concreta de dia, hora y duracion.",
    managerAlert:
      "Medir cuantas respuestas se convierten en cita; revisar CTAs debiles.",
    rockyMickNote:
      "Rocky: pide el siguiente paso. Mick: no cierres discursos, cierra microcompromisos."
  },
  FOLLOWUP_DISCIPLINE: {
    coachingInsight:
      "El seguimiento existe, pero no esta generando suficientes respuestas o avances.",
    trainingFocus:
      "Timing, brevedad y nueva razon para responder.",
    suggestedDrill:
      "Crear 3 followups: uno de claridad, uno de consecuencia y uno de cierre suave.",
    weeklyActionPlan:
      "Programar followups por bloques y registrar resultado de cada intento.",
    managerAlert:
      "Auditar followups enviados: si repiten lo mismo, pierden fuerza.",
    rockyMickNote:
      "Rocky: vuelve al trabajo al dia siguiente. Mick: cada followup debe mejorar, no solo insistir."
  },
  REFERRAL_AND_RELATIONSHIP: {
    coachingInsight:
      "Hay senales relacionales que pueden convertirse en confianza, referidos o conversaciones no comerciales.",
    trainingFocus:
      "Relaciones, referidos y centros de influencia.",
    suggestedDrill:
      "Identificar 10 momentos relacionales y escribir una apertura no comercial para cada uno.",
    weeklyActionPlan:
      "Contactar 5 relaciones calidas y pedir 2 introducciones de forma contextual.",
    managerAlert:
      "Revisar si el asesor esta usando momentos de relacion sin sonar transaccional.",
    rockyMickNote:
      "Rocky: cuida la relacion todos los dias. Mick: una buena introduccion vale mas que un mensaje frio."
  },
  GENERAL_SALES_DISCIPLINE: {
    coachingInsight:
      "No hay un cuello de botella dominante con los datos actuales.",
    trainingFocus:
      "Disciplina comercial basica y captura de datos.",
    suggestedDrill:
      "Registrar 20 conversaciones completas con outcome, objecion e intent cuando aplique.",
    weeklyActionPlan:
      "Mantener actividad diaria y mejorar calidad de registro para detectar patrones reales.",
    managerAlert:
      "Asegurar que el asesor registre acciones y resultados antes de inferir desempeno.",
    rockyMickNote:
      "Rocky: primero construye volumen. Mick: sin datos completos no hay entrenamiento preciso."
  }
};

function buildCoachingInsight(performanceReport = {}) {
  const report = normalizeReport(performanceReport);
  const coachingPriority = detectCoachingPriority(report);
  const coaching = COACHING_LIBRARY[coachingPriority] || COACHING_LIBRARY.GENERAL_SALES_DISCIPLINE;

  return {
    engine: "NASH_COACHING_INSIGHT_BRIDGE",
    version: "0.7",
    advisorId: report.advisorId,
    coachingPriority,
    coachingInsight: coaching.coachingInsight,
    trainingFocus: coaching.trainingFocus,
    suggestedDrill: coaching.suggestedDrill,
    weeklyActionPlan: coaching.weeklyActionPlan,
    managerAlert: coaching.managerAlert,
    rockyMickNote: coaching.rockyMickNote
  };
}

module.exports = {
  buildCoachingInsight,
  detectCoachingPriority
};
