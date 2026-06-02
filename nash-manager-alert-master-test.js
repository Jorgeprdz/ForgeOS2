const {
  buildManagerAlert,
  detectRisk,
  determineAlertLevel
} = require("./nash-manager-alert-engine");

console.log("\nFORGE NASH MANAGER ALERT ENGINE TEST v0.8\n");

function buildCoaching(overrides = {}) {
  return {
    advisorId: "JORGE",
    coachingPriority: "FIRST_MESSAGE_AND_FOLLOWUP",
    coachingInsight: "El asesor necesita mejorar apertura y seguimiento.",
    trainingFocus: "Primer mensaje y followup.",
    suggestedDrill: "Practicar 10 aperturas.",
    weeklyActionPlan: "Enviar mensajes diarios y registrar outcomes.",
    managerAlert: "Revisar longitud y CTA.",
    rockyMickNote: "Rocky: hacer reps. Mick: corregir tecnica.",
    ...overrides
  };
}

function buildPerformance(overrides = {}) {
  return {
    advisorId: "JORGE",
    performanceScore: 50,
    biggestBottleneck: "NO_RESPONSE_LEAK",
    strongestArea: "ACTIVITY_FOUNDATION",
    recommendation: "Optimizar followups.",
    metrics: {
      conversations: 8,
      outbound: 6,
      responses: 2,
      responseRate: 33,
      noResponses: 2,
      noResponseRate: 50,
      objections: 1,
      dominantObjection: "UNKNOWN",
      dominantIntent: "UNKNOWN",
      followupEffectiveness: {
        total: 2,
        positive: 0,
        rate: 0
      },
      meetingSignals: 0,
      relationshipOpportunities: 0
    },
    ...overrides
  };
}

const greenAlert = buildManagerAlert({
  advisorPerformance: buildPerformance({
    performanceScore: 84,
    biggestBottleneck: "NO_MAJOR_BOTTLENECK_DETECTED",
    strongestArea: "MEETING_CREATION",
    metrics: {
      conversations: 16,
      outbound: 10,
      responses: 7,
      responseRate: 70,
      noResponses: 1,
      noResponseRate: 10,
      objections: 2,
      dominantObjection: "UNKNOWN",
      dominantIntent: "READY_TO_MEET",
      followupEffectiveness: {
        total: 3,
        positive: 2,
        rate: 67
      },
      meetingSignals: 4,
      relationshipOpportunities: 1
    }
  }),
  coachingInsight: buildCoaching({
    coachingPriority: "GENERAL_SALES_DISCIPLINE"
  })
});

const yellowAlert = buildManagerAlert({
  advisorPerformance: buildPerformance({
    performanceScore: 62,
    biggestBottleneck: "NO_MAJOR_BOTTLENECK_DETECTED",
    metrics: {
      conversations: 8,
      outbound: 6,
      responses: 1,
      responseRate: 20,
      noResponses: 1,
      noResponseRate: 20,
      objections: 0,
      dominantObjection: null,
      dominantIntent: null,
      followupEffectiveness: {
        total: 1,
        positive: 1,
        rate: 100
      },
      meetingSignals: 1,
      relationshipOpportunities: 0
    }
  }),
  coachingInsight: buildCoaching()
});

const orangeAlert = buildManagerAlert({
  advisorPerformance: buildPerformance({
    performanceScore: 50,
    biggestBottleneck: "NO_RESPONSE_LEAK",
    metrics: {
      conversations: 9,
      outbound: 6,
      responses: 2,
      responseRate: 33,
      noResponses: 2,
      noResponseRate: 50,
      objections: 1,
      dominantObjection: "UNKNOWN",
      dominantIntent: "UNKNOWN",
      followupEffectiveness: {
        total: 0,
        positive: 0,
        rate: 0
      },
      meetingSignals: 1,
      relationshipOpportunities: 0
    }
  }),
  coachingInsight: buildCoaching()
});

const redAlert = buildManagerAlert({
  advisorPerformance: buildPerformance({
    performanceScore: 38,
    biggestBottleneck: "NO_RESPONSE_LEAK",
    metrics: {
      conversations: 12,
      outbound: 9,
      responses: 3,
      responseRate: 33,
      noResponses: 5,
      noResponseRate: 60,
      objections: 4,
      dominantObjection: "FINANCIAL",
      dominantIntent: "VALUE_NOT_CLEAR",
      followupEffectiveness: {
        total: 3,
        positive: 0,
        rate: 0
      },
      meetingSignals: 0,
      relationshipOpportunities: 0
    }
  }),
  coachingInsight: buildCoaching({
    coachingPriority: "CONSEQUENCE_BEFORE_PRODUCT"
  })
});

console.log("Manager Alert Sample\n");
console.log(`Advisor: ${redAlert.advisorId}`);
console.log(`Level: ${redAlert.alertLevel}`);
console.log(`Risk: ${redAlert.detectedRisk}`);
console.log(`Summary: ${redAlert.managerSummary}`);
console.log(`Action: ${redAlert.recommendedManagerAction}`);
console.log(`Weekly Focus: ${redAlert.weeklyFocus}`);
console.log(`Escalation: ${redAlert.escalationNeeded}`);

const tests = [
  {
    name: "GREEN alert",
    pass: greenAlert.alertLevel === "GREEN" && greenAlert.detectedRisk === "HIGH_PERFORMANCE"
  },
  {
    name: "YELLOW alert",
    pass: yellowAlert.alertLevel === "YELLOW" && yellowAlert.detectedRisk === "LOW_RESPONSE_RATE"
  },
  {
    name: "ORANGE alert",
    pass: orangeAlert.alertLevel === "ORANGE" && orangeAlert.detectedRisk === "REPEATED_NO_RESPONSE"
  },
  {
    name: "RED alert",
    pass: redAlert.alertLevel === "RED" && redAlert.detectedRisk === "MULTIPLE_BOTTLENECKS"
  },
  {
    name: "Manager summary",
    pass: redAlert.managerSummary.length > 30
  },
  {
    name: "Coaching priority",
    pass: redAlert.coachingPriority === "CONSEQUENCE_BEFORE_PRODUCT"
  },
  {
    name: "Weekly focus",
    pass: redAlert.weeklyFocus.length > 10
  },
  {
    name: "Escalation logic",
    pass:
      greenAlert.escalationNeeded === false &&
      yellowAlert.escalationNeeded === false &&
      orangeAlert.escalationNeeded === true &&
      redAlert.escalationNeeded === true
  },
  {
    name: "Council opinions",
    pass:
      !!redAlert.councilOpinions.miranda &&
      !!redAlert.councilOpinions.rocky &&
      !!redAlert.councilOpinions.mick &&
      !!redAlert.councilOpinions.chrisGardner
  },
  {
    name: "Exports risk helpers",
    pass:
      typeof detectRisk === "function" &&
      determineAlertLevel("HIGH_PERFORMANCE") === "GREEN"
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
  console.log("\n✅ NASH MANAGER ALERT ENGINE v0.8 PASS");
} else {
  console.log("\n❌ NASH MANAGER ALERT ENGINE NEEDS REVIEW");
  process.exit(1);
}
