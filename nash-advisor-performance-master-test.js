const {
  buildAdvisorPerformanceReport,
  buildPerformanceMetrics,
  detectBiggestBottleneck,
  detectStrongestArea,
  scoreAdvisorPerformance
} = require("./nash-advisor-performance-engine");

console.log("\nFORGE NASH ADVISOR PERFORMANCE ENGINE TEST v0.6\n");

const fixtureMemories = [
  {
    prospectId: "MARIA_TEST_001",
    conversationHistory: [
      {
        direction: "OUTBOUND",
        message: "Hola Maria, queria abrir una conversacion breve."
      },
      {
        direction: "INBOUND",
        message: "Esta caro."
      }
    ],
    objectionHistory: [
      {
        type: "FINANCIAL",
        intent: "VALUE_NOT_CLEAR"
      }
    ],
    actionHistory: [
      {
        action: "FOLLOWUP_SENT",
        outcome: "NO_RESPONSE"
      }
    ],
    lastOutcome: "NO_RESPONSE"
  },
  {
    prospectId: "JUAN_TEST_001",
    conversationHistory: [
      {
        direction: "OUTBOUND",
        message: "Hola Juan, te escribo por una revision breve."
      },
      {
        direction: "INBOUND",
        message: "Va, lo vemos manana."
      }
    ],
    objectionHistory: [
      {
        type: "UNKNOWN",
        intent: "READY_TO_MEET"
      }
    ],
    actionHistory: [
      {
        action: "SCHEDULE_APPOINTMENT",
        outcome: "MEETING_SCHEDULED"
      }
    ],
    lastOutcome: "MEETING_SCHEDULED"
  }
];

const report = buildAdvisorPerformanceReport({
  advisorId: "JORGE",
  memories: fixtureMemories
});

console.log("Advisor Performance Report\n");
console.log(`Advisor: ${report.advisorId}`);
console.log(`Score: ${report.performanceScore}`);
console.log(`Bottleneck: ${report.biggestBottleneck}`);
console.log(`Strongest Area: ${report.strongestArea}`);
console.log(`Recommendation: ${report.recommendation}`);

console.log("\nMetrics\n");
console.log(`Conversations: ${report.metrics.conversations}`);
console.log(`Responses: ${report.metrics.responses}`);
console.log(`No Responses: ${report.metrics.noResponses}`);
console.log(`Objections: ${report.metrics.objections}`);
console.log(`Dominant Objection: ${report.metrics.dominantObjection}`);
console.log(`Dominant Intent: ${report.metrics.dominantIntent}`);
console.log(`Followup Effectiveness: ${report.metrics.followupEffectiveness.rate}%`);
console.log(`Meeting Signals: ${report.metrics.meetingSignals}`);
console.log(`Relationship Opportunities: ${report.metrics.relationshipOpportunities}`);

const tests = [
  {
    name: "Genera reporte",
    pass: report.engine === "NASH_ADVISOR_PERFORMANCE_ENGINE"
  },
  {
    name: "Incluye advisor",
    pass: report.advisorId === "JORGE"
  },
  {
    name: "Score esta entre 0 y 100",
    pass: report.performanceScore >= 0 && report.performanceScore <= 100
  },
  {
    name: "Incluye bottleneck",
    pass: typeof report.biggestBottleneck === "string" && report.biggestBottleneck.length > 3
  },
  {
    name: "Incluye strongest area",
    pass: typeof report.strongestArea === "string" && report.strongestArea.length > 3
  },
  {
    name: "Incluye recomendacion",
    pass: report.recommendation.length > 20
  },
  {
    name: "Mide conversaciones",
    pass: report.metrics.conversations === 4
  },
  {
    name: "Mide respuestas",
    pass: report.metrics.responses === 2
  },
  {
    name: "Mide no responses",
    pass: report.metrics.noResponses === 1
  },
  {
    name: "Mide objeciones",
    pass: report.metrics.objections === 2
  },
  {
    name: "Detecta objecion dominante",
    pass: report.metrics.dominantObjection === "FINANCIAL" || report.metrics.dominantObjection === "UNKNOWN"
  },
  {
    name: "Detecta intent dominante",
    pass: ["VALUE_NOT_CLEAR", "READY_TO_MEET"].includes(report.metrics.dominantIntent)
  },
  {
    name: "Mide followup effectiveness",
    pass: report.metrics.followupEffectiveness.rate === 0
  },
  {
    name: "Mide meeting signals",
    pass: report.metrics.meetingSignals >= 1
  },
  {
    name: "Mide relationship opportunities",
    pass: typeof report.metrics.relationshipOpportunities === "number"
  },
  {
    name: "Exporta funciones puras",
    pass:
      typeof buildPerformanceMetrics === "function" &&
      typeof detectBiggestBottleneck === "function" &&
      typeof detectStrongestArea === "function" &&
      typeof scoreAdvisorPerformance === "function"
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
  console.log("\n✅ NASH ADVISOR PERFORMANCE ENGINE v0.6 PASS");
} else {
  console.log("\n❌ NASH ADVISOR PERFORMANCE ENGINE NEEDS REVIEW");
  process.exit(1);
}
