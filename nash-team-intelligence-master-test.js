const {
  buildTeamIntelligenceReport,
  determineTeamHealth
} = require("./nash-team-intelligence-engine");

console.log("\nFORGE NASH TEAM INTELLIGENCE ENGINE TEST v0.9\n");

const advisorReports = [
  {
    advisorId: "ANA",
    performanceScore: 82,
    biggestBottleneck: "NO_MAJOR_BOTTLENECK_DETECTED",
    strongestArea: "MEETING_CREATION",
    recommendation: "Escalar lo que funciona.",
    metrics: {
      conversations: 18,
      outbound: 12,
      responses: 8,
      responseRate: 67,
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
      relationshipOpportunities: 2
    }
  },
  {
    advisorId: "LUIS",
    performanceScore: 48,
    biggestBottleneck: "NO_RESPONSE_LEAK",
    strongestArea: "ACTIVITY_FOUNDATION",
    recommendation: "Optimizar followup.",
    metrics: {
      conversations: 10,
      outbound: 8,
      responses: 2,
      responseRate: 25,
      noResponses: 4,
      noResponseRate: 50,
      objections: 2,
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
  },
  {
    advisorId: "MARCO",
    performanceScore: 58,
    biggestBottleneck: "NO_RESPONSE_LEAK",
    strongestArea: "OBJECTION_CAPTURE",
    recommendation: "Mejorar valor percibido.",
    metrics: {
      conversations: 12,
      outbound: 9,
      responses: 3,
      responseRate: 33,
      noResponses: 3,
      noResponseRate: 45,
      objections: 3,
      dominantObjection: "FINANCIAL",
      dominantIntent: "VALUE_NOT_CLEAR",
      followupEffectiveness: {
        total: 2,
        positive: 0,
        rate: 0
      },
      meetingSignals: 0,
      relationshipOpportunities: 1
    }
  }
];

const report = buildTeamIntelligenceReport(advisorReports);

console.log("Team Intelligence Report\n");
console.log(`Advisors: ${report.advisorsAnalyzed}`);
console.log(`Average Score: ${report.averagePerformanceScore}`);
console.log(`Strongest: ${report.strongestAdvisor.advisorId}`);
console.log(`Weakest: ${report.weakestAdvisor.advisorId}`);
console.log(`Dominant Bottleneck: ${report.dominantTeamBottleneck}`);
console.log(`Dominant Intent: ${report.dominantTeamIntent}`);
console.log(`Team Health: ${report.teamHealth}`);
console.log(`Recommended Focus: ${report.recommendedTeamFocus}`);
console.log(`Summary: ${report.managerSummary}`);

const tests = [
  {
    name: "Team aggregation",
    pass: report.advisorsAnalyzed === 3
  },
  {
    name: "Average score",
    pass: report.averagePerformanceScore === 63
  },
  {
    name: "Strongest advisor",
    pass: report.strongestAdvisor.advisorId === "ANA"
  },
  {
    name: "Weakest advisor",
    pass: report.weakestAdvisor.advisorId === "LUIS"
  },
  {
    name: "Dominant bottleneck",
    pass: report.dominantTeamBottleneck === "NO_RESPONSE_LEAK"
  },
  {
    name: "Dominant intent",
    pass: report.dominantTeamIntent === "VALUE_NOT_CLEAR"
  },
  {
    name: "Team health",
    pass: report.teamHealth === "YELLOW" || report.teamHealth === "ORANGE"
  },
  {
    name: "Coaching opportunities",
    pass:
      Array.isArray(report.coachingOpportunities) &&
      report.coachingOpportunities.length >= 2
  },
  {
    name: "Manager summary",
    pass: report.managerSummary.length > 40
  },
  {
    name: "Council opinions",
    pass:
      typeof report.councilOpinions.miranda === "string" &&
      typeof report.councilOpinions.rocky === "string" &&
      typeof report.councilOpinions.mick === "string" &&
      typeof report.councilOpinions.chrisGardner === "string"
  },
  {
    name: "Detecta advisors needing coaching",
    pass:
      report.advisorsNeedingCoaching.includes("LUIS") &&
      report.advisorsNeedingCoaching.includes("MARCO")
  },
  {
    name: "Detecta advisors performing well",
    pass: report.advisorsPerformingWell.includes("ANA")
  },
  {
    name: "Exporta health helper",
    pass:
      determineTeamHealth({
        averageScore: 80,
        advisorsAnalyzed: 4,
        advisorsNeedingCoaching: 1
      }) === "GREEN"
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
  console.log("\n✅ NASH TEAM INTELLIGENCE ENGINE v0.9 PASS");
} else {
  console.log("\n❌ NASH TEAM INTELLIGENCE ENGINE NEEDS REVIEW");
  process.exit(1);
}
