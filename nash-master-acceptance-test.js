const fs = require("fs");
const path = require("path");
const { buildProspectContext } = require("./nash-prospect-context-builder");
const { detectPersonality } = require("./nash-personality-engine");
const { detectNashIntent } = require("./nash-intent-engine");
const { runNashCombat } = require("./nash-combat-orchestrator");
const {
  appendConversation,
  appendObjection,
  updateOutcome,
  loadMemory
} = require("./nash-memory-engine");
const { buildLearningReport } = require("./nash-learning-engine");
const { buildNextBestAction } = require("./nash-next-best-action-engine");
const { buildAdvisorPerformanceReport } = require("./nash-advisor-performance-engine");
const { buildCoachingInsight } = require("./nash-coaching-insight-engine");
const { buildManagerAlert } = require("./nash-manager-alert-engine");
const { buildTeamIntelligenceReport } = require("./nash-team-intelligence-engine");
const { runNashMasterIntelligence } = require("./nash-master-intelligence-engine");

const prospectId = "MARIA_ACCEPTANCE_001";
const advisorId = "JORGE";
const incomingMessage = "No tengo dinero ahorita y además ya tengo seguro.";
const memoryFile = path.join(__dirname, "nash-memory", "maria_acceptance_001.json");

if (fs.existsSync(memoryFile)) {
  fs.unlinkSync(memoryFile);
}

const context = buildProspectContext({
  source: "acceptance-test",
  channel: "whatsapp",
  prospect: {
    name: "María",
    age: 38,
    occupation: "Arquitecta",
    maritalStatus: "Casada",
    children: 2
  },
  notes: [
    "Tiene hijos",
    "Le importa su familia",
    "Busca tranquilidad"
  ]
});

const personality = detectPersonality({
  ...context,
  notes: context.notes
});

const intent = detectNashIntent({
  text: incomingMessage,
  context,
  personality
});

const combat = runNashCombat({
  objection: incomingMessage,
  context,
  personality
});

appendConversation({
  prospectId,
  direction: "OUTBOUND",
  message: "Hola María, quería abrir una conversación breve.",
  channel: "whatsapp"
});

appendConversation({
  prospectId,
  direction: "INBOUND",
  message: incomingMessage,
  channel: "whatsapp"
});

appendObjection({
  prospectId,
  objection: incomingMessage,
  type: combat.type,
  intent: intent.primaryIntent
});

updateOutcome({
  prospectId,
  action: "OBJECTION_RECORDED",
  outcome: "NEEDS_RESPONSE"
});

const memory = loadMemory(prospectId);
const learningReport = buildLearningReport({
  advisorId
});

const nextBestAction = buildNextBestAction({
  responseStatus: "RESPONDED",
  objectionType: combat.type,
  objectionIntent: intent.primaryIntent,
  personality: personality.personality
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

const masterIntelligence = runNashMasterIntelligence({
  advisorId,
  prospectId,
  incomingMessage
});

const tests = [
  {
    name: "Context loaded",
    pass: context.name === "María" && context.age === 38
  },
  {
    name: "Personality detected",
    pass: personality.personality === "PROTECTOR"
  },
  {
    name: "Intent detected",
    pass:
      intent.primaryIntent === "REAL_BUDGET_CONSTRAINT" ||
      intent.primaryIntent === "ALREADY_SOLVED"
  },
  {
    name: "Objection detected",
    pass: combat.type === "FINANCIAL" || combat.type === "ALREADY_COVERED"
  },
  {
    name: "Response generated",
    pass: combat.response.length > 50
  },
  {
    name: "Next Best Action generated",
    pass: !!nextBestAction.action
  },
  {
    name: "Memory saved",
    pass:
      fs.existsSync(memoryFile) &&
      memory.conversationHistory.length === 2 &&
      memory.objectionHistory.length === 1
  },
  {
    name: "Learning report available",
    pass:
      learningReport.engine === "NASH_LEARNING_ENGINE" &&
      learningReport.stats.prospects >= 1
  },
  {
    name: "Advisor insight available",
    pass:
      advisorPerformance.engine === "NASH_ADVISOR_PERFORMANCE_ENGINE" &&
      advisorPerformance.performanceScore >= 0
  },
  {
    name: "Coaching insight available",
    pass:
      coachingInsight.engine === "NASH_COACHING_INSIGHT_BRIDGE" &&
      !!coachingInsight.coachingPriority
  },
  {
    name: "Manager insight available",
    pass:
      managerInsight.engine === "NASH_MANAGER_ALERT_ENGINE" &&
      !!managerInsight.alertLevel
  },
  {
    name: "Team insight available",
    pass:
      teamInsight.engine === "NASH_TEAM_INTELLIGENCE_ENGINE" &&
      teamInsight.advisorsAnalyzed === 1
  },
  {
    name: "Master intelligence available",
    pass:
      masterIntelligence.engine === "NASH_MASTER_INTELLIGENCE_ENGINE" &&
      masterIntelligence.confidence >= 0
  }
];

console.log("\n=========================");
console.log("NASH MASTER REPORT");
console.log("=========================\n");

console.log(`Prospect: ${context.name}`);
console.log(`Personality: ${personality.personality}`);
console.log(`Intent: ${intent.primaryIntent}`);
console.log(`Objection: ${combat.type}`);
console.log(`Psychology: ${masterIntelligence.psychology.psychology}`);
console.log(`Recommended Response: ${combat.response}`);
console.log(`Next Best Action: ${nextBestAction.action}`);
console.log(`Advisor Insight: ${advisorPerformance.biggestBottleneck} / Score ${advisorPerformance.performanceScore}`);
console.log(`Coaching Insight: ${coachingInsight.coachingPriority}`);
console.log(`Manager Insight: ${managerInsight.alertLevel} / ${managerInsight.detectedRisk}`);
console.log(`Team Insight: ${teamInsight.teamHealth} / ${teamInsight.dominantTeamBottleneck}`);
console.log(`Confidence: ${masterIntelligence.confidence}`);

console.log("\nResultados\n");

tests.forEach(test => {
  console.log(`${test.pass ? "✅" : "❌"} ${test.name}`);
});

const pass = tests.filter(test => test.pass).length;
const fail = tests.length - pass;
const coverage = Math.round((pass / tests.length) * 100);

console.log("\nTotal Tests");
console.log(tests.length);
console.log("Pass");
console.log(pass);
console.log("Fail");
console.log(fail);
console.log("Coverage");
console.log(`${coverage}%`);

if (fail === 0) {
  console.log("\n✅ NASH FOUNDATION READY");
} else {
  console.log("\n❌ NASH FOUNDATION NEEDS REVIEW");
  process.exit(1);
}
