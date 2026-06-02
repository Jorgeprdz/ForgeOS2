const {
  runNashMasterIntelligence,
  calculateConfidence
} = require("./nash-master-intelligence-engine");

console.log("\nFORGE NASH MASTER INTELLIGENCE ENGINE TEST v1.0\n");

const result = runNashMasterIntelligence({
  advisorId: "JORGE",
  prospectId: "MARIA_TEST_001",
  incomingMessage: "Está caro, ahorita no tengo dinero"
});

console.log("NASH Master Intelligence\n");
console.log(`Advisor: ${result.advisor.advisorId}`);
console.log(`Prospect: ${result.prospect.prospectId}`);
console.log(`Personality: ${result.personality.personality}`);
console.log(`Intent: ${result.intent.primaryIntent}`);
console.log(`Objection: ${result.objection.type}`);
console.log(`Next Best Action: ${result.nextBestAction.action}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Coaching: ${result.coachingInsight.coachingPriority}`);
console.log(`Manager Alert: ${result.managerInsight.alertLevel}`);
console.log(`Team Health: ${result.teamInsight.teamHealth}`);

const tests = [
  {
    name: "Loads context",
    pass:
      result.prospect.context.name === "MARIA_TEST_001" &&
      result.prospect.context.channel === "whatsapp"
  },
  {
    name: "Loads personality",
    pass:
      !!result.personality.personality &&
      Array.isArray(result.personality.motivators)
  },
  {
    name: "Detects intent",
    pass:
      result.intent.primaryIntent === "REAL_BUDGET_CONSTRAINT" ||
      result.intent.primaryIntent === "VALUE_NOT_CLEAR"
  },
  {
    name: "Generates response recommendation",
    pass: result.recommendedResponse.length > 50
  },
  {
    name: "Generates next best action",
    pass: !!result.nextBestAction.action
  },
  {
    name: "Includes coaching insight",
    pass: !!result.coachingInsight.coachingPriority
  },
  {
    name: "Includes manager insight",
    pass: !!result.managerInsight.alertLevel
  },
  {
    name: "Includes team insight",
    pass:
      typeof result.teamInsight.advisorsAnalyzed === "number" &&
      !!result.teamInsight.teamHealth
  },
  {
    name: "Returns confidence",
    pass: result.confidence >= 0 && result.confidence <= 100
  },
  {
    name: "End-to-end orchestration",
    pass:
      result.engine === "NASH_MASTER_INTELLIGENCE_ENGINE" &&
      result.version === "1.0" &&
      result.advisorInsight.performanceScore >= 0 &&
      result.psychology.psychology.length > 20
  },
  {
    name: "Exports confidence helper",
    pass:
      calculateConfidence({
        intent: { confidence: 80 },
        personality: { confidence: 60 },
        advisorPerformance: { performanceScore: 70 }
      }) === 70
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
  console.log("\n✅ NASH MASTER INTELLIGENCE ENGINE v1.0 PASS");
} else {
  console.log("\n❌ NASH MASTER INTELLIGENCE ENGINE NEEDS REVIEW");
  process.exit(1);
}
