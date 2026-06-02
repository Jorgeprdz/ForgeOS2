const {
  buildCoachingInsight,
  detectCoachingPriority
} = require("./nash-coaching-insight-engine");

console.log("\nFORGE NASH COACHING INSIGHT BRIDGE TEST v0.7\n");

const noResponseReport = {
  advisorId: "JORGE",
  performanceScore: 47,
  biggestBottleneck: "NO_RESPONSE_LEAK",
  strongestArea: "ACTIVITY_FOUNDATION",
  recommendation:
    "Optimizar primer mensaje y followups.",
  metrics: {
    conversations: 10,
    responses: 2,
    noResponses: 5,
    noResponseRate: 70,
    objections: 1,
    dominantObjection: "UNKNOWN",
    dominantIntent: "UNKNOWN",
    followupEffectiveness: {
      total: 3,
      positive: 0,
      rate: 0
    },
    meetingSignals: 0,
    relationshipOpportunities: 0
  }
};

const valueNotClearReport = {
  advisorId: "JORGE",
  performanceScore: 55,
  biggestBottleneck: "VALUE_NOT_CLEAR",
  strongestArea: "OBJECTION_CAPTURE",
  recommendation:
    "Mover la conversacion de precio a consecuencia.",
  metrics: {
    conversations: 8,
    responses: 4,
    noResponses: 1,
    noResponseRate: 20,
    objections: 3,
    dominantObjection: "TIME",
    dominantIntent: "VALUE_NOT_CLEAR",
    followupEffectiveness: {
      total: 2,
      positive: 1,
      rate: 50
    },
    meetingSignals: 1,
    relationshipOpportunities: 0
  }
};

const lowMeetingReport = {
  advisorId: "JORGE",
  performanceScore: 58,
  biggestBottleneck: "LOW_MEETING_SIGNAL",
  strongestArea: "RESPONSE_GENERATION",
  recommendation:
    "Convertir respuestas en microcompromisos.",
  metrics: {
    conversations: 12,
    responses: 6,
    noResponses: 1,
    noResponseRate: 15,
    objections: 1,
    dominantObjection: "UNKNOWN",
    dominantIntent: "NEEDS_CLARITY",
    followupEffectiveness: {
      total: 2,
      positive: 1,
      rate: 50
    },
    meetingSignals: 0,
    relationshipOpportunities: 0
  }
};

const financialReport = {
  advisorId: "JORGE",
  performanceScore: 52,
  biggestBottleneck: "UNKNOWN",
  strongestArea: "OBJECTION_CAPTURE",
  recommendation:
    "Trabajar valor percibido.",
  metrics: {
    conversations: 6,
    responses: 3,
    noResponses: 1,
    noResponseRate: 20,
    objections: 3,
    dominantObjection: "FINANCIAL",
    dominantIntent: "REAL_BUDGET_CONSTRAINT",
    followupEffectiveness: {
      total: 1,
      positive: 1,
      rate: 100
    },
    meetingSignals: 1,
    relationshipOpportunities: 0
  }
};

const relationshipReport = {
  advisorId: "JORGE",
  performanceScore: 72,
  biggestBottleneck: "STRONG_RELATIONSHIP_OPPORTUNITY",
  strongestArea: "RELATIONSHIP_TIMING",
  recommendation:
    "Aprovechar momentos relacionales.",
  metrics: {
    conversations: 10,
    responses: 5,
    noResponses: 1,
    noResponseRate: 10,
    objections: 1,
    dominantObjection: "UNKNOWN",
    dominantIntent: "UNKNOWN",
    followupEffectiveness: {
      total: 2,
      positive: 1,
      rate: 50
    },
    meetingSignals: 1,
    relationshipOpportunities: 3
  }
};

const noResponseCoaching = buildCoachingInsight(noResponseReport);
const valueCoaching = buildCoachingInsight(valueNotClearReport);
const lowMeetingCoaching = buildCoachingInsight(lowMeetingReport);
const financialCoaching = buildCoachingInsight(financialReport);
const relationshipCoaching = buildCoachingInsight(relationshipReport);

console.log("Coaching Insight\n");
console.log(`Advisor: ${noResponseCoaching.advisorId}`);
console.log(`Priority: ${noResponseCoaching.coachingPriority}`);
console.log(`Insight: ${noResponseCoaching.coachingInsight}`);
console.log(`Training: ${noResponseCoaching.trainingFocus}`);
console.log(`Drill: ${noResponseCoaching.suggestedDrill}`);
console.log(`Weekly Plan: ${noResponseCoaching.weeklyActionPlan}`);
console.log(`Manager Alert: ${noResponseCoaching.managerAlert}`);
console.log(`Rocky & Mick: ${noResponseCoaching.rockyMickNote}`);

const tests = [
  {
    name: "Genera coaching insight",
    pass:
      noResponseCoaching.engine === "NASH_COACHING_INSIGHT_BRIDGE" &&
      noResponseCoaching.coachingInsight.length > 30
  },
  {
    name: "Detecta prioridad de coaching",
    pass: noResponseCoaching.coachingPriority === "FIRST_MESSAGE_AND_FOLLOWUP"
  },
  {
    name: "Genera trainingFocus",
    pass: noResponseCoaching.trainingFocus.length > 10
  },
  {
    name: "Genera suggestedDrill",
    pass: noResponseCoaching.suggestedDrill.length > 10
  },
  {
    name: "Genera weeklyActionPlan",
    pass: noResponseCoaching.weeklyActionPlan.length > 10
  },
  {
    name: "Genera managerAlert",
    pass: noResponseCoaching.managerAlert.length > 10
  },
  {
    name: "Incluye Rocky & Mick note",
    pass:
      /Rocky/i.test(noResponseCoaching.rockyMickNote) &&
      /Mick/i.test(noResponseCoaching.rockyMickNote)
  },
  {
    name: "Caso NO_RESPONSE",
    pass:
      detectCoachingPriority(noResponseReport) === "FIRST_MESSAGE_AND_FOLLOWUP"
  },
  {
    name: "Caso VALUE_NOT_CLEAR",
    pass:
      valueCoaching.coachingPriority === "CONSEQUENCE_BEFORE_PRODUCT"
  },
  {
    name: "Caso LOW_MEETING_SIGNAL",
    pass:
      lowMeetingCoaching.coachingPriority === "CTA_MICROCOMMITMENT"
  },
  {
    name: "Caso FINANCIAL objection",
    pass:
      financialCoaching.coachingPriority === "PERCEIVED_VALUE"
  },
  {
    name: "Caso STRONG_RELATIONSHIP_OPPORTUNITY",
    pass:
      relationshipCoaching.coachingPriority === "REFERRAL_AND_RELATIONSHIP"
  }
];

console.log("\nResultados\n");

tests.forEach(test => {
  console.log(`${test.pass ? "✅" : "❌"} ${test.name}`);
});

const pass = tests.filter(t => t.pass).length;
const fail = tests.length - pass;

console.log("\nResumen:");
console.log(`Total: ${tests.length}`);
console.log(`Pass: ${pass}`);
console.log(`Fail: ${fail}`);

if (fail === 0) {
  console.log("\n✅ NASH COACHING INSIGHT BRIDGE v0.7 PASS");
} else {
  console.log("\n❌ NASH COACHING INSIGHT BRIDGE NEEDS REVIEW");
  process.exit(1);
}
